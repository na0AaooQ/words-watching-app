# AGENTS.md

このドキュメントは、本リポジトリで作業する Codex などの AI コーディングエージェント向けの開発方針です。

「ことばみまもり」の安全原則、実装方針、テスト方針、ログ・プライバシー方針、運用上の注意点をまとめています。作業前に必ず読んでください。

## リポジトリ情報

- リポジトリURL: https://github.com/na0AaooQ/words-watching-app
- ローカル想定パス: `/Users/aokinaohisa/GitHub/words-watching-app`
- 本番URL: https://words-watching-app.na0aaooq.com/
- 英語トップ: https://words-watching-app.na0aaooq.com/en/index.html

## プロジェクト概要

「ことばみまもり」は、SNS投稿前に文章を見直すためのWebサービスです。

炎上防止、誤解防止、文章リスク確認を補助し、投稿前にひと呼吸置くための判断材料を提供します。文章を制限したり、利用者を責めたり、投稿を強制的に止めたりするサービスではありません。

無料・ログイン不要で利用できます。入力文章は保存されず、AIの学習にも利用されません。

## 最重要原則

本リポジトリを変更する場合は、必ず以下の原則を守ってください。

1. 利用者を責めない。
2. 言葉を制限・検閲するのではなく、見直しの材料を提供する。
3. 投稿を禁止・命令しない。
4. 正誤や善悪を断定しない。
5. 文章の受け取られ方の可能性をやわらかく示す。
6. やさしく、あたたかく、安心感のある表現にする。
7. 入力文章を保存しない。
8. 入力本文やモデル出力断片をログに残さない。
9. APIレスポンスJSON構造を安易に変更しない。
10. 既存日本語ユーザー体験を壊さない。
11. 英語ユーザー体験を壊さない。

## 技術構成

- 静的HTML / CSS / JavaScript中心の構成です。
- 日本語ページはリポジトリ直下にあります。
- 英語ページは `/en/` 配下にあります。
- `index.html` / `en/index.html` に文章チェックUIがあります。
- Lambdaは `modules/aws/lambda/words-watching-app-lambda/lambda_function.py` です。
- Amazon Bedrockを使って文章確認結果を返します。
- APIレスポンスJSON構造は `risk` / `summary` / `reasons` / `suggestions` です。
- デプロイスクリプトは `deploy_kotoba_mimamori_site.sh` です。
- i18n静的チェックは `scripts/check-i18n-pages.js` です。
- 運用ログ方針は `docs/operations/logging-policy.md` を参照してください。

## 多言語対応方針

日本語ページと英語ページを提供しています。

- 日本語ページは `language: "ja"` をAPIへ送ります。
- 英語ページは `language: "en"` をAPIへ送ります。
- `language` 未指定、空文字、不正値、非文字列は既存互換性のため `ja` にフォールバックします。
- `html lang` / `canonical` / `hreflang` / `sitemap.xml` を壊さないでください。
- 表示言語プルダウンの相互遷移を壊さないでください。
- 新しい固定文言やページを追加した場合、日本語・英語の整合性を確認してください。
- 英語ページだけ、日本語ページだけの片側更新は避けてください。

## API / Lambda方針

- APIレスポンスJSON構造 `risk` / `summary` / `reasons` / `suggestions` は維持してください。
- `risk` enum `low` / `medium` / `high` は維持してください。
- key名や階層を変更しないでください。
- `summary` / `reasons` / `suggestions` の値だけ表示言語に応じて変わります。
- 不正な `language` はエラーにせず、`ja` にフォールバックしてください。
- `tone` / `scene` の既存仕様を壊さないでください。
- Bedrockモデル、`temperature`、`max_tokens` などの推論設定は不用意に変更しないでください。
- 日本語プロンプトを大幅に変更しないでください。
- 英語プロンプトも、利用者を責めない、投稿禁止しない、可能性として伝えるトーンを守ってください。

## ログ・プライバシー方針

詳細は `docs/operations/logging-policy.md` を参照してください。

ログには以下を出さないでください。

- 入力本文 `text`
- 入力本文の一部
- Bedrock user prompt
- Bedrock raw response
- モデル出力全文・一部
- JSONパース失敗箇所周辺の生テキスト
- API event body / request body 全体
- 不正な `language` の正規化前値

運用上の注意点:

- CloudWatch Logs retention は30日です。
- `JsonParseError` カスタムメトリクスは維持してください。
- Bedrock invocation logging は現状無効のため、必要性を確認せず有効化しないでください。
- API Gateway / CloudFront logging は、本文保存リスクを確認せず安易に有効化しないでください。
- ログ削除やAWS設定変更は慎重に扱ってください。
- 障害調査には、安全なメタ情報ログのみを使う方針です。

