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


class LambdaLanguageTests(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
