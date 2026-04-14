# 「ことばみまもり」サイトからAPI Gateway経由で送信されたテキストデータをAmazon Bedrockに渡して、テキストの文脈解析結果を返却する
import json
import boto3
import re
import logging
from json import JSONDecodeError

# ログ設定
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Amazon Bedrock Runtime クライアント
bedrock = boto3.client("bedrock-runtime")

# CloudWatch クライアント
cloudwatch = boto3.client("cloudwatch")


# Amazon Bedrockレスポンスのパース失敗時、CloudWatchにメトリクスを送信する
def put_parse_error_metric():
    cloudwatch.put_metric_data(
        Namespace="WordsWatchingApp",
        MetricData=[
            {
                "MetricName": "JsonParseError",
                "Value": 1,
                "Unit": "Count"
            }
        ]
    )


# Amazon Bedrockのレスポンス message.content からテキストを取り出す
def extract_bedrock_output_text(response_body: dict) -> str:
    if "choices" not in response_body:
        raise RuntimeError("Unexpected Bedrock response format: choices not found")

    choices = response_body.get("choices", [])
    if not choices:
        raise RuntimeError("Unexpected Bedrock response format: choices is empty")

    message = choices[0].get("message", {})
    content = message.get("content", "")

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts = []

        for item in content:
            if isinstance(item, str):
                parts.append(item)
                continue

            if isinstance(item, dict):
                if isinstance(item.get("text"), str):
                    parts.append(item["text"])
                    continue

                if item.get("type") == "text" and isinstance(item.get("text"), str):
                    parts.append(item["text"])
                    continue

        joined = "\n".join(part for part in parts if part)
        if joined.strip():
            return joined

    raise RuntimeError("Unexpected Bedrock response format: message.content is not supported")


# Amazon Bedrockのテキストデータ解析結果レスポンスから、最初のJSONオブジェクト候補を安全に抽出する
def extract_json_block(text: str) -> str:
    cleaned = text.strip().replace("\ufeff", "")

    # ```json ... ``` / ``` ... ``` を優先して中身だけ取り出す
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned, re.IGNORECASE)
    if match:
        cleaned = match.group(1).strip()

    start = cleaned.find("{")
    if start == -1:
        raise ValueError("JSON start not found")

    depth = 0
    in_string = False
    escape = False

    for index in range(start, len(cleaned)):
        char = cleaned[index]

        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return cleaned[start:index + 1]

    raise ValueError("JSON end not found")


# JSONとして読みやすいように、よくある崩れ方を軽く補正する
def normalize_json_text(text: str) -> str:
    normalized = text.strip().replace("\ufeff", "")
    normalized = normalized.replace("\r\n", "\n").replace("\r", "\n")

    # スマートクォート対策
    normalized = normalized.replace("“", '"').replace("”", '"')
    normalized = normalized.replace("‟", '"').replace("„", '"')
    normalized = normalized.replace("’", "'").replace("‘", "'")

    # 全角コロン、読点などの軽微補正
    normalized = normalized.replace("：", ":")
    normalized = normalized.replace("，", ",")

    # 末尾カンマ対策
    normalized = re.sub(r",(\s*[}\]])", r"\1", normalized)

    # 配列先頭の余計なカンマ対策
    normalized = re.sub(r"\[\s*,", "[", normalized)

    # オブジェクト/配列内の連続カンマ対策
    normalized = re.sub(r",\s*,+", ",", normalized)

    return normalized


# 壊れたJSON文字列内で、指定フィールドの値の開始位置を探す
def find_field_value_start(source: str, field_name: str) -> int:
    pattern = re.compile(rf'"{re.escape(field_name)}"\s*:\s*', re.DOTALL)
    match = pattern.search(source)
    if not match:
        return -1
    return match.end()


