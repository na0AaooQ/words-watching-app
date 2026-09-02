import importlib.util
import io
import json
import sys
import types
import unittest
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
LAMBDA_PATH = ROOT_DIR / "modules/aws/lambda/words-watching-app-lambda/lambda_function.py"


class DummyAwsClient:
    def put_metric_data(self, **kwargs):
        self.metric_data = kwargs


sys.modules["boto3"] = types.SimpleNamespace(client=lambda service_name: DummyAwsClient())

spec = importlib.util.spec_from_file_location("lambda_function_under_test", LAMBDA_PATH)
lambda_function = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lambda_function)


class FakeBedrock:
    def __init__(self, response_payload=None, raw_body=None):
        self.calls = []
        self.response_payload = response_payload or {
            "choices": [
                {
                    "message": {
                        "content": json.dumps({
                            "risk": "low",
                            "summary": "ok",
                            "reasons": ["ok"],
                            "suggestions": []
                        })
                    }
                }
            ]
        }
        self.raw_body = raw_body

    def invoke_model(self, **kwargs):
        self.calls.append(kwargs)
        raw_body = self.raw_body
        if raw_body is None:
            raw_body = json.dumps(self.response_payload).encode("utf-8")
        return {
            "body": io.BytesIO(raw_body),
            "ResponseMetadata": {
                "HTTPStatusCode": 200
            }
        }


def body_with_serialized_size(target_size, text="ok", padding_prefix=""):
    body = {"text": text, "padding": padding_prefix}
    current_size = len(json.dumps(
        body,
        ensure_ascii=False,
        separators=(",", ":")
    ).encode("utf-8"))
    padding_length = target_size - current_size
    if padding_length < 0:
        raise ValueError("target_size is smaller than the required JSON body")

    body["padding"] += "x" * padding_length
    actual_size = len(json.dumps(
        body,
        ensure_ascii=False,
        separators=(",", ":")
    ).encode("utf-8"))
    if actual_size != target_size:
        raise AssertionError("JSON body size fixture is not exact")
    return body


