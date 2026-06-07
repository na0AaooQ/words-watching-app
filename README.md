# ことばみまもり

> 投稿前に、ひと呼吸。— SNS投稿前の炎上防止・文章リスク確認ツール
SNS投稿前の炎上防止・文章リスク確認ツール「ことばみまもり」のソースコード管理リポジトリ

[![サイトを見る](https://img.shields.io/badge/サイト-words--watching--app-4a6cf7?style=flat-square)](https://words-watching-app.na0aaooq.com/)
[![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)](#ライセンス--著作権)

---

## 概要

**「ことばみまもり」** とは、X（旧Twitter）、Instagram、TikTokなどのSNSに投稿したい文章について、投稿前にAIでチェックし、言葉のリスクを可視化するWebサービスです。

- 攻撃性・誹謗中傷度・感情強度を表示する。
- 言葉を整えるヒントを表示する。
- 利用シーンを、指定なし・SNS投稿・返信/コメント・仕事/依頼文・謝罪/説明文から選択できる。
- 文章アドバイスのトーンを、標準・やわらかめ・ビジネス向けから選択できる。
- 文章の確認後、任意で見直せる投稿前セルフチェックを表示する。
- 言葉を制限するのではなく、**投稿するかどうかの判断材料**を提供する。  
- 入力された文章はシステム内に保存されません。  
- 無料・ログインや登録不要で利用可能です。  

👉 **[https://words-watching-app.na0aaooq.com/](https://words-watching-app.na0aaooq.com/)**

---

## 操作マニュアル

- 「ことばみまもり」の使い方、操作マニュアルは以下になります。

👉 **[「ことばみまもり」の操作マニュアル](https://words-watching-app.na0aaooq.com/manual.html)**

---

## 多言語対応

本サービスは、日本語ページと英語ページを提供しています。英語ページは `/en/` 配下に配置し、各ページのヘッダーにある表示言語プルダウンから「日本語」/「English」を切り替えられます。

- 静的ページの英語対応は完了しています。
- 英語ページからの確認では、解析結果も英語で返ります。
- 日本語ページでは従来どおり日本語の解析結果を返します。
- APIリクエストに `language` を追加し、未指定または不正値の場合は既存互換性のため日本語扱いにします。

### 多言語ページ更新時の確認

多言語ページ、リンク、canonical / hreflang、sitemap.xml を更新した場合は、以下を確認します。

```
% npm run check:i18n
```

このコマンドでは、内部リンク、表示言語プルダウンの遷移先、html lang、canonical、hreflang、sitemap.xml、deploy script のデプロイ対象設定を簡易検証します。

デプロイ前には、dryrun で `/en/` 配下のHTML、`sitemap.xml`、CSS、既存日本語HTMLが対象に含まれていることも確認します。

```
% sh deploy_kotoba_mimamori_site.sh --dryrun
```

通常のユニットテストとLintは、以下で確認します。

```
% npm test
% npm run lint
```

---

## 画面イメージ

| トップページ | チェック結果 |
|---|---|
| 文章を入力してAIに解析を依頼 | 文章の攻撃性・誹謗中傷度・感情強度を表示、文章の改善ヒントを表示 |

- 画面のUIは、初見の方でも手軽に使いやすいよう、シンプルな構成にしています。
- 画面のテキストエリアに、リスクを確認したい文章を入力します。
- 必要に応じて「利用シーン」と「文章アドバイスのトーン」を選択し、文章を使う場面やアドバイスの雰囲気に合わせて確認できます。

<img width="1081" height="773" alt="manual-step1" src="https://github.com/user-attachments/assets/79d099a8-e7f0-461e-9876-9279ceeca6aa" />

- 文章の入力後、「確認してみるボタン」をクリックします。

<img width="1086" height="778" alt="manual-step2" src="https://github.com/user-attachments/assets/697d0c38-cb54-4274-9510-fe964128866e" />

- 以下のように、文章の確認結果(リスク、読み手によって気になりそうな点、言葉を整えるヒント)が表示されます。
- 確認結果の下には「次にできること」と「投稿前セルフチェック」が表示され、投稿・送信前の任意の見直しに利用できます。
- 確認結果を踏まえて、文章を修正したい場合、「文章を修正して再チェック」ボタンをクリックします。

<img width="1085" height="771" alt="manual-step3" src="https://github.com/user-attachments/assets/a7c44c2b-cb72-4663-897d-4f2220957b29" />

- 修正した文章をテキストエリアに入力して、「確認してみるボタン」をクリックします。
- もし、修正した文章をSNS投稿用にコピーしたい場合、「文章をコピー」ボタンをクリックします。

<img width="1087" height="775" alt="manual-step4" src="https://github.com/user-attachments/assets/3bd652f7-ad6a-40cb-a80b-4e5ddf5b3a14" />

- 再チェック後の確認結果が表示されます。
- 2回目以降のチェックの場合、チェック結果のリスク変化を確認できます。

<img width="1089" height="774" alt="manual-step5" src="https://github.com/user-attachments/assets/c699e659-033d-485e-a341-dd953168e017" />

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
ブラウザ（文章入力・利用シーン選択・アドバイスのトーン選択）
  → Amazon CloudFront
  → Amazon API Gateway
  → AWS Lambda
  → Amazon Bedrock (LLM)
  → 解析結果をブラウザに返却・表示
```

---

## 直近の主な変更（2026年5月）

- 入力画面に **利用シーン** 選択UIを追加しました。
- 利用シーンは「指定なし・おまかせ」「SNS投稿」「返信・コメント」「仕事・依頼文」「謝罪・説明文」から選択できます。
- APIリクエストに `scene` を追加し、Lambda側で `general` / `sns` / `reply` / `business` / `apology` を安全に受け取るようにしました。
- Bedrock向けプロンプトに、選択された利用シーンに応じた確認観点を反映しました。
- 入力画面に **文章アドバイスのトーン** 選択UIを追加しました。
- トーンは「バランスよく確認したい（標準）」「やわらかめに整えたい」「丁寧・ビジネス向けに整えたい」から選択できます。
- APIリクエストに `tone` を追加し、Lambda側で `standard` / `soft` / `business` を安全に受け取るようにしました。
- Bedrock向けプロンプトに、選択されたトーンに応じた改善アドバイスの方針を反映しました。
- 既存レスポンスJSON構造は変更せず、言葉を整えるヒントや言い換えの方向性にトーンを反映する方針を維持しています。
- マニュアル本文と画面キャプチャを、トーン選択UIに合わせて更新しました。
- AWS関連のソース・定義ファイルを `modules/aws/` 配下に整理し、API GatewayのSwagger定義を追加しました。
- チェック結果画面に、フロント固定表示の **投稿前セルフチェック** を追加しました。チェック状態は保存せず、APIにも送信しません。
- チェック結果画面のリスク表示を、内部値 `low` / `medium` / `high` は維持したまま、**低リスク（おだやかに伝わりそう）** / **中リスク（少し見直すと安心）** / **高リスク（ひと呼吸おいて見直したい）** の併記形式に調整しました。
- チェック結果画面の見出しを、**読み手によって気になりそうな点** / **言葉を整えるヒント** に調整しました。

---

# ファイル構成

```
words-watching-app/
├── index.html                         # サイトトップ画面のHTML,JS
├── index.test.js                      # サイトトップ画面のテストコード
├── about.html                         # サービス説明画面のHTML
├── manual.html                        # 操作マニュアル画面のHTML
├── consultation.html                  # 相談先画面のHTML
├── terms_of_service.html              # 利用規約画面のHTML
├── disclaimer.html                    # 免責事項画面のHTML
├── privacy.html                       # プライバシーポリシー画面のHTML
├── contact.html                       # お問い合わせ画面のHTML
├── en/                                # 英語版HTML
│   ├── index.html
│   ├── about.html
│   ├── manual.html
│   ├── consultation.html
│   ├── terms_of_service.html
│   ├── disclaimer.html
│   ├── privacy.html
│   └── contact.html
├── favicon.png                        # サイトのファビコン画像
├── favicon.svg                        # サイトのファビコン画像
├── ogp-image.png                      # サイトのOGP画像
├── sitemap.xml                        # サイトマップ
├── package.json                       # Jest / ESLint を含む開発用依存関係や npm scripts を定義するファイル
├── package-lock.json                  # Jest / ESLint を含む依存関係とバージョン情報を保存するファイル
├── eslint.config.cjs                  # ESLint の設定ファイル
├── README.md                          # 本リポジトリの説明
├── deploy_kotoba_mimamori_site.sh     # 静的サイトのデプロイ用スクリプト
├── scripts/
│   └── check-i18n-pages.js            # 多言語静的ページのリンク/SEO/sitemap検証
├── assets/
│   ├── css/
│   │   ├── common.css                 # 共通CSS
│   │   └── index.css                  # トップ画面用CSS
│   └── img/
│       └── manual-step*.png           # 操作マニュアル用画像
└── modules/
    └── aws/
        ├── api_gateway/
        │   └── words-watching-app-api-prod-swagger-apigateway.json  # API Gateway Swagger定義
        └── lambda/
            └── words-watching-app-lambda/
                └── lambda_function.py # API Gateway経由の入力をAmazon Bedrockへ送信し、レスポンスを処理するLambdaコード
```

---

## 特徴・工夫した点

- **プライバシー保護**: 入力テキストはシステム内に保存せず、LLMの学習にも利用しない
- **利用シーン選択**: SNS投稿、返信・コメント、仕事・依頼文、謝罪・説明文など、文章を使う場面に合わせて確認観点を調整可能
- **トーン選択**: 投稿目的や文脈に合わせ、標準・やわらかめ・ビジネス向けの文章アドバイスを選択可能
- **投稿前セルフチェック**: 確認結果の後に、投稿・送信前の任意の見直し項目を表示
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

(4) テスト実行やESLint実行に必要な依存関係をインストールします。

本リポジトリでは、Jest / jest-environment-jsdom / ESLint などの開発用依存関係を `package.json` で管理しています。  
以下のコマンドを実行し、依存関係を一括インストールします。  

```
% npm install
%
```

Jest と ESLint がインストールされたことを確認する場合は、以下のように実行します。

```
% npx jest --version
30.3.0
%
```

```
% npx eslint --version
v10.2.0
%
```

(5) 以下のいずれかのコマンドを実行し、リポジトリ内にあるユニットテストコード `index.test.js` で `index.html` のユニットテストを実行します。  

```
% npm test -- index.test.js
```

　または

```
% npx jest index.test.js
```

(6) ユニットテスト結果が表示されます。テスト結果を確認し、[Test Suites: 1 passed, 1 total]、[Tests: 107 passed, 107 total] と表示されており、テストが全件成功していることを確認します。

以下はテスト実行結果の表示例です。

```
% npm test -- index.test.js

> test
> jest index.test.js

 PASS  ./index.test.js
  onTextInput()
    ✓ 空文字のとき「0 / 50000」と表示し、ボタンが disabled になる (4 ms)
    ✓ 1文字以上入力するとボタンが enabled になる (1 ms)
    ✓ 1800文字以内は warn クラスなし (1 ms)
    ✓ 1801文字で warn クラスが付く (1 ms)
    ✓ 50000文字で over クラスが付く
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
    ✓ risk: low のとき「低リスク（おだやかに伝わりそう）」ラベルが表示される (1 ms)
    ✓ risk: medium のとき「中リスク（少し見直すと安心）」ラベルが表示される (1 ms)
    ✓ risk: high のとき「高リスク（ひと呼吸おいて見直したい）」ラベルが表示される (1 ms)
    ✓ summary が表示される
    ✓ reasons が <li> として描画される (1 ms)
    ✓ reasons がある場合「読み手によって気になりそうな点」セクションが表示される (1 ms)
    ✓ suggestions がある場合「言葉を整えるヒント」セクションが表示される (1 ms)
    ✓ suggestions が空のとき「言葉を整えるヒント」セクションが表示されない (1 ms)
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
Tests:       107 passed, 107 total
Snapshots:   0 total
Time:        0.372 s, estimated 1 s
Ran all test suites matching index.test.js.
% 
```

---

## ESLint 実行方法

本リポジトリでは、JavaScript ファイルに加えて、`index.html` 内のインライン JavaScript も ESLint による静的解析の対象としています。  
ESLint の設定は `eslint.config.cjs` に定義しています。

### ESLint 利用準備

ESLint 実行前に、前述の「ユニットテスト実行方法」の手順 (1) から (4) までを実施し、`npm install` で依存関係をインストールしてください。  

### ESLint による静的解析の実行

以下のコマンドを実行すると、リポジトリ内の `.js` / `.html` を対象に静的解析を実行できます。  

```
% npm run lint

> lint
> eslint . --ext .js,.html
%
```

### ESLint による自動修正

ESLint が自動修正できる内容については、以下のコマンドで修正できます。  

```
% npm run lint:fix

> lint:fix
> eslint . --ext .js,.html --fix
%
```

**(※) 補足**  
- `npm run lint` は静的解析のみを行い、ファイルは変更しません。  
- `npm run lint:fix` は ESLint が自動修正可能な内容のみを修正します。  
- 2026年4月時点では、`npm run lint` 実行時にエラーなく完了することを確認しています。  

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

**Copyright © 2025 青木直之 (@na0AaooQ) All Rights Reserved.**

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
