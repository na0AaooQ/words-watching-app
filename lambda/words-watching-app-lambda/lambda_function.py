# 「ことばみまもり」サイトからAPI Gateway経由で送信されたテキストデータをAmazon Bedrockに渡して、テキストの文脈解析結果を返却する
import json
import boto3
import re
import logging

# ログ設定
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Amazon Bedrock Runtime クライアント
bedrock = boto3.client("bedrock-runtime")

# CloudWatch クライアント
cloudwatch = boto3.client("cloudwatch")

# Amazon Bedrockレスポンスのパース失敗時、CloudWatchにログを送信する
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

# Amazon Bedrockのテキストデータ解析結果レスポンスをパースする
def extract_json_block(text: str) -> str:

    # ```json ～ ``` を優先的に除去
    match = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        return match.group(1)
    # それがなければ最初の { ～ 最後の } を除去
    match = re.search(r"(\{.*\})", text, re.DOTALL)
    if match:
        return match.group(1)
    raise ValueError("JSON not found")

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
                "body": json.dumps({"error": "文章が入力されていません。"})
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
            "- 不要な説明文は書かない\n\n"
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
                "temperature": 0.2,
                "top_p": 0.9,
                "max_tokens": 1024
            })
        )

        ## Amazon Bedrockのレスポンスボディ
        ## Bedrockのレスポンスボディの解析結果には、本文を類推できる文章が含まれる可能性があるため、ログ出力しない
        response_body = json.loads(response["body"].read())

        ## Amazon Bedrockのステータスコード
        bedrock_status_code = response["ResponseMetadata"]["HTTPStatusCode"]
        logger.info("Amazon Bedrock Lambda bedrock.invoke_model() HTTP Status Code: %s", bedrock_status_code)

        # -----------------------------
        # 4. レスポンスパース (Gemma対応)
        # -----------------------------
        output_text = ""

        if "choices" in response_body:
            output_text = response_body["choices"][0]["message"]["content"]
        else:
            raise RuntimeError("Unexpected Bedrock response format")

        # ```json を剥がして JSON 抽出する
        raw_text = output_text
        json_text = extract_json_block(raw_text)
        result = json.loads(json_text)

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

    except Exception as e:
        # -----------------------------
        # 6. フェイルセーフ
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

        # Amazon BedrockからのJSONレスポンスのパースエラー発生時、CloudWatchにエラーを送信する
        put_parse_error_metric()

        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(fallback, ensure_ascii=False)
        }
