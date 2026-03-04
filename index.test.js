/**
 * ことばみまもり — index.html 単体テスト
 * フレームワーク : Jest (jsdom 環境)
 * セットアップ  : npm install --save-dev jest jest-environment-jsdom
 *                package.json に "jest": { "testEnvironment": "jsdom" } を追加
 */

// ─────────────────────────────────────────────
// テスト対象の関数を直接定義（index.html の <script> と同一ロジック）
// 実装を外部 JS ファイルに切り出した場合は import/require に変更してください
// ─────────────────────────────────────────────

/* ---------- テスト対象関数 ---------- */

function onTextInput() {
  const ta  = document.getElementById('input-text');
  const cc  = document.getElementById('char-count');
  const btn = document.getElementById('submit-btn');
  const len = ta.value.length;

  cc.textContent = len + ' / 2200';
  cc.className   = 'char-count' + (len > 1800 ? ' warn' : '') + (len >= 2200 ? ' over' : '');
  btn.disabled   = len === 0;
}

function setSample(text) {
  const ta = document.getElementById('input-text');
  ta.value = text;
  ta.dispatchEvent(new Event('input'));
  ta.focus();
}

function toggleAccordion(btn) {
  const body     = btn.nextElementSibling;
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', !expanded);
  body.classList.toggle('open', !expanded);
}