# フィールド値の文字列を、次のトップレベルのキー手前までゆるく抽出する
def extract_field_segment(source: str, field_name: str) -> str:
    start = find_field_value_start(source, field_name)
    if start == -1:
        return ""

    remaining = source[start:]

    # 文字列なら最初の1要素を抜く
    if remaining.startswith('"'):
        escaped = False
        collected = ['"']

        for char in remaining[1:]:
            collected.append(char)

            if escaped:
                escaped = False
                continue

            if char == "\\":
                escaped = True
                continue

            if char == '"':
                break

        return "".join(collected)

    # 配列なら対応する ] まで抜く
    if remaining.startswith("["):
        depth = 0
        in_string = False
        escape = False
        collected = []

        for char in remaining:
            collected.append(char)

            if in_string:
                if escape:
                    escape = False
                elif char == "\\":
                    escape = True
                elif char == '"':
                    in_string = False
                continue

            if char == '"':
                in_string = True
            elif char == "[":
                depth += 1
            elif char == "]":
                depth -= 1
                if depth == 0:
                    break

        return "".join(collected)

    # それ以外は次のキー手前までゆるく取得
    next_key_match = re.search(r'\n\s*"[A-Za-z_][A-Za-z0-9_]*"\s*:', remaining)
    if next_key_match:
        return remaining[:next_key_match.start()].strip()

    return remaining.strip()


# "summary": "..." のような文字列をゆるく抽出する
def extract_string_field_loose(source: str, field_name: str) -> str:
    segment = extract_field_segment(source, field_name)
    if not segment:
        return ""

    segment = segment.strip()

    if segment.startswith('"') and segment.endswith('"') and len(segment) >= 2:
        value = segment[1:-1]
        value = value.replace('\\"', '"')
        value = value.replace("\\n", "\n")
        return value.strip()

    # 壊れている場合の保険
    segment = segment.strip().strip(",")
    segment = segment.strip('"').strip()
    return segment


# 配列文字列を、トップレベルのカンマでゆるく分割する
def split_array_items_loose(array_body: str) -> list[str]:
    items = []
    current = []

    in_string = False
    escape = False
    bracket_depth = 0
    brace_depth = 0

    for char in array_body:
        if in_string:
            current.append(char)

            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
            current.append(char)
            continue

        if char == "[":
            bracket_depth += 1
            current.append(char)
            continue

        if char == "]":
            bracket_depth = max(0, bracket_depth - 1)
            current.append(char)
            continue

        if char == "{":
            brace_depth += 1
            current.append(char)
            continue

        if char == "}":
            brace_depth = max(0, brace_depth - 1)
            current.append(char)
            continue

        if char == "," and bracket_depth == 0 and brace_depth == 0:
            item = "".join(current).strip()
            if item:
                items.append(item)
            current = []
            continue

        current.append(char)

    last_item = "".join(current).strip()
    if last_item:
        items.append(last_item)

    return items


# 配列要素をゆるく整形する
def clean_loose_item(item: str) -> str:
    cleaned = item.strip()

    cleaned = re.sub(r"^\s*,\s*", "", cleaned)
    cleaned = re.sub(r",\s*$", "", cleaned)

    cleaned = cleaned.strip()

    if cleaned.startswith('"') and cleaned.endswith('"') and len(cleaned) >= 2:
        cleaned = cleaned[1:-1]
        cleaned = cleaned.replace('\\"', '"')
        cleaned = cleaned.replace("\\n", "\n")
        return cleaned.strip()

    cleaned = cleaned.strip('"').strip()
    return cleaned


# 壊れたJSON配列から、項目をゆるく救出する
def extract_list_items_loose(source: str, field_name: str) -> list[str]:
    segment = extract_field_segment(source, field_name)
    if not segment:
        return []

    segment = segment.strip()
    if not segment.startswith("["):
        return []

    # 末尾の ] がなければ、先頭 [ を外してそのまま使う
    array_body = segment[1:-1] if segment.endswith("]") else segment[1:]

    raw_items = split_array_items_loose(array_body)

    items = []
    seen = set()

    for raw_item in raw_items:
        cleaned = clean_loose_item(raw_item)

        if not cleaned:
            continue

        if cleaned in ["[", "]", "{", "}", ",", "、", "。", "「", "」"]:
            continue

        if len(cleaned) <= 1:
            continue

        if cleaned not in seen:
            seen.add(cleaned)
            items.append(cleaned)

    return items


