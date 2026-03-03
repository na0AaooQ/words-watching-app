# ことばみまもり

> 投稿前に、ひと呼吸。— SNS投稿前の炎上防止・文章リスク確認ツール
SNS投稿前の炎上防止・文章リスク確認ツール「ことばみまもり」のソースコード管理リポジトリ

[![サイトを見る](https://img.shields.io/badge/サイト-words--watching--app-4a6cf7?style=flat-square)](https://words-watching-app.na0aaooq.com/)
[![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)](#ライセンス--著作権)

---

## 概要

**「ことばみまもり」** とは、X（旧Twitter）、Instagram、TikTokなどのSNSに投稿したい文章について、投稿前にAIでチェックし、言葉のリスクを可視化するWebサービスです。

- 攻撃性・誹謗中傷度・感情強度を表示する。
- 文章の改善ヒントを表示する。
- 言葉を制限するのではなく、**投稿するかどうかの判断材料**を提供する。  
- 入力された文章はシステム内に保存されません。  
- 無料・ログインや登録不要で利用可能です。  

👉 **[https://words-watching-app.na0aaooq.com/](https://words-watching-app.na0aaooq.com/)**

---

## 画面イメージ

| トップページ | チェック結果 |
|---|---|
| 文章を入力してAIに解析を依頼 | 文章の攻撃性・誹謗中傷度・感情強度を表示、文章の改善ヒントを表示 |

- 画面のUIは、初見の方でも手軽に使いやすいよう、シンプルな構成にしています。
- 画面のテキストエリアに、リスクを確認したい文章を入力します。

<img width="979" height="780" alt="スクリーンショット 2026-03-02 19 26 42" src="https://github.com/user-attachments/assets/2094e1b9-5795-490a-a519-5c9fa2e63b51" />

- 文章の入力後、「確認してみるボタン」をクリックします。

<img width="1253" height="776" alt="スクリーンショット 2026-03-02 19 26 51" src="https://github.com/user-attachments/assets/0821d82e-29b5-452a-9a26-822af8f33a4e" />

- 以下のように、文章の確認結果(リスク、気になりそうな点、改善のヒント)が表示されます。

<img width="1210" height="784" alt="スクリーンショット 2026-03-02 19 26 59" src="https://github.com/user-attachments/assets/3a30fdf4-75fc-440d-87f8-b9e9dee1133d" />

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

## 単体テスト実行方法

本リポジトリ内のindex.html(と内含しているjavascript)の単体テスト(ユニットテスト)を実行する場合、以下の手順でテストします。  

このテストでは、index.htmlのフォーム入力、バリデーション、API通信(fetch/XMLHttpRequest), DOM操作や表示切替をテストします。

(1) 本リポジトリをgit cloneします。

```
% git clone git@github.com:na0AaooQ/words-watching-app.git

% cd words-watching-app

(2) テスト実行用のパッケージ Jest と jest-environment-jsdom をインストールします。  

前提として、nodeやnpmをインストールしておく必要があります。  

```
% node -v
v25.6.1
```

以下のコマンドを実行し、テスト実行用のパッケージ Jest と jest-environment-jsdom をインストールします。  

```
% npm install --save-dev jest jest-environment-jsdom

・・

added 339 packages in 7s

51 packages are looking for funding
  run `npm fund` for details
%
```

リポジトリ内のディレクトリに package.json が生成されます。  

```
% cat package.json 
{
  "devDependencies": {
    "jest": "^30.2.0",
    "jest-environment-jsdom": "^30.2.0"
  }
}
% 
```

(3) package.json に対して、Jestとjest-environment-jsdomを追加します。

```
% vi package.json 
{
  "devDependencies": {
    "jest": "^30.2.0",
    "jest-environment-jsdom": "^30.2.0"
  },
  "jest": {
    "testEnvironment": "jsdom"
  }
}
```

(4) 以下のコマンドを実行し、リポジトリ内の単体テストコード index.test.js で index.html のテストを実行します。  

```
% npx jest index.test.js
 PASS  ./index.test.js
  onTextInput()
    ✓ 空文字のとき「0 / 2200」と表示し、ボタンが disabled になる (5 ms)
    ✓ 1文字以上入力するとボタンが enabled になる (2 ms)
    ✓ 1800文字以内は warn クラスなし
    ✓ 1801文字で warn クラスが付く
    ✓ 2200文字で over クラスが付く (1 ms)
    ✓ 文字数が正しくカウントされる（絵文字含む） (1 ms)
  setSample()
    ✓ textarea に指定テキストがセットされる (1 ms)
    ✓ input イベントが発火して文字数カウントが更新される (1 ms)
    ✓ 空文字をセットできる (1 ms)

　(テスト結果は長いので途中省略)

Test Suites: 1 passed, 1 total
Tests:       70 passed, 70 total
Snapshots:   0 total
Time:        0.393 s, estimated 1 s
Ran all test suites matching index.test.js.
% 
```

---

## 開発の背景

SNSで何気なく投稿した言葉が、意図せず誰かを傷つけてしまうケースを少しでも減らしたいという思いから開発しました。

「この表現で大丈夫かな？」「誤解されないかな？」「投稿したらSNSで炎上したりしないかな？」

そんな迷いを抱えたとき、ひとりで抱え込まずに済むよう、考えるきっかけを提供することを目的としています。

---

## 開発者の思い

開発者の本サービス開発に至った思いについて、補足いたします。

- SNSやインターネット上では、多くの方々により、日々さまざまな言葉のやりとり、情報発信が行われています。
- それにより、多くの方々が、つながりあい、感動したり、情報や知見を得たり、新たな出会いや対話が生まれたり。と人生や生活を豊かにする一助になっていると思っています。
- SNSで交わされる言葉、その言葉に込められた思いは、ときに孤独な人の心も救うことがあると思っています。
- 一方、何気なく投稿した言葉によって、意図せず誰かの心を傷つけてしまうケースもあると思ってます。ときに、意図せず炎上が発生してしまい、投稿者の方、投稿をご覧になった方、双方の心が傷ついてしまうことが起こるかもしれません。
- 傷つく人を減らしたい、人の心を技術や仕組みで守りたい。という思いから、今回は言葉と情報発信について、迷いを抱える方の負担を少しでも楽にできればと思い、サービスを作りました。

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