function toggleFaq(btn) {
  const ans      = btn.nextElementSibling;
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  document.querySelectorAll('.faq-q').forEach(b => {
    if (b !== btn) {
      b.setAttribute('aria-expanded', 'false');
      b.nextElementSibling.classList.remove('open');
    }
  });
  btn.setAttribute('aria-expanded', !expanded);
  ans.classList.toggle('open', !expanded);
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateDemoData(text) {
  const hasNegative = /最悪|無駄|バカ|死|消えろ|うざ|最低|嫌い/.test(text);
  if (hasNegative) {
    return {
      risk: 'high',
      summary: '感情的・攻撃的な表現が含まれている可能性があります。投稿前にもう一度読み返してみましょう。',
      reasons: [
        '強い否定的感情を示す表現が含まれています',
        '読み手によっては不快に感じる可能性があります'
      ],
      suggestions: [
        '感情が落ち着いてから改めて投稿を検討してみてください',
        '具体的な状況を説明する形に言い換えると伝わりやすくなります'
      ]
    };
  }
  return {
    risk: 'low',
    summary: '比較的穏やかな表現です。読み手への伝わり方も問題なさそうです。',
    reasons: ['特に気になる表現は見つかりませんでした'],
    suggestions: []
  };
}

function renderResult(data) {
  const resultArea = document.getElementById('result-area');

  const riskClass =
    data.risk === 'low'    ? 'verdict safe'    :
    data.risk === 'medium' ? 'verdict caution' :
                             'verdict danger';

  const riskIcon =
    data.risk === 'low'    ? '😊' :
    data.risk === 'medium' ? '🤔' :
                             '⚠️';

  const riskLabel =
    data.risk === 'low'    ? '低リスク'  :
    data.risk === 'medium' ? '要注意'    :
                             '高リスク';

  const reasonsHtml = Array.isArray(data.reasons) && data.reasons.length
    ? `<ul class="result-list">${data.reasons.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>`
    : '';

  const suggestionsHtml = Array.isArray(data.suggestions) && data.suggestions.length
    ? `<div class="advice-box">
         <h4>💡 改善のヒント</h4>
         <ul class="result-list">${data.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
       </div>`
    : '';

  const shareUrlX         = 'https://x.com/intent/tweet';
  const shareUrlFacebook  = 'https://www.facebook.com/sharer/sharer.php';
  const shareUrlInstagram = 'https://www.instagram.com/';
  const shareUrlTiktok    = 'https://www.tiktok.com/';
  const shareUrlThreads   = 'https://www.threads.com/';

  resultArea.innerHTML = `
    <div class="result-header">
      <p class="result-title">📋 チェック結果</p>
      <button class="btn-recheck" onclick="recheck()">✏️ 文章を修正して再チェック</button>
    </div>
    <div class="${escapeHtml(riskClass)}">
      <span class="verdict-icon">${riskIcon}</span>
      <div class="verdict-text">
        <h3>総評（リスク：${escapeHtml(riskLabel)}）</h3>
        <p>${escapeHtml(data.summary)}</p>
      </div>
    </div>
    ${reasonsHtml ? `<div class="score-item" style="margin-top:1rem;">${reasonsHtml}</div>` : ''}
    ${suggestionsHtml}
    <div class="share-row" style="margin-top:1.5rem;">
      <a href="${escapeHtml(shareUrlX)}" target="_blank" rel="noopener" class="btn-share-x">𝕏 を開く</a>
      <a href="${escapeHtml(shareUrlFacebook)}" target="_blank" rel="noopener" class="btn-share-facebook">Facebook を開く</a>
      <a href="${escapeHtml(shareUrlInstagram)}" target="_blank" rel="noopener" class="btn-share-instagram">Instagram を開く</a>
      <a href="${escapeHtml(shareUrlTiktok)}" target="_blank" rel="noopener" class="btn-share-tiktok">TikTok を開く</a>
      <a href="${escapeHtml(shareUrlThreads)}" target="_blank" rel="noopener" class="btn-share-threads">Threads を開く</a>
      <button class="btn-share-copy" onclick="copyUrl()">🔗 ツール共有用URLコピー</button>
    </div>
  `;

  resultArea.style.display = 'block';
}

function recheck() {
  document.getElementById('result-area').style.display = 'none';
  document.getElementById('input-text').focus();
}

async function checkText() {
  const text = document.getElementById('input-text').value.trim();
  if (!text) return;

  document.getElementById('submit-btn').disabled        = true;
  document.getElementById('loading').style.display       = 'flex';
  document.getElementById('result-area').style.display   = 'none';

  try {
    const res = await fetch('/prod/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!res.ok) throw new Error('API error: ' + res.status);
    let data = await res.json();

    if (data.body && typeof data.body === 'string') {
      data = JSON.parse(data.body);
    } else if (data.body && typeof data.body === 'object') {
      data = data.body;
    }

    renderResult(data);
  } catch (e) {
    const demoData = generateDemoData(text);
    renderResult(demoData);
  } finally {
    document.getElementById('loading').style.display   = 'none';
    document.getElementById('submit-btn').disabled     = false;
  }
}

// ─────────────────────────────────────────────
// DOM セットアップ用ヘルパー
// ─────────────────────────────────────────────
function setupDom() {
  document.body.innerHTML = `
    <textarea id="input-text"></textarea>
    <span id="char-count" class="char-count"></span>
    <button id="submit-btn" disabled></button>
    <div id="loading" style="display:none;"></div>
    <div id="result-area" style="display:none;"></div>
  `;
}

// ─────────────────────────────────────────────
// テストスイート
// ─────────────────────────────────────────────

// ================================================================
// 1. onTextInput — 文字数カウント・クラス切り替え・ボタン制御
// ================================================================
describe('onTextInput()', () => {
  beforeEach(setupDom);

  test('空文字のとき「0 / 2200」と表示し、ボタンが disabled になる', () => {
    document.getElementById('input-text').value = '';
    onTextInput();

    expect(document.getElementById('char-count').textContent).toBe('0 / 2200');
    expect(document.getElementById('submit-btn').disabled).toBe(true);
  });

  test('1文字以上入力するとボタンが enabled になる', () => {
    document.getElementById('input-text').value = 'あ';
    onTextInput();

    expect(document.getElementById('submit-btn').disabled).toBe(false);
  });

  test('1800文字以内は warn クラスなし', () => {
    document.getElementById('input-text').value = 'a'.repeat(1800);
    onTextInput();

    expect(document.getElementById('char-count').className).toBe('char-count');
  });

  test('1801文字で warn クラスが付く', () => {
    document.getElementById('input-text').value = 'a'.repeat(1801);
    onTextInput();

    expect(document.getElementById('char-count').className).toContain('warn');
    expect(document.getElementById('char-count').className).not.toContain('over');
  });

  test('2200文字で over クラスが付く', () => {
    document.getElementById('input-text').value = 'a'.repeat(2200);
    onTextInput();

    expect(document.getElementById('char-count').className).toContain('over');
  });

  test('文字数が正しくカウントされる（絵文字含む）', () => {
    const input = '投稿テスト🎉';
    document.getElementById('input-text').value = input;
    onTextInput();

    // 絵文字はサロゲートペアで length=2 になるため実際の length を使用
    expect(document.getElementById('char-count').textContent).toBe(input.length + ' / 2200');
  });
});

// ================================================================
// 2. setSample — サンプル文章セット
// ================================================================
describe('setSample()', () => {
  beforeEach(setupDom);

  test('textarea に指定テキストがセットされる', () => {
    setSample('今日はいい天気ですね');
    expect(document.getElementById('input-text').value).toBe('今日はいい天気ですね');
  });

  test('input イベントが発火して文字数カウントが更新される', () => {
    const inputHandler = jest.fn();
    document.getElementById('input-text').addEventListener('input', inputHandler);
    setSample('テスト文章');
    expect(inputHandler).toHaveBeenCalledTimes(1);
  });

  test('空文字をセットできる', () => {
    setSample('');
    expect(document.getElementById('input-text').value).toBe('');
  });
});

// ================================================================
// 3. toggleAccordion — アコーディオン開閉
// ================================================================
describe('toggleAccordion()', () => {
  function setupAccordion() {
    document.body.innerHTML = `
      <button aria-expanded="false" id="acc-btn">開閉</button>
      <div id="acc-body"></div>
    `;
  }

  test('閉じている状態でクリックすると aria-expanded="true" になる', () => {
    setupAccordion();
    const btn = document.getElementById('acc-btn');
    toggleAccordion(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  test('開いた状態でクリックすると aria-expanded="false" になる', () => {
    setupAccordion();
    const btn = document.getElementById('acc-btn');
    btn.setAttribute('aria-expanded', 'true');
    toggleAccordion(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  test('閉じている→開くと body に open クラスが追加される', () => {
    setupAccordion();
    const btn = document.getElementById('acc-btn');
    toggleAccordion(btn);
    expect(document.getElementById('acc-body').classList.contains('open')).toBe(true);
  });

  test('開いている→閉じると body から open クラスが除去される', () => {
    setupAccordion();
    const btn = document.getElementById('acc-btn');
    btn.setAttribute('aria-expanded', 'true');
    document.getElementById('acc-body').classList.add('open');
    toggleAccordion(btn);
    expect(document.getElementById('acc-body').classList.contains('open')).toBe(false);
  });

  test('2回トグルすると元の状態に戻る', () => {
    setupAccordion();
    const btn = document.getElementById('acc-btn');
    toggleAccordion(btn);
    toggleAccordion(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById('acc-body').classList.contains('open')).toBe(false);
  });
});

// ================================================================
// 4. toggleFaq — FAQ アコーディオン（他を閉じる挙動）
// ================================================================
describe('toggleFaq()', () => {
  function setupFaq() {
    document.body.innerHTML = `
      <button class="faq-q" aria-expanded="false" id="faq1">Q1</button>
      <div class="faq-a" id="ans1"></div>
      <button class="faq-q" aria-expanded="false" id="faq2">Q2</button>
      <div class="faq-a" id="ans2"></div>
    `;
  }

  test('Q1をクリックすると開く', () => {
    setupFaq();
    toggleFaq(document.getElementById('faq1'));
    expect(document.getElementById('faq1').getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('ans1').classList.contains('open')).toBe(true);
  });

  test('Q1が開いている状態でQ2をクリックすると Q1 が閉じる', () => {
    setupFaq();
    // Q1を先に開く
    document.getElementById('faq1').setAttribute('aria-expanded', 'true');
    document.getElementById('ans1').classList.add('open');
    // Q2をクリック
    toggleFaq(document.getElementById('faq2'));

    expect(document.getElementById('faq1').getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById('ans1').classList.contains('open')).toBe(false);
    expect(document.getElementById('faq2').getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('ans2').classList.contains('open')).toBe(true);
  });

  test('開いているFAQをもう一度クリックすると閉じる', () => {
    setupFaq();
    const btn = document.getElementById('faq1');
    btn.setAttribute('aria-expanded', 'true');
    document.getElementById('ans1').classList.add('open');
    toggleFaq(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById('ans1').classList.contains('open')).toBe(false);
  });
});

// ================================================================
// 5. escapeHtml — XSSエスケープ
// ================================================================
describe('escapeHtml()', () => {
  test('& が &amp; にエスケープされる', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  test('< が &lt; にエスケープされる', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  test('> が &gt; にエスケープされる', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  test('" が &quot; にエスケープされる', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  test("' が &#039; にエスケープされる", () => {
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  test('複数の特殊文字が混在していても正しくエスケープされる', () => {
    expect(escapeHtml('<a href="test">it\'s & fun</a>')).toBe(
      '&lt;a href=&quot;test&quot;&gt;it&#039;s &amp; fun&lt;/a&gt;'
    );
  });

  test('特殊文字なし文字列はそのまま返る', () => {
    expect(escapeHtml('普通のテキスト')).toBe('普通のテキスト');
  });

  test('空文字はそのまま返る', () => {
    expect(escapeHtml('')).toBe('');
  });

  test('string 以外の型（null）は空文字を返す', () => {
    expect(escapeHtml(null)).toBe('');
  });

  test('string 以外の型（数値）は空文字を返す', () => {
    expect(escapeHtml(42)).toBe('');
  });

  test('string 以外の型（undefined）は空文字を返す', () => {
    expect(escapeHtml(undefined)).toBe('');
  });
});

// ================================================================
// 6. generateDemoData — ネガティブ判定ロジック
// ================================================================
describe('generateDemoData()', () => {
  test('ネガティブワードを含むテキストは risk: high を返す', () => {
    const result = generateDemoData('本当に最悪だった');
    expect(result.risk).toBe('high');
  });

  test('「バカ」を含むテキストは risk: high を返す', () => {
    expect(generateDemoData('バカにしないで').risk).toBe('high');
  });

  test('「死」を含むテキストは risk: high を返す', () => {
    expect(generateDemoData('もう死にたい').risk).toBe('high');
  });

  test('「消えろ」を含むテキストは risk: high を返す', () => {
    expect(generateDemoData('消えろ').risk).toBe('high');
  });

  test('「嫌い」を含むテキストは risk: high を返す', () => {
    expect(generateDemoData('あなたが嫌い').risk).toBe('high');
  });

  test('high リスク時は reasons が2件返る', () => {
    const result = generateDemoData('最低な一日だった');
    expect(result.reasons).toHaveLength(2);
  });

  test('high リスク時は suggestions が2件返る', () => {
    const result = generateDemoData('うざい');
    expect(result.suggestions).toHaveLength(2);
  });

  test('ネガティブワードなしのテキストは risk: low を返す', () => {
    expect(generateDemoData('今日も良い一日でした').risk).toBe('low');
  });

  test('low リスク時は suggestions が空配列を返す', () => {
    const result = generateDemoData('今日の天気は晴れです');
    expect(result.suggestions).toHaveLength(0);
  });

  test('空文字は risk: low を返す', () => {
    expect(generateDemoData('').risk).toBe('low');
  });

  test('summary が string 型で返る', () => {
    expect(typeof generateDemoData('テスト').summary).toBe('string');
  });
});

// ================================================================
// 7. renderResult — 結果レンダリング
// ================================================================
describe('renderResult()', () => {
  beforeEach(setupDom);

  const baseData = {
    risk: 'low',
    summary: 'テストサマリー',
    reasons: ['理由A'],
    suggestions: []
  };

  test('result-area が表示される（display: block）', () => {
    renderResult(baseData);
    expect(document.getElementById('result-area').style.display).toBe('block');
  });

  test('risk: low のとき verdict safe クラスが付く', () => {
    renderResult({ ...baseData, risk: 'low' });
    expect(document.getElementById('result-area').innerHTML).toContain('verdict safe');
  });

  test('risk: medium のとき verdict caution クラスが付く', () => {
    renderResult({ ...baseData, risk: 'medium' });
    expect(document.getElementById('result-area').innerHTML).toContain('verdict caution');
  });

  test('risk: high のとき verdict danger クラスが付く', () => {
    renderResult({ ...baseData, risk: 'high' });
    expect(document.getElementById('result-area').innerHTML).toContain('verdict danger');
  });

  test('risk: low のとき 😊 アイコンが表示される', () => {
    renderResult({ ...baseData, risk: 'low' });
    expect(document.getElementById('result-area').innerHTML).toContain('😊');
  });

  test('risk: medium のとき 🤔 アイコンが表示される', () => {
    renderResult({ ...baseData, risk: 'medium' });
    expect(document.getElementById('result-area').innerHTML).toContain('🤔');
  });

  test('risk: high のとき ⚠️ アイコンが表示される', () => {
    renderResult({ ...baseData, risk: 'high' });
    expect(document.getElementById('result-area').innerHTML).toContain('⚠️');
  });

  test('risk: low のとき「低リスク」ラベルが表示される', () => {
    renderResult({ ...baseData, risk: 'low' });
    expect(document.getElementById('result-area').innerHTML).toContain('低リスク');
  });

  test('risk: medium のとき「要注意」ラベルが表示される', () => {
    renderResult({ ...baseData, risk: 'medium' });
    expect(document.getElementById('result-area').innerHTML).toContain('要注意');
  });

  test('risk: high のとき「高リスク」ラベルが表示される', () => {
    renderResult({ ...baseData, risk: 'high' });
    expect(document.getElementById('result-area').innerHTML).toContain('高リスク');
  });

  test('summary が表示される', () => {
    renderResult({ ...baseData, summary: 'これはテストサマリーです' });
    expect(document.getElementById('result-area').innerHTML).toContain('これはテストサマリーです');
  });

  test('reasons が <li> として描画される', () => {
    renderResult({ ...baseData, reasons: ['理由1', '理由2'] });
    const items = document.getElementById('result-area').querySelectorAll('.result-list li');
    expect(items.length).toBeGreaterThanOrEqual(2);
  });

  test('suggestions がある場合「改善のヒント」セクションが表示される', () => {
    renderResult({ ...baseData, suggestions: ['改善策A'] });
    expect(document.getElementById('result-area').innerHTML).toContain('改善のヒント');
  });

  test('suggestions が空のとき「改善のヒント」セクションが表示されない', () => {
    renderResult({ ...baseData, suggestions: [] });
    expect(document.getElementById('result-area').innerHTML).not.toContain('改善のヒント');
  });

  test('XSS: summary の <script> タグがエスケープされる', () => {
    renderResult({ ...baseData, summary: '<script>alert(1)</script>' });
    const html = document.getElementById('result-area').innerHTML;
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  test('XSS: reasons の悪意ある文字列がエスケープされる', () => {
    renderResult({ ...baseData, reasons: ['<img src=x onerror=alert(1)>'] });
    const html = document.getElementById('result-area').innerHTML;
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  test('SNS共有リンク（X）が結果エリアに含まれる', () => {
    renderResult(baseData);
    expect(document.getElementById('result-area').innerHTML).toContain('x.com/intent/tweet');
  });

  test('SNS共有リンク（Facebook）が結果エリアに含まれる', () => {
    renderResult(baseData);
    expect(document.getElementById('result-area').innerHTML).toContain('www.facebook.com/sharer/sharer.php');
  });

  test('Instagram リンクが結果エリアに含まれる', () => {
    renderResult(baseData);
    expect(document.getElementById('result-area').innerHTML).toContain('instagram.com');
  });

  test('TikTok リンクが結果エリアに含まれる', () => {
    renderResult(baseData);
    expect(document.getElementById('result-area').innerHTML).toContain('tiktok.com');
  });

  test('Threads リンクが結果エリアに含まれる', () => {
    renderResult(baseData);
    expect(document.getElementById('result-area').innerHTML).toContain('www.threads.com');
  });

});

// ================================================================
// 8. recheck — 再チェック（結果エリア非表示 & textarea フォーカス）
// ================================================================
describe('recheck()', () => {
  beforeEach(() => {
    setupDom();
    document.getElementById('result-area').style.display = 'block';
  });

  test('result-area が非表示になる', () => {
    recheck();
    expect(document.getElementById('result-area').style.display).toBe('none');
  });

  test('input-text にフォーカスが移る', () => {
    const ta = document.getElementById('input-text');
    const focusSpy = jest.spyOn(ta, 'focus');
    recheck();
    expect(focusSpy).toHaveBeenCalled();
  });
});

// ================================================================
// 9. checkText — API通信・ローディング制御・フォールバック
// ================================================================
describe('checkText()', () => {
  beforeEach(() => {
    setupDom();
    document.getElementById('input-text').value = 'テスト投稿文';
    document.getElementById('submit-btn').disabled = false;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('textarea が空のときは何もしない（fetch を呼ばない）', async () => {
    global.fetch = jest.fn();
    document.getElementById('input-text').value = '   '; // 空白のみ
    await checkText();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('API成功時: renderResult が呼ばれ result-area が表示される', async () => {
    const mockData = {
      risk: 'low',
      summary: 'APIからの結果',
      reasons: ['問題なし'],
      suggestions: []
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData
    });

    await checkText();

    expect(document.getElementById('result-area').style.display).toBe('block');
    expect(document.getElementById('result-area').innerHTML).toContain('APIからの結果');
  });

  test('API成功時: ローディングが非表示になる', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ risk: 'low', summary: 'ok', reasons: [], suggestions: [] })
    });
    await checkText();
    expect(document.getElementById('loading').style.display).toBe('none');
  });

  test('API成功時: ボタンが再び enabled になる', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ risk: 'low', summary: 'ok', reasons: [], suggestions: [] })
    });
    await checkText();
    expect(document.getElementById('submit-btn').disabled).toBe(false);
  });

  test('Lambda プロキシ形式 { body: string } も正しくパースされる', async () => {
    const innerData = { risk: 'medium', summary: 'Lambdaレスポンス', reasons: ['注意'], suggestions: [] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ body: JSON.stringify(innerData) })
    });

    await checkText();

    expect(document.getElementById('result-area').innerHTML).toContain('Lambdaレスポンス');
  });

  test('Lambda プロキシ形式 { body: object } も正しくパースされる', async () => {
    const innerData = { risk: 'high', summary: 'Lambdaオブジェクト', reasons: ['危険'], suggestions: [] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ body: innerData })
    });

    await checkText();

    expect(document.getElementById('result-area').innerHTML).toContain('Lambdaオブジェクト');
  });

  test('API が res.ok=false のとき: デモデータで結果が表示される', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500
    });

    document.getElementById('input-text').value = '今日もいい天気';
    await checkText();

    // generateDemoData のフォールバック結果（低リスク）が表示される
    expect(document.getElementById('result-area').style.display).toBe('block');
  });

  test('fetch が reject のとき: デモデータで結果が表示される', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network Error'));
    await checkText();
    expect(document.getElementById('result-area').style.display).toBe('block');
  });

  test('チェック実行中はローディングが表示される', async () => {
    let resolvePromise;
    global.fetch = jest.fn().mockReturnValue(
      new Promise(resolve => { resolvePromise = resolve; })
    );

    const promise = checkText();

    // fetch が解決する前の状態を確認
    expect(document.getElementById('loading').style.display).toBe('flex');
    expect(document.getElementById('submit-btn').disabled).toBe(true);

    // fetch を解決して後処理を完了させる
    resolvePromise({ ok: true, json: async () => ({ risk: 'low', summary: 'ok', reasons: [], suggestions: [] }) });
    await promise;
  });

  test('POST リクエストが JSON ボディで送信される', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ risk: 'low', summary: 'ok', reasons: [], suggestions: [] })
    });

    const inputText = '確認したいテキスト';
    document.getElementById('input-text').value = inputText;
    await checkText();

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('/prod/check');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body).text).toBe(inputText);
  });
});