# JSONとして壊れていても、必要な4項目だけ救出する
def recover_result_from_broken_json(text: str) -> dict:
    source = text.strip()

    risk_match = re.search(r'"risk"\s*:\s*"(low|medium|high)"', source, re.IGNORECASE)
    risk = risk_match.group(1).lower() if risk_match else "medium"

    summary = extract_string_field_loose(source, "summary")
    reasons = extract_list_items_loose(source, "reasons")
    suggestions = extract_list_items_loose(source, "suggestions")

    if not summary:
        summary = "文章の受け取られ方について、注意が必要な可能性があります。"

    if not reasons:
        reasons = [
            "文章の受け取られ方について、注意が必要な可能性があります。"
        ]

    return {
        "risk": risk,
        "summary": summary,
        "reasons": reasons[:3],
        "suggestions": suggestions[:3]
    }


# モデル出力からJSONを安全にパースする
def parse_model_json(output_text: str) -> dict:
    json_text = extract_json_block(output_text)

    # まずはそのまま厳密に読む
    try:
        return json.loads(json_text)
    except JSONDecodeError:
        pass

    # よくある崩れだけ軽く補正して再トライ
    normalized_json_text = normalize_json_text(json_text)
    try:
        return json.loads(normalized_json_text)
    except JSONDecodeError as e:
        # 個人情報配慮のため全文は出さず、エラー周辺だけ短くログ出し
        error_start = max(0, e.pos - 80)
        error_end = min(len(normalized_json_text), e.pos + 80)
        logger.warning(
            "Broken JSON near parse error: %s",
            normalized_json_text[error_start:error_end]
        )

    # 最後の保険: 壊れたJSON風文字列から必要項目だけ救出
    return recover_result_from_broken_json(normalized_json_text)


# 応答データの最低限の整形を行う
def sanitize_result(result: dict) -> dict:
    if not isinstance(result, dict):
        raise ValueError("Parsed result is not a JSON object")

    risk = result.get("risk", "medium")
    if risk not in ["low", "medium", "high"]:
        risk = "medium"

    summary = result.get("summary", "")
    if not isinstance(summary, str) or not summary.strip():
        summary = "文章の受け取られ方について、注意が必要な可能性があります。"

    reasons = result.get("reasons", [])
    if not isinstance(reasons, list):
        reasons = []

    reasons = [
        item for item in reasons
        if isinstance(item, str)
        and item.strip()
        and item.strip() not in ["、", ",", "。", "「", "」"]
    ]
    reasons = reasons[:3]

    if not reasons:
        reasons = [
            "文章の受け取られ方について、注意が必要な可能性があります。"
        ]

    suggestions = result.get("suggestions", [])
    if not isinstance(suggestions, list):
        suggestions = []

    suggestions = [
        item for item in suggestions
        if isinstance(item, str)
        and item.strip()
        and item.strip() not in ["、", ",", "。", "「", "」"]
    ]
    suggestions = suggestions[:3]

    return {
        "risk": risk,
        "summary": summary,
        "reasons": reasons,
        "suggestions": suggestions
    }


