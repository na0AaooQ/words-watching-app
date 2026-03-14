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

## 操作マニュアル

- 「ことばみまもり」の使い方、操作マニュアルは以下になります。

👉 **[「ことばみまもり」の操作マニュアル](https://words-watching-app.na0aaooq.com/manual.html)**

---

## 画面イメージ

| トップページ | チェック結果 |
|---|---|
| 文章を入力してAIに解析を依頼 | 文章の攻撃性・誹謗中傷度・感情強度を表示、文章の改善ヒントを表示 |

- 画面のUIは、初見の方でも手軽に使いやすいよう、シンプルな構成にしています。
- 画面のテキストエリアに、リスクを確認したい文章を入力します。

<img width="1000" height="777" alt="manual-step1" src="https://github.com/user-attachments/assets/2e1d9327-dec8-4b32-bbde-28fd05bd5d94" />

- 文章の入力後、「確認してみるボタン」をクリックします。

<img width="988" height="769" alt="manual-step2" src="https://github.com/user-attachments/assets/6e5001cf-fc8d-4f24-9097-874e1698e6c5" />

- 以下のように、文章の確認結果(リスク、気になりそうな点、改善のヒント)が表示されます。

<img width="994" height="769" alt="manual-step3" src="https://github.com/user-attachments/assets/3c824e48-9cd9-4d0b-8d3a-fc2968bf2e70" />

- X（旧Twitter）、Facebook、Instagram、TikTok、Threads、LINEを開くボタンを設置しています。
- 確認もしくは修正した文章について、各SNSへ投稿する場合、各SNSを開くボタンをクリックすると、各SNS画面を表示できます。
- 各SNS画面を表示するだけで、文章は自動的に投稿しないようにしています。
- 最終的にSNSへ文章を投稿するかどうかは、ご利用者さまの意思やご判断を尊重したいので、SNS画面の表示のみとしています。

<img width="998" height="774" alt="manual-step4" src="https://github.com/user-attachments/assets/06cf9e12-3eda-4d47-9e1c-d088fc127933" />

- 例えば、[X を開く]ボタンをクリックすると、Xの画面が表示されます。
- Xの画面が表示されるので、確認もしくは修正した文章を記載して、Xへ文章を投稿できます。

<img width="630" height="357" alt="manual-step5" src="https://github.com/user-attachments/assets/e475c400-5364-4da4-a873-3c09ab2dedae" />

---

## 技術スタック

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

# ファイル構成

```
words-watching-app/
├── index.html             # サイトトップ画面のHTML,JS
├── index.test.js          # サイトトップ画面のテストコード
├── terms_of_service.html  # 利用規約画面のHTML
├── disclaimer.html        # 免責事項画面のHTML
├── privacy.html           # プライバシーポリシー画面のHTML
├── contact.html           # お問い合わせ画面のHTML
├── favicon.png            # サイトのファビコン画像
├── favicon.svg            # サイトのファビコン画像
├── ogp-image.png          # サイトのOGP画像
├── sitemap.xml            # サイトマップ
├── package.json           # 本リポジトリのアプリケーションプロジェクト情報を保存しているファイル(テストコードで使用している)
├── package-lock.json      # 本リポジトリで使用しているパッケージの依存関係、バージョン情報を保存しているファイル(テストコードで使用している)
├── README.md              # 本リポジトリの説明
├── .gitignore             # リポジトリの管理対象外とするディレクトリやファイル(ログファイル等)を定義するファイル
├── css/
│   ├── common.css         # サイト画面で使用しているCSS
├── lambda/
│   ├── words-watching-app-lambda
│      ├── lambda_function.py     # サイトで入力されたテキストデータをLLM(Amazon Bedrock)へ送信、レスポンスを処理するLambdaコード
```

---

## 特徴・工夫した点

- **プライバシー保護**: 入力テキストはシステム内に保存せず、LLMの学習にも利用しない
- **フルサーバーレス**: 自動スケーリングによる安定稼働と低コスト運用を両立
- **セキュリティ対策**: AWS WAF・Shield によるBot/DDoS対策、入力値のサニタイズ、HTTPS強制
- **XSS対策**: フロントエンドでの `escapeHtml()` によるAPIレスポンスの無害化
- **低コスト運用**: 低トラフィック時は月額数百円〜数千円程度で運用可能

---

## ユニットテスト実行方法

本リポジトリ内のindex.html(と内含しているjavascript)の単体テスト(ユニットテスト)を実行する場合、以下の手順でテストします。  

このテストでは、index.htmlのフォーム入力、バリデーション、API通信(fetch/XMLHttpRequest), DOM操作や表示切替をテストします。

テストコードは、以下の環境で動作を確認しております。
後述の手順では、Macでテストコードを実行するコマンドを記載しております。

- OS: macOS Tahoe 26.3 (Apple M3)

(1) ユニットテスト実行時に必要となる Node.js と npm がインストールされていない場合、Node.js と npm をインストールします。  

[Node.js公式 Node.js®をダウンロードする](https://nodejs.org/ja/download)

**(※) なお、Node.jsはv24 LTS版でもテストは動作します。**  

```
% node -v
v25.6.1
```

```
% npm -v
11.9.0
% 
```

(2) 本リポジトリをgit cloneします。

```
% git clone git@github.com:na0AaooQ/words-watching-app.git
```

(3) git cloneしたディレクトリへ移動します。  

```
% cd words-watching-app
```

(4) テスト実行に必要なパッケージ Jest と jest-environment-jsdom をインストールします。

以下のコマンドを実行し、テスト実行に必要なパッケージ Jest と jest-environment-jsdom をインストールします。  

**(※) jest-environment-jsdom については、Jestバージョン28以降、今回の手順のように、個別インストールが必要となります。**  

```
% npm install --save-dev jest jest-environment-jsdom

　(省略)

added 339 packages in 7s

51 packages are looking for funding
  run `npm fund` for details
%
```

jestとjest-environment-jsdomがインストールされたことを確認します。

```
% npx jest --version
30.1.3
% 
```

```
% grep jest-environment-jsdom package.json 
    "jest-environment-jsdom": "^30.2.0" 
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

(5) package.json に対して、Jestとjest-environment-jsdomを追加します。

```
% vi package.json 
{
  "devDependencies": {
    "jest": "^30.2.0",
    "jest-environment-jsdom": "^30.2.0"
  },
  "jest": {
    "testEnvironment": "jsdom"
  },
  "scripts": { "test": "jest" }
}
```

**(※) "scripts" セクションの追加は任意です。本手順では、npx jest index.test.js or npm test -- index.test.js のどちらのコマンドでも、テストを実行できるようにするため、セクションを追加しています。**  

(6) 以下のいずれかのコマンドを実行し、リポジトリ内にあうユニットテストコード index.test.js で index.html のユニットテストを実行します。  

```
% npm test -- index.test.js
```

　または

```
% npx jest index.test.js
```

(7) ユニットテスト結果が表示されます。テスト結果を確認し、[Test Suites: 1 passed, 1 total]、[Tests: 72 passed, 72 total] と表示されており、テストが全件成功していることを確認します。

```
% npm test -- index.test.js

> test
> jest index.test.js

 PASS  ./index.test.js
  onTextInput()
    ✓ 空文字のとき「0 / 5000」と表示し、ボタンが disabled になる (4 ms)
    ✓ 1文字以上入力するとボタンが enabled になる (1 ms)
    ✓ 1800文字以内は warn クラスなし (1 ms)
    ✓ 1801文字で warn クラスが付く (1 ms)
    ✓ 5000文字で over クラスが付く
    ✓ 文字数が正しくカウントされる（絵文字含む） (1 ms)
  setSample()
    ✓ textarea に指定テキストがセットされる (1 ms)
    ✓ input イベントが発火して文字数カウントが更新される (1 ms)
    ✓ 空文字をセットできる (1 ms)
  toggleAccordion()
    ✓ 閉じている状態でクリックすると aria-expanded="true" になる (1 ms)
    ✓ 開いた状態でクリックすると aria-expanded="false" になる
    ✓ 閉じている→開くと body に open クラスが追加される
    ✓ 開いている→閉じると body から open クラスが除去される (1 ms)
    ✓ 2回トグルすると元の状態に戻る
  toggleFaq()
    ✓ Q1をクリックすると開く (3 ms)
    ✓ Q1が開いている状態でQ2をクリックすると Q1 が閉じる (1 ms)
    ✓ 開いているFAQをもう一度クリックすると閉じる
  escapeHtml()
    ✓ & が &amp; にエスケープされる (2 ms)
    ✓ < が &lt; にエスケープされる
    ✓ > が &gt; にエスケープされる
    ✓ " が &quot; にエスケープされる
    ✓ ' が &#039; にエスケープされる
    ✓ 複数の特殊文字が混在していても正しくエスケープされる
    ✓ 特殊文字なし文字列はそのまま返る
    ✓ 空文字はそのまま返る
    ✓ string 以外の型（null）は空文字を返す
    ✓ string 以外の型（数値）は空文字を返す
    ✓ string 以外の型（undefined）は空文字を返す (1 ms)
  generateDemoData()
    ✓ ネガティブワードを含むテキストは risk: high を返す
    ✓ 「バカ」を含むテキストは risk: high を返す
    ✓ 「死」を含むテキストは risk: high を返す
    ✓ 「消えろ」を含むテキストは risk: high を返す
    ✓ 「嫌い」を含むテキストは risk: high を返す
    ✓ high リスク時は reasons が2件返る
    ✓ high リスク時は suggestions が2件返る
    ✓ ネガティブワードなしのテキストは risk: low を返す
    ✓ low リスク時は suggestions が空配列を返す (1 ms)
    ✓ 空文字は risk: low を返す
    ✓ summary が string 型で返る
  renderResult()
    ✓ result-area が表示される（display: block） (3 ms)
    ✓ risk: low のとき verdict safe クラスが付く (1 ms)
    ✓ risk: medium のとき verdict caution クラスが付く (1 ms)
    ✓ risk: high のとき verdict danger クラスが付く (1 ms)
    ✓ risk: low のとき 😊 アイコンが表示される (1 ms)
    ✓ risk: medium のとき 🤔 アイコンが表示される (1 ms)
    ✓ risk: high のとき ⚠️ アイコンが表示される (2 ms)
    ✓ risk: low のとき「低リスク」ラベルが表示される (1 ms)
    ✓ risk: medium のとき「要注意」ラベルが表示される (1 ms)
    ✓ risk: high のとき「高リスク」ラベルが表示される (1 ms)
    ✓ summary が表示される
    ✓ reasons が <li> として描画される (1 ms)
    ✓ suggestions がある場合「改善のヒント」セクションが表示される (1 ms)
    ✓ suggestions が空のとき「改善のヒント」セクションが表示されない (1 ms)
    ✓ XSS: summary の <script> タグがエスケープされる (1 ms)
    ✓ XSS: reasons の悪意ある文字列がエスケープされる (1 ms)
    ✓ SNS共有リンク（X）が結果エリアに含まれる (1 ms)
    ✓ SNS共有リンク（Facebook）が結果エリアに含まれる (1 ms)
    ✓ Instagram リンクが結果エリアに含まれる (1 ms)
    ✓ TikTok リンクが結果エリアに含まれる (1 ms)
    ✓ Threads リンクが結果エリアに含まれる
  recheck()
    ✓ result-area が非表示になる (1 ms)
    ✓ input-text にフォーカスが移る
  checkText()
    ✓ textarea が空のときは何もしない（fetch を呼ばない） (1 ms)
    ✓ API成功時: renderResult が呼ばれ result-area が表示される (1 ms)
    ✓ API成功時: ローディングが非表示になる (3 ms)
    ✓ API成功時: ボタンが再び enabled になる
    ✓ Lambda プロキシ形式 { body: string } も正しくパースされる (1 ms)
    ✓ Lambda プロキシ形式 { body: object } も正しくパースされる (1 ms)
    ✓ API が res.ok=false のとき: デモデータで結果が表示される (1 ms)
    ✓ fetch が reject のとき: デモデータで結果が表示される
    ✓ チェック実行中はローディングが表示される (1 ms)
    ✓ POST リクエストが JSON ボディで送信される (1 ms)

Test Suites: 1 passed, 1 total
Tests:       72 passed, 72 total
Snapshots:   0 total
Time:        0.372 s, estimated 1 s
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
