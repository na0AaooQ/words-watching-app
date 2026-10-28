
/* exported handler */
function handler(event) {
  var html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>メンテナンス中 | ことばみまもり</title>
  <style>
    body {
      margin: 0;
      padding: 32px 20px;
      font-family: system-ui, sans-serif;
      line-height: 1.7;
      color: #222;
      background: #fff;
    }
    main {
      max-width: 640px;
      margin: 10vh auto 0;
    }
    h1 { font-size: 1.6rem; }
    h2 { font-size: 1.15rem; }
    .subtitle { color: #555; }
    .english {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <main>
    <h1>ことばみまもり</h1>
    <p class="subtitle" lang="en">Kotoba Mimamori</p>
    <h2>現在、システムメンテナンス中です。</h2>
    <p>ご不便をおかけいたしますが、しばらく時間をおいてから再度アクセスしてください。</p>
    <section class="english" lang="en">
      <h2>This site is temporarily unavailable due to maintenance.</h2>
      <p>We apologize for the inconvenience. Please try again later.</p>
    </section>
  </main>
</body>
</html>`;

  return {
    statusCode: 503,
    statusDescription: 'Service Unavailable',
    headers: {
      'content-type': { value: 'text/html; charset=utf-8' },
      'cache-control': { value: 'no-store' },
      'x-content-type-options': { value: 'nosniff' },
      'referrer-policy': { value: 'no-referrer' },
      'x-frame-options': { value: 'DENY' },
      'content-security-policy': {
        value: "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
      }
    },
    body: event.request.method === 'HEAD' ? '' : html
  };
}