# Lambdaハンドラー
def lambda_handler(event, context):
    try:
        # -----------------------------
        # 1. リクエストボディの取得
        # -----------------------------
        raw_body = event.get("body")

        if raw_body is None:
            body = event
        elif isinstance(raw_body, str):
            body = json.loads(raw_body)
        else:
            body = raw_body

        text = body.get("text", "").strip()

        if not text:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                "body": json.dumps({"error": "文章が入力されていません。"}, ensure_ascii=False)
            }

        # -----------------------------
        # 2. プロンプト構築
        # -----------------------------
        system_prompt = (
            "あなたは、日本語テキストの受け取られ方を確認するアシスタントです。\n"
            "目的は、投稿前の文章について、誤解や反発を招く可能性がある点を整理して提示することです。\n\n"
            "以下を必ず守ってください：\n"
            "- 表現を裁かない\n"
            "- 正誤や善悪の判断をしない\n"
            "- 投稿を禁止・指示しない\n"
            "- 出力は必ずJSONのみ\n"
            "- 不要な説明文は書かない\n"
            "- JSONの構文に使う引用符は、必ず半角ダブルクォート (\") を使う\n\n"
            "【チェック観点】\n"
            "- 誤解されやすい表現\n"
            "- 特定の属性や立場を一般化していないか\n"
            "- 言い回しが強く見えないか\n"
            "- 法律上、問題ない表現か\n"
            "- 何らかの利用規約上、問題ない表現か\n"
            "- 倫理的に問題ない表現か\n"
            "- 明らかな誤字脱字\n\n"
            "【JSONで返却する情報】\n"
            "- risk (low / medium / high)\n"
            "- summary\n"
            "- reasons（最大3つ）\n"
            "- suggestions（任意）\n\n"
            "以下の形式と完全に一致するJSONのみを返してください。\n"
            "{\n"
            '  "risk": "medium",\n'
            '  "summary": "文章の受け取られ方について、注意が必要な可能性があります。",\n'
            '  "reasons": ["理由1", "理由2"],\n'
            '  "suggestions": ["改善案1", "改善案2"]\n'
            "}\n\n"
            "表現はやさしい言い回しにしてください。"
        )

        user_prompt = f"【文章】\n{text}"

        # -----------------------------
        # 3. Amazon Bedrock 呼び出し
        # -----------------------------
        # Amazon BedrockのLLM(Gemma 3 4B = google.gemma-3-4b-it)を呼び出す
        # Amazon Bedrockでは、デフォルトでオプトアウト済みとなっている
        #   https://docs.aws.amazon.com/ja_jp/bedrock/latest/userguide/data-protection.html
        response = bedrock.invoke_model(
            modelId="google.gemma-3-4b-it",
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                # Bedrockの推論パラメータを設定して、JSONフォーマットや出力のブレ具合を抑制する
                "temperature": 0.1,
                "top_p": 0.9,
                "max_tokens": 1024
            })
        )

        # Amazon Bedrockのレスポンスボディ
        # Bedrockのレスポンスボディの解析結果には、本文を類推できる文章が含まれる可能性があるため、ログ出力しない
        response_body = json.loads(response["body"].read())

        # Amazon Bedrockのレスポンスボディをデバッグ表示する場合の処理、開発時以外はコメントアウトしておく
        # logger.info("Bedrock raw response: %s", response_body)

        # Amazon Bedrockのステータスコード
        bedrock_status_code = response["ResponseMetadata"]["HTTPStatusCode"]
        logger.info(
            "Amazon Bedrock Lambda bedrock.invoke_model() HTTP Status Code: %s",
            bedrock_status_code
        )

        # -----------------------------
        # 4. レスポンスパース
        # -----------------------------
        output_text = extract_bedrock_output_text(response_body)

        # モデル出力からJSONを抽出・パースする
        result = parse_model_json(output_text)
        result = sanitize_result(result)

        # -----------------------------
        # 5. 正常レスポンス返却
        # -----------------------------
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(result, ensure_ascii=False)
        }

    except JSONDecodeError:
        # -----------------------------
        # 6. JSONパース失敗時のフェイルセーフ
        # -----------------------------
        logger.exception("Failed to parse JSON")
        put_parse_error_metric()

        fallback = {
            "risk": "medium",
            "summary": "文章の受け取られ方について、注意が必要な可能性があります。",
            "reasons": [
                "文章の解析結果の整形中に一時的な問題が発生しました。お手数ですが、時間をおいて再度お試しください。"
            ],
            "suggestions": []
        }

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(fallback, ensure_ascii=False)
        }

    except Exception:
        # -----------------------------
        # 7. その他エラー時のフェイルセーフ
        # -----------------------------
        logger.exception("Lambda error")

        fallback = {
            "risk": "medium",
            "summary": "文章の受け取られ方について、注意が必要な可能性があります。",
            "reasons": [
                "文章の解析処理中に想定外の状態が発生しました。お手数おかけしますが、時間をおいて再度お試しください。"
            ],
            "suggestions": []
        }

        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(fallback, ensure_ascii=False)
        }
