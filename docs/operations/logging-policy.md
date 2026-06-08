# ことばみまもり ログ運用方針

このメモは、ことばみまもりの開発・運用者向けに、CloudWatch Logs の保持方針、削除方針、確認コマンドを記録するものです。ユーザー向け公開ページではありません。

## 目的

ことばみまもりでは、入力文章を保存せず、AIの学習にも利用しない方針を大切にしています。

CloudWatch Logs でも、入力本文や本文を推測できる断片が残りにくい運用にします。一方で、障害調査や運用監視に必要な安全なメタ情報は残します。

## 対象

- AWSアカウントID: `464959028036`
- リージョン: `ap-northeast-1`
- Lambda: `words-watching-app-lambda`
- CloudWatch Logs log group: `/aws/lambda/words-watching-app-lambda`

## CloudWatch Logs 保持方針

- AWS CloudWatch Logs log group のログ保存期間 `retentionInDays` は `30` に設定します。
- 無期限保存は避けます。
- 30日を超えたログは CloudWatch Logs 側で自動削除されます。
- 将来的により短くしてよいと判断できた場合は、14日などへの短縮を検討します。

## ログに残さない情報

以下はログに残しません。

- 入力本文 `text`
- 入力本文の一部
- Bedrock user prompt
- Bedrock raw response
- モデル出力全文
- モデル出力の一部
- JSONパース失敗箇所周辺の生テキスト
- `normalized_json_text` の一部
- `json_text` の一部
- API event body 全体
- request body 全体
- 不正な `language` の正規化前値

## ログに残してよい情報

安全なメタ情報として、以下はログに残してよい情報とします。

- `exception_type`
- `parse_error_position`
- `model_output_length`
- 正規化後の `language`
- `recovery_attempted`
- `recovery_succeeded`
- `JsonParseError` カスタムメトリクス

## 実施済み運用タスク

AWS側で以下を実施、確認済みです。

- CloudWatch Logs `retentionInDays` を `30` に設定しました。
- 削除後、`Broken JSON near parse error` がヒットしないことを確認しました。
- 削除後、`Bedrock raw response` がヒットしないことを確認しました。

## 確認コマンド

保持期間を確認します。

```sh
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/words-watching-app-lambda \
  --region ap-northeast-1
```

旧ログ文言が残っていないことを確認します。

```sh
aws logs filter-log-events \
  --log-group-name /aws/lambda/words-watching-app-lambda \
  --filter-pattern "Broken JSON near parse error" \
  --region ap-northeast-1
```

Bedrock raw response が残っていないことを確認します。

```sh
aws logs filter-log-events \
  --log-group-name /aws/lambda/words-watching-app-lambda \
  --filter-pattern "Bedrock raw response" \
  --region ap-northeast-1
```

安全なメタ情報ログを確認します。

```sh
aws logs filter-log-events \
  --log-group-name /aws/lambda/words-watching-app-lambda \
  --filter-pattern "event=bedrock_json_parse_error" \
  --region ap-northeast-1
```

```sh
aws logs filter-log-events \
  --log-group-name /aws/lambda/words-watching-app-lambda \
  --filter-pattern "event=bedrock_json_recovery_result" \
  --region ap-northeast-1
```

必要に応じて、`--start-time` と `--end-time` で確認期間を絞ります。

## 削除操作の注意点

- `delete-log-stream` は取り消しにくい操作のため、慎重に扱います。
- 削除前に、対象 log stream 名、対象期間、削除理由を確認します。
- ログ本文やモデル出力断片を作業記録に再掲しません。
- log group 全体削除ではなく、必要な log stream 単位で削除します。
- 安全化済みログは原則残します。

削除を行う場合は、対象を確認したうえで実行します。

```sh
aws logs delete-log-stream \
  --log-group-name /aws/lambda/words-watching-app-lambda \
  --log-stream-name "<削除対象のlog stream名>" \
  --region ap-northeast-1
```

## 現状維持する設定

- Bedrock invocation logging は現状無効のため維持します。
- API Gateway access logging / execution logging は現状本文保存リスクが低めのため、安易に有効化しません。
- CloudFront標準ログも現状無効のため、必要性を確認せずに有効化しません。
- `JsonParseError` カスタムメトリクスと関連アラームは維持します。

## 後続検討候補

- `logger.exception("Failed to parse JSON")` / `logger.exception("Lambda error")` の安全化検討
- Lambda実行ロールのCloudWatch Logs権限最小化
- Bedrock権限 `bedrock:*` on `*` の最小化
- 不要な旧API IDのLambda resource policy整理
- CloudWatch Logs閲覧権限の棚卸し
- KMSカスタマー管理キー利用の検討