## docs/ ディレクトリ方針

- `docs/` は内部運用メモ用です。
- ユーザー向け公開ページではありません。
- S3デプロイ対象外です。
- `deploy_kotoba_mimamori_site.sh` で `docs/` を明示除外しています。
- `docs/` 配下にHTMLやCSSを置いても、公開前提にしないでください。
- ユーザー向けページを追加する場合は、既存構成に合わせてルート直下または `/en/` 配下に置いてください。

## デプロイ方針

- デプロイには `deploy_kotoba_mimamori_site.sh` を使ってください。
- 実デプロイ前に `--dryrun` を確認してください。
- `docs/` がデプロイ対象に出ないことを確認してください。
- 日本語HTML、英語HTML、CSS、`sitemap.xml` が対象に含まれることを確認してください。
- `.env`、`node_modules`、`aws/`、`BACKUP/` は公開しないでください。

## テスト・検証方針

変更後は可能な限り以下を実行してください。

```sh
npm test
npm run lint
npm run check:i18n
sh deploy_kotoba_mimamori_site.sh --dryrun
git diff --check
```

補足:

- `npm test` は Jest と Python unittest を実行します。
- `npm run check:i18n` は、日本語8ページ・英語8ページ、リンク、アンカー、表示言語プルダウン、`html lang`、`canonical`、`hreflang`、`sitemap.xml`、deploy script対象を検証します。
- Lambda関連変更時は `tests/test_lambda_language.py` を確認してください。
- ログ安全化変更時は、センチネル文字列がログに出ないことを確認してください。

## コーディング方針

- 既存構成を尊重し、大規模リファクタを避けてください。
- 変更差分を小さくしてください。
- 既存UIのやさしい雰囲気を壊さないでください。
- インラインJS共通化などは必要性を確認してから別PRで行ってください。
- ユーザー向けHTMLやAPIレスポンスJSON構造を安易に変更しないでください。
- セキュリティ・プライバシーに関わる変更は、先に調査・影響範囲整理を行ってください。

## 変更してよいもの・慎重に扱うもの

通常の機能追加や文言修正でも、既存の安全方針と多言語整合性を確認してください。

特に慎重に扱うファイル:

- `index.html`
- `en/index.html`
- `modules/aws/lambda/words-watching-app-lambda/lambda_function.py`
- `scripts/check-i18n-pages.js`
- `deploy_kotoba_mimamori_site.sh`
- `docs/operations/logging-policy.md`
- `sitemap.xml`
- `privacy.html` / `en/privacy.html`
- `terms_of_service.html` / `en/terms_of_service.html`
- `disclaimer.html` / `en/disclaimer.html`

特に慎重に扱う内容:

- 法務・プライバシー文言
- APIレスポンスJSON構造
- Bedrock prompt
- CloudWatch Logs / AWS設定
- deploy script

## 禁止・避けること

以下は行わないでください。

- 入力本文を保存する実装
- 入力本文をログ出力する実装
- Bedrock raw response をログ出力する実装
- モデル出力断片をログ出力する実装
- APIレスポンスJSON構造の無断変更
- `risk` enum の変更
- 日本語・英語の片側だけのページ更新
- `docs/` をS3公開対象にする変更
- Bedrock invocation logging を必要性確認なしに有効化すること
- API Gateway / CloudFront logging を必要性確認なしに有効化すること
- ユーザーを責める、脅す、投稿を禁止するような表現
- 法律判断、医療判断、心理診断のように見える表現

## 後続候補

未対応の後続候補です。対応する場合は、影響範囲を整理したうえで別PRとして扱ってください。

- `logger.exception("Failed to parse JSON")` / `logger.exception("Lambda error")` の安全化検討
- Lambda実行ロールのCloudWatch Logs権限最小化
- Bedrock権限 `bedrock:*` on `*` の最小化
- 不要な旧API IDのLambda resource policy整理
- CloudWatch Logs閲覧権限棚卸し
- KMSカスタマー管理キー利用検討
- CloudWatch heartbeatアラームdimension確認
- `JsonParseError` カスタムメトリクスとPR5後新ログイベントの運用定義整理
- 日英トップのインラインJS共通化検討

## PR7での作業範囲

PR7では、基本的に `AGENTS.md` の追加に絞ってください。

今回のPR7では、以下は行わないでください。

- ユーザー向けHTML変更
- CSS変更
- JavaScript実装変更
- Lambdaコード変更
- deploy script変更
- `docs/operations/logging-policy.md` の大幅変更
- `README.md` の大幅変更
- AWS設定変更
- 新規依存関係追加
- テストコード変更
