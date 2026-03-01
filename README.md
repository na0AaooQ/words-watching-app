# ことばみまもり

> 投稿前に、ひと呼吸。— SNS投稿前の炎上防止・文章リスク確認ツール
SNS投稿前の炎上防止・文章リスク確認ツール「ことばみまもり」のソースコード管理リポジトリ

[![サイトを見る](https://img.shields.io/badge/サイト-words--watching--app-4a6cf7?style=flat-square)](https://words-watching-app.na0aaooq.com/)
[![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)](#ライセンス--著作権)

---

## 概要

**「ことばみまもり」** とは、X（旧Twitter）、Instagram、TikTokなどのSNSに投稿したい文章について、投稿前にAIでチェックし、言葉のリスクを可視化するWebサービスです。

- 攻撃性・誹謗中傷度・感情強度をスコアで表示する。  
- 言葉を制限するのではなく、**投稿するかどうかの判断材料**を提供する。  
- 入力された文章はシステム内に保存されません。  
- 無料・ログインや登録不要で利用可能です。  

👉 **[https://words-watching-app.na0aaooq.com/](https://words-watching-app.na0aaooq.com/)**

---

## 画面イメージ

| トップページ | チェック結果 |
|---|---|
| 文章を入力してAIに解析を依頼 | スコアと改善ヒントを表示 |

---

## システム構成

本サービスはAWS上にフルサーバーレス構成で構築しています。

| 分野 | 技術 |
|---|---|
| Frontend | HTML / CSS / JavaScript |
| Web Hosting | Amazon S3 |
| CDN | Amazon CloudFront |
| API | Amazon API Gateway |
| Backend | AWS Lambda |
| 生成AI (LLM) | Amazon Bedrock（Gemma 3 4B） |
| セキュリティ | AWS WAF / AWS Shield Standard |
| 監視 | Amazon CloudWatch |
| アクセス解析 | Google Analytics |

### データの流れ

```
ブラウザ（入力）
  → Amazon CloudFront
  → Amazon API Gateway
  → AWS Lambda
  → Amazon Bedrock (LLM)
  → 解析結果をブラウザに返却・表示
```

---

## 特徴・工夫した点

- **プライバシー保護**: 入力テキストはシステム内に保存せず、LLMの学習にも利用しない
- **フルサーバーレス**: 自動スケーリングによる安定稼働と低コスト運用を両立
- **セキュリティ対策**: AWS WAF・Shield によるBot/DDoS対策、入力値のサニタイズ、HTTPS強制
- **XSS対策**: フロントエンドでの `escapeHtml()` によるAPIレスポンスの無害化
- **低コスト運用**: 低トラフィック時は月額数百円〜数千円程度で運用可能

---

## 開発の背景

SNSで何気なく投稿した言葉が、意図せず誰かを傷つけてしまうケースを少しでも減らしたいという思いから開発しました。

「この表現で大丈夫かな？」「誤解されないかな？」

そんな迷いを抱えたとき、ひとりで抱え込まずに済むよう、考えるきっかけを提供することを目的としています。

---

## 開発者

- **na0AaooQ（青木 直之）**
- Qiita: [https://qiita.com/na0AaooQ](https://qiita.com/na0AaooQ)
- X（旧Twitter）: [https://x.com/na0AaooQ](https://x.com/na0AaooQ)

開発の詳細は Qiita の記事をご覧ください。  
👉 [AWSサーバーレス × LLMで「言葉のリスク」を可視化するサービス『ことばみまもり』を個人開発・公開しました](https://qiita.com/na0AaooQ/items/cc97a13993aebe4d28f3)

---

## ライセンス / 著作権

**Copyright © na0AaooQ All Rights Reserved.**

本リポジトリに含まれるすべてのソースコード、デザイン、ドキュメントの著作権は開発者（na0AaooQ）に帰属します。

### ❌ 禁止事項

以下の行為を**明示的に禁止**します。

- ソースコードの全部または一部の複製・転載
- ソースコードを利用した派生サービス・アプリケーションの作成・公開
- 商用・非商用を問わず、本コードを利用したサービスの運営
- 本リポジトリのフォークを利用した再配布
- 悪意ある目的（フィッシング・スパム・誹謗中傷助長など）への転用

### ✅ 許可事項

- コードの**閲覧**（技術的な参考・学習目的）
- 本サービスの**利用**（[https://words-watching-app.na0aaooq.com/](https://words-watching-app.na0aaooq.com/)）

### お問い合わせ

ライセンスに関するご質問・利用許諾のご相談は、X（旧Twitter）のDM（[@na0AaooQ](https://x.com/na0AaooQ)）までご連絡ください。