class LambdaLanguageTests(unittest.TestCase):
    def setUp(self):
        self.fake_bedrock = FakeBedrock()
        lambda_function.bedrock = self.fake_bedrock

    def test_normalize_language_accepts_allowed_values(self):
        self.assertEqual(lambda_function.normalize_language("ja"), "ja")
        self.assertEqual(lambda_function.normalize_language("en"), "en")
        self.assertEqual(lambda_function.normalize_language("JA"), "ja")
        self.assertEqual(lambda_function.normalize_language("EN"), "en")
        self.assertEqual(lambda_function.normalize_language(" en "), "en")

    def test_normalize_language_defaults_to_ja_for_invalid_values(self):
        self.assertEqual(lambda_function.normalize_language(""), "ja")
        self.assertEqual(lambda_function.normalize_language("fr"), "ja")
        self.assertEqual(lambda_function.normalize_language(123), "ja")
        self.assertEqual(lambda_function.normalize_language(["en"]), "ja")
        self.assertEqual(lambda_function.normalize_language({"language": "en"}), "ja")
        self.assertEqual(lambda_function.normalize_language(None), "ja")

    def test_build_system_prompt_uses_japanese_by_default(self):
        prompt = lambda_function.build_system_prompt("fr", "standard", "general")
        self.assertIn("あなたは、日本語テキスト", prompt)
        self.assertIn('"summary": "文章の受け取られ方について、注意が必要な可能性があります。"', prompt)

    def test_build_system_prompt_uses_english_for_en(self):
        prompt = lambda_function.build_system_prompt("en", "soft", "sns")
        self.assertIn("summary, reasons, and suggestions must be written in English", prompt)
        self.assertIn("Suggest gentle directions", prompt)
        self.assertIn('"summary": "This text may be worth reviewing before posting."', prompt)
        self.assertNotIn("あなたは、日本語テキスト", prompt)

    def test_sanitize_result_uses_language_specific_fallbacks(self):
        en_result = lambda_function.sanitize_result({
            "risk": "unknown",
            "summary": "",
            "reasons": [],
            "suggestions": "invalid"
        }, "en")
        self.assertEqual(set(en_result.keys()), {"risk", "summary", "reasons", "suggestions"})
        self.assertEqual(en_result["risk"], "medium")
        self.assertEqual(en_result["summary"], "This text may be worth reviewing before posting.")
        self.assertEqual(en_result["reasons"], ["The wording may benefit from a gentle review before posting."])
        self.assertEqual(en_result["suggestions"], [])

        ja_result = lambda_function.sanitize_result({
            "risk": "unknown",
            "summary": "",
            "reasons": [],
            "suggestions": "invalid"
        }, "ja")
        self.assertEqual(ja_result["summary"], "文章の受け取られ方について、注意が必要な可能性があります。")
        self.assertEqual(ja_result["reasons"], ["文章の受け取られ方について、注意が必要な可能性があります。"])

    def test_recover_result_from_broken_json_uses_language_specific_fallbacks(self):
        en_result = lambda_function.recover_result_from_broken_json('{"risk": "medium", "summary": "", "reasons": [', "en")
        self.assertEqual(en_result["summary"], "This text may be worth reviewing before posting.")
        self.assertEqual(en_result["reasons"], ["The wording may benefit from a gentle review before posting."])

        ja_result = lambda_function.recover_result_from_broken_json('{"risk": "medium", "summary": "", "reasons": [', "ja")
        self.assertEqual(ja_result["summary"], "文章の受け取られ方について、注意が必要な可能性があります。")
        self.assertEqual(ja_result["reasons"], ["文章の受け取られ方について、注意が必要な可能性があります。"])

    def test_parse_model_json_logs_metadata_without_model_output_fragment(self):
        secret = "SECRET_USER_TEXT_SHOULD_NOT_APPEAR_IN_LOGS"
        broken_json = (
            '{"risk": "medium", '
            f'"summary": "{secret}" '
            '"reasons": ["review wording"], '
            '"suggestions": []}'
        )

        with self.assertLogs(lambda_function.logger, level="INFO") as captured:
            result = lambda_function.parse_model_json(broken_json, "en")

        logs = "\n".join(captured.output)
        self.assertEqual(set(result.keys()), {"risk", "summary", "reasons", "suggestions"})
        self.assertNotIn(secret, logs)
        self.assertNotIn("Broken JSON near parse error", logs)
        self.assertIn("event=bedrock_json_parse_error", logs)
        self.assertIn("exception_type=JSONDecodeError", logs)
        self.assertIn("parse_error_position=", logs)
        self.assertIn("model_output_length=", logs)
        self.assertIn("language=en", logs)
        self.assertIn("recovery_attempted=true", logs)
        self.assertIn("event=bedrock_json_recovery_result", logs)
        self.assertIn("recovery_succeeded=true", logs)

    def test_lambda_handler_sends_english_prompt_for_en(self):
        fake_bedrock = FakeBedrock()
        lambda_function.bedrock = fake_bedrock

        response = lambda_function.lambda_handler({
            "body": json.dumps({
                "text": "This wording feels too strong.",
                "language": "en"
            })
        }, None)

        self.assertEqual(response["statusCode"], 200)
        response_body = json.loads(response["body"])
        self.assertEqual(set(response_body.keys()), {"risk", "summary", "reasons", "suggestions"})

        request_body = json.loads(fake_bedrock.calls[0]["body"])
        system_prompt = request_body["messages"][0]["content"]
        self.assertIn("summary, reasons, and suggestions must be written in English", system_prompt)

    def test_lambda_handler_defaults_invalid_language_to_japanese_prompt(self):
        fake_bedrock = FakeBedrock()
        lambda_function.bedrock = fake_bedrock

        response = lambda_function.lambda_handler({
            "body": json.dumps({
                "text": "確認したい文章です。",
                "language": "fr"
            })
        }, None)

        self.assertEqual(response["statusCode"], 200)
        request_body = json.loads(fake_bedrock.calls[0]["body"])
        system_prompt = request_body["messages"][0]["content"]
        self.assertIn("あなたは、日本語テキスト", system_prompt)

    def test_lambda_handler_returns_english_input_error_for_en(self):
        response = lambda_function.lambda_handler({
            "body": json.dumps({
                "text": "   ",
                "language": "en"
            })
        }, None)

        self.assertEqual(response["statusCode"], 400)
        self.assertEqual(json.loads(response["body"]), {"error": "Please enter some text to check."})

    def test_lambda_handler_returns_english_parse_fallback_for_en(self):
        fake_bedrock = FakeBedrock(raw_body=b"{")
        lambda_function.bedrock = fake_bedrock
        lambda_function.cloudwatch = DummyAwsClient()

        logger_disabled = lambda_function.logger.disabled
        lambda_function.logger.disabled = True
        try:
            response = lambda_function.lambda_handler({
                "body": json.dumps({
                    "text": "Please check this.",
                    "language": "en"
                })
            }, None)
        finally:
            lambda_function.logger.disabled = logger_disabled

        self.assertEqual(response["statusCode"], 200)
        response_body = json.loads(response["body"])
        self.assertEqual(response_body["risk"], "medium")
        self.assertEqual(response_body["summary"], "This text may be worth reviewing before posting.")
        self.assertEqual(response_body["reasons"], [
            "We couldn't prepare the check result properly this time. Please wait a moment and try again."
        ])
        self.assertEqual(response_body["suggestions"], [])

    def test_lambda_handler_invokes_bedrock_once_for_normal_input(self):
        response = lambda_function.lambda_handler({
            "body": {"text": "確認したい文章です。"}
        }, None)

        self.assertEqual(response["statusCode"], 200)
        self.assertEqual(len(self.fake_bedrock.calls), 1)

    def test_lambda_handler_supports_direct_invocation_body(self):
        response = lambda_function.lambda_handler({
            "text": "直接実行の文章です。"
        }, None)

        self.assertEqual(response["statusCode"], 200)
        self.assertEqual(len(self.fake_bedrock.calls), 1)

    def test_utf16_code_unit_length_counts_code_units_without_normalization(self):
        self.assertEqual(lambda_function.utf16_code_unit_length("a"), 1)
        self.assertEqual(lambda_function.utf16_code_unit_length("あ"), 1)
        self.assertEqual(lambda_function.utf16_code_unit_length("😀"), 2)
        self.assertEqual(lambda_function.utf16_code_unit_length("e\u0301\ufe0f"), 3)

    def test_lambda_handler_allows_text_at_utf16_limit(self):
        for label, text in [
            ("ascii", "a" * 50000),
            ("japanese", "あ" * 50000),
            ("emoji", "😀" * 25000)
        ]:
            with self.subTest(label=label):
                self.fake_bedrock.calls.clear()
                response = lambda_function.lambda_handler({"body": {"text": text}}, None)

                self.assertEqual(response["statusCode"], 200)
                self.assertEqual(len(self.fake_bedrock.calls), 1)

    def test_lambda_handler_rejects_text_over_utf16_limit_before_bedrock(self):
        for label, text, expected_length in [
            ("ascii", "a" * 50001, 50001),
            ("emoji", "😀" * 25001, 50002)
        ]:
            with self.subTest(label=label):
                self.fake_bedrock.calls.clear()
                with self.assertLogs(lambda_function.logger, level="INFO") as captured:
                    response = lambda_function.lambda_handler({"body": {"text": text}}, None)

                logs = "\n".join(captured.output)
                self.assertEqual(response["statusCode"], 413)
                self.assertEqual(len(self.fake_bedrock.calls), 0)
                self.assertIn("event=input_validation_rejected", logs)
                self.assertIn("reason=text_too_long", logs)
                self.assertIn(f"text_utf16_length={expected_length}", logs)

    def test_lambda_handler_checks_length_before_stripping_whitespace(self):
        for label, text, expected_status in [
            ("at_limit", " " * 50000, 400),
            ("over_limit", " " * 50001, 413)
        ]:
            with self.subTest(label=label):
                self.fake_bedrock.calls.clear()
                response = lambda_function.lambda_handler({"body": {"text": text}}, None)

                self.assertEqual(response["statusCode"], expected_status)
                self.assertEqual(len(self.fake_bedrock.calls), 0)

    def test_lambda_handler_rejects_invalid_text_values_before_bedrock(self):
        invalid_bodies = [
            {},
            {"text": None},
            {"text": 123},
            {"text": []},
            {"text": {}}
        ]

        for body in invalid_bodies:
            with self.subTest(body=body):
                self.fake_bedrock.calls.clear()
                response = lambda_function.lambda_handler({"body": body}, None)

                self.assertEqual(response["statusCode"], 400)
                self.assertEqual(len(self.fake_bedrock.calls), 0)

    def test_lambda_handler_rejects_missing_or_invalid_body_before_bedrock(self):
        invalid_events = [
            {},
            {"body": None},
            {"body": "{"},
            {"body": []},
            {"body": "[]"},
            {"body": 123}
        ]

        for event in invalid_events:
            with self.subTest(event=event):
                self.fake_bedrock.calls.clear()
                response = lambda_function.lambda_handler(event, None)

                self.assertEqual(response["statusCode"], 400)
                self.assertEqual(len(self.fake_bedrock.calls), 0)

    def test_lambda_handler_enforces_exact_serialized_body_size_boundary(self):
        for target_size, expected_status in [
            (524287, 200),
            (524288, 200),
            (524289, 413)
        ]:
            with self.subTest(target_size=target_size):
                body = body_with_serialized_size(target_size)
                self.assertEqual(len(json.dumps(
                    body,
                    ensure_ascii=False,
                    separators=(",", ":")
                ).encode("utf-8")), target_size)

                self.fake_bedrock.calls.clear()
                response = lambda_function.lambda_handler({"body": body}, None)

                self.assertEqual(response["statusCode"], expected_status)
                self.assertEqual(
                    len(self.fake_bedrock.calls),
                    1 if expected_status == 200 else 0
                )

    def test_lambda_handler_checks_body_size_before_text_length(self):
        body = body_with_serialized_size(524289, text="a" * 50001)

        response = lambda_function.lambda_handler({"body": body}, None)

        self.assertEqual(response["statusCode"], 413)
        self.assertEqual(len(self.fake_bedrock.calls), 0)

    def test_input_validation_logs_do_not_include_user_text(self):
        sentinel = "DO_NOT_LOG_TEST_SENTINEL"
        text = sentinel + "a" * (50001 - len(sentinel))

        with self.assertLogs(lambda_function.logger, level="INFO") as captured:
            response = lambda_function.lambda_handler({"body": {"text": text}}, None)

        logs = "\n".join(captured.output)
        self.assertEqual(response["statusCode"], 413)
        self.assertEqual(len(self.fake_bedrock.calls), 0)
        self.assertIn("event=input_validation_rejected", logs)
        self.assertIn("reason=text_too_long", logs)
        self.assertIn("text_utf16_length=50001", logs)
        self.assertNotIn(sentinel, logs)

    def test_body_size_rejection_logs_only_safe_metadata(self):
        sentinel = "DO_NOT_LOG_TEST_SENTINEL"
        body = body_with_serialized_size(524289, padding_prefix=sentinel)

        with self.assertLogs(lambda_function.logger, level="INFO") as captured:
            response = lambda_function.lambda_handler({"body": body}, None)

        logs = "\n".join(captured.output)
        self.assertEqual(response["statusCode"], 413)
        self.assertEqual(len(self.fake_bedrock.calls), 0)
        self.assertIn("event=input_validation_rejected", logs)
        self.assertIn("reason=body_too_large", logs)
        self.assertIn("body_size_bytes=524289", logs)
        self.assertNotIn(sentinel, logs)


if __name__ == "__main__":
    unittest.main()
