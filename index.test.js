/**
 * ことばみまもり — index.html 単体テスト
 * フレームワーク : Jest (jsdom 環境)
 * セットアップ  : npm install --save-dev jest jest-environment-jsdom
 *                package.json に "jest": { "testEnvironment": "jsdom" } を追加
 */

/* global require */

const { readFileSync } = require('node:fs');

// ─────────────────────────────────────────────
// テスト対象の関数を直接定義（index.html の <script> と同一ロジック）
// 実装を外部 JS ファイルに切り出した場合は import/require に変更してください
// ─────────────────────────────────────────────

/* ---------- テスト対象関数 ---------- */

function onTextInput() {
  // 入力可能な最大文字数
  const inputMaxNumberOfChar = 50000;

  const ta  = document.getElementById('input-text');
  const cc  = document.getElementById('char-count');
  const btn = document.getElementById('submit-btn');
  const len = ta.value.length;

  cc.textContent = len + ' / ' + inputMaxNumberOfChar;
  cc.className   = 'char-count' + (len > 1800 ? ' warn' : '') + (len >= inputMaxNumberOfChar ? ' over' : '');
  btn.disabled   = len === 0;

  const guide = document.getElementById('sns-guide');
  if (len === 0) {
    guide.style.display = 'none';
  } else {
    guide.style.display = 'flex';
    const limits = { x: 280, threads: 500, tiktok: 2200, instagram: 2200, facebook: 50000, line: 1000, linkedin: 3000, youtube: 350, pixiv: 140, note: 500 };
    Object.entries(limits).forEach(([key, limit]) => {
      const el = document.getElementById('guide-' + key);
      if (el) el.classList.toggle('over-limit', len > limit);
    });
  }
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

const nextActionTipsByRisk = {
  low: [
    'このまま投稿する前に、誤字や言い回しを軽く確認する',
    '読み手に伝えたいことが一番目立っているか見直す',
    '必要に応じて、少しだけ言葉を整える'
  ],
  medium: [
    '少し時間を置いてから、もう一度読み返す',
    '強く見える表現があれば、少しやわらかい言葉に置き換える',
    '相手の人格ではなく、具体的な出来事や行動に焦点を当てる'
  ],
  high: [
    '今すぐ投稿せず、少し時間を置いてから見直す',
    '感情が強く出ている部分を、事実と気持ちに分けて整理する',
    '公開投稿ではなく、下書きやメモとして残すことも検討する'
  ]
};

function getNextActionTips(risk) {
  return nextActionTipsByRisk[risk] || nextActionTipsByRisk.medium;
}

function getRiskLabel(risk) {
  if (risk === 'low') return '低リスク（おだやかに伝わりそう）';
  if (risk === 'medium') return '中リスク（少し見直すと安心）';
  return '高リスク（ひと呼吸おいて見直したい）';
}

const prePostChecklistItems = [
  '相手の人格ではなく、具体的な出来事や行動について書いている',
  '主語が大きすぎたり、曖昧だったりしないか確認している',
  '公開範囲や送る相手に合った表現になっている',
  '今の感情が落ち着いてから見ても、同じ文章を出せそう'
];

const informationCheckingItems = [
  {
    label: '元の情報源や根拠を確認した',
    description: '公式発表、元の投稿、資料、統計など、情報の出どころをたどれるか確認します。出典を文章とは別に添える場合も、読み手が確認できる形になっているか見直します。'
  },
  {
    label: '関係する公的機関などの一次情報を確認した',
    description: '必要に応じて、その内容を担当・所管する日本政府、関係省庁、自治体、その他の公的機関の公式サイトや公式発表を確認します。公的機関を名乗るサイトやアカウントが、実際の公式な発信元かどうかも確認します。'
  },
  {
    label: '日時・地域・対象・更新状況を確認した',
    description: 'いつ、どこで、誰や何を対象とした情報かを確認します。現在もその地域・対象・条件に当てはまるか、その後に更新、訂正、撤回、続報が出ていないかも確認します。'
  },
  {
    label: '事実・推測・意見・伝聞を分けている',
    description: '確認できた内容、ご自身の推測や意見、人から聞いた情報が、読み手に区別して伝わるか確認します。確認できていない内容は、そのことが分かる表現にすると、誤解を減らせます。'
  },
  {
    label: '必要に応じて、別の独立した情報源も確認した',
    description: '重要な情報や影響の大きい情報は、一つの投稿や一人の発信者だけで判断せず、必要に応じて、別の独立した情報源でも確認します。同じ情報を転載・引用しているだけではなく、別の根拠を持つ情報源かどうかも確認します。'
  },
  {
    label: '画像・動画・図表の作成元や根拠を確認した',
    description: '元の投稿や資料、撮影・作成日時、場所、対象範囲などを確認します。切り抜き、加工、別の出来事からの流用、生成AIによる作成の可能性にも注意します。表やグラフでは、軸、対象となった人数・件数、対象期間なども確認します。'
  }
];

let previousRisk = null;

function handleInformationCheckingSummaryKeydown(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  const details = event.currentTarget.parentElement;
  if (details && details.tagName === 'DETAILS') {
    details.open = !details.open;
  }
}

function handleInformationCheckingCheckboxKeydown(event) {
  if (event.key !== ' ') return;
  event.preventDefault();
  event.currentTarget.checked = !event.currentTarget.checked;
}

function getInformationCheckingTipsHtml() {
  return `
    <details class="information-checking-card">
      <summary class="information-checking-summary" onkeydown="handleInformationCheckingSummaryKeydown(event)">
        <span class="information-checking-summary-row">
          <span class="information-checking-title">
            <span class="information-checking-icon" aria-hidden="true">ⓘ</span>
            <span>情報を確かめるヒント</span>
          </span>
          <span class="information-checking-toggle-icon" aria-hidden="true"></span>
        </span>
        <span class="information-checking-teaser">情報を共有する前に、情報の根拠や事実関係なども確認してみませんか？</span>
      </summary>
      <div class="information-checking-body">
        <p class="information-checking-intro">情報の出どころ、現在も有効な情報かどうか、事実や根拠などを、ご自身で確かめるための任意のチェックです。内容に合う項目をご利用ください。</p>
        <ul class="information-checking-list">
          ${informationCheckingItems.map((item, index) => `
            <li>
              <label class="information-checking-item" for="information-check-${index + 1}">
                <input type="checkbox" id="information-check-${index + 1}" autocomplete="off" onkeydown="handleInformationCheckingCheckboxKeydown(event)">
                <span>${escapeHtml(item.label)}</span>
              </label>
            </li>
          `).join('')}
        </ul>
        <details class="information-checking-more">
          <summary onkeydown="handleInformationCheckingSummaryKeydown(event)">
            <span>各項目について詳しく見る</span>
            <span class="information-checking-toggle-icon" aria-hidden="true"></span>
          </summary>
          <div class="information-checking-explanations">
            ${informationCheckingItems.map(item => `
              <section class="information-checking-explanation">
                <h5>${escapeHtml(item.label)}</h5>
                <p>${escapeHtml(item.description)}</p>
              </section>
            `).join('')}
          </div>
        </details>
        <div class="information-checking-notes">
          <p>このヒントは、情報の真偽や現在も有効な情報かどうかを判定・保証するものではありません。重要な情報は、関係する公的機関や信頼できる一次情報をご確認ください。</p>
          <p>災害、医療、法律、安全に関する判断は、このチェックだけで行わないでください。</p>
        </div>
      </div>
    </details>`;
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

  const riskLabel = getRiskLabel(data.risk);

  const reasonsHtml = Array.isArray(data.reasons) && data.reasons.length
    ? `<ul class="result-list">${data.reasons.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>`
    : '';

  const suggestionsHtml = Array.isArray(data.suggestions) && data.suggestions.length
    ? `<div class="advice-box">
         <h4>💡 言葉を整えるヒント</h4>
         <ul class="result-list">${data.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
       </div>`
    : '';

  const nextActionTipsHtml = `
    <div class="next-action-card">
      <h4>次にできること</h4>
      <p>必要に応じて、投稿前の見直しに使ってください。</p>
      <ul class="result-list">${getNextActionTips(data.risk).map(tip => `<li>${escapeHtml(tip)}</li>`).join('')}</ul>
    </div>`;

  const prePostChecklistHtml = `
    <div class="pre-post-checklist-card" aria-labelledby="pre-post-checklist-title">
      <h4 id="pre-post-checklist-title">投稿前セルフチェック</h4>
      <p>投稿・送信前に、必要に応じて確認してみてください。</p>
      <ul class="pre-post-checklist">
        ${prePostChecklistItems.map((item, index) => `
          <li>
            <label class="pre-post-checklist-item" for="pre-post-check-${index + 1}">
              <input type="checkbox" id="pre-post-check-${index + 1}" autocomplete="off">
              <span>${escapeHtml(item)}</span>
            </label>
          </li>
        `).join('')}
      </ul>
    </div>`;

  const shareUrlX         = 'https://x.com/intent/tweet';
  const shareUrlFacebook  = 'https://www.facebook.com/sharer/sharer.php';
  const shareUrlInstagram = 'https://www.instagram.com/';
  const shareUrlTiktok    = 'https://www.tiktok.com/';
  const shareUrlThreads   = 'https://www.threads.com/';
  const shareUrlLine      = 'https://line.me/R/nv/chat';
  const shareUrlLinkedin  = 'https://www.linkedin.com/';
  const shareUrlYoutube   = 'https://www.youtube.com/';
  const shareUrlPixiv     = 'https://www.pixiv.net/';
  const shareUrlNote      = 'https://note.com/';
  const shareUrlGirlsChannel = 'https://girlschannel.net/';
  const shareUrlSukiKira  = 'https://suki-kira.com/';

  let riskChangeBannerHtml = '';
  if (previousRisk !== null && previousRisk !== data.risk) {
    const prevLabel = getRiskLabel(previousRisk);
    const riskOrder = { low: 0, medium: 1, high: 2 };
    const improved = riskOrder[data.risk] < riskOrder[previousRisk];
    riskChangeBannerHtml = `
      <div class="risk-change-banner ${improved ? 'improved' : 'worsened'}">
        <span>${improved ? '🎉' : '📢'}</span>
        <span>前回：${escapeHtml(prevLabel)} → 今回：${escapeHtml(riskLabel)}</span>
      </div>`;
  } else if (previousRisk !== null && previousRisk === data.risk) {
    riskChangeBannerHtml = `
      <div class="risk-change-banner unchanged">
        <span>↔️</span>
        <span>前回と同じ判定です（リスク：${escapeHtml(riskLabel)}）</span>
      </div>`;
  }
  previousRisk = data.risk;

  resultArea.innerHTML = `
    <div class="result-header">
      <p class="result-title">📋 チェック結果</p>
      <div class="result-actions">
        <button class="btn-recheck" onclick="showResultEditor()">✏️ 結果を見ながら修正する</button>
        <button class="btn-copy-text" id="btn-copy-text-result" onclick="copyText('btn-copy-text-result')">📋 文章をコピー</button>
      </div>
    </div>
    ${riskChangeBannerHtml}
    <div class="${escapeHtml(riskClass)}">
      <span class="verdict-icon">${riskIcon}</span>
      <div class="verdict-text">
        <h3>総評（リスク：${escapeHtml(riskLabel)}）</h3>
        <p>${escapeHtml(data.summary)}</p>
      </div>
    </div>
    ${reasonsHtml ? `
    <div class="score-item" style="margin-top:1rem;">
      <p style="font-size:0.95rem;font-weight:700;margin-bottom:0.5rem;color:var(--text);">🔍 読み手によって気になりそうな点</p>
      ${reasonsHtml}
    </div>` : ''}
    ${suggestionsHtml}
    ${nextActionTipsHtml}
    ${prePostChecklistHtml}
    ${getInformationCheckingTipsHtml()}
    <div class="result-followup-actions">
      <button class="btn-recheck" onclick="showResultEditor()">✏️ 結果を見ながら修正する</button>
      <button class="btn-copy-text" id="btn-copy-text-result-bottom" onclick="copyText('btn-copy-text-result-bottom')">📋 文章をコピー</button>
    </div>
    <div id="result-editor" class="result-editor" style="display:none;">
      <h4>✏️ 結果を見ながら文章を修正する</h4>
      <p>チェック結果を見ながら、必要に応じて文章を整えられます。</p>
      <textarea
        id="result-edit-text"
        maxlength="50000"
        oninput="syncResultEditorText()"
        aria-label="チェック結果を見ながら修正する文章"
      ></textarea>
      <div class="result-editor-actions">
        <button class="btn-primary" onclick="checkText()">🔍 修正した文章を再チェック</button>
        <button class="btn-copy-text" id="btn-copy-text-editor" onclick="copyText('btn-copy-text-editor')">📋 文章をコピー</button>
      </div>
    </div>
    <div class="sns-open-row" style="margin-top:1rem;">
      <select class="sns-select" id="sns-select" aria-label="投稿先SNSを選択">
        <option value="">── SNSを選ぶ ──</option>
        <option value="${escapeHtml(shareUrlX)}">𝕏（Twitter）</option>
        <option value="${escapeHtml(shareUrlThreads)}">Threads</option>
        <option value="${escapeHtml(shareUrlInstagram)}">Instagram</option>
        <option value="${escapeHtml(shareUrlFacebook)}">Facebook</option>
        <option value="${escapeHtml(shareUrlTiktok)}">TikTok</option>
        <option value="${escapeHtml(shareUrlLine)}">LINE（※アプリ必要）</option>
        <option value="${escapeHtml(shareUrlLinkedin)}">Linkedin</option>
        <option value="${escapeHtml(shareUrlYoutube)}">YouTube</option>
        <option value="${escapeHtml(shareUrlPixiv)}">pixiv</option>
        <option value="${escapeHtml(shareUrlNote)}">note</option>
        <option value="${escapeHtml(shareUrlGirlsChannel)}">ガールズちゃんねる</option>
        <option value="${escapeHtml(shareUrlSukiKira)}">好き嫌い.com</option>
      </select>
      <button class="btn-sns-open" onclick="openSns()">開く ↗</button>
    </div>
  `;

  resultArea.style.display = 'block';
}

function showResultEditor() {
  const editor = document.getElementById('result-editor');
  const resultEditText = document.getElementById('result-edit-text');
  const inputText = document.getElementById('input-text');

  if (!editor || !resultEditText || !inputText) return;

  resultEditText.value = inputText.value;
  editor.style.display = 'block';
  resultEditText.focus();
}

function syncResultEditorText() {
  const resultEditText = document.getElementById('result-edit-text');
  const inputText = document.getElementById('input-text');

  if (!resultEditText || !inputText) return;

  inputText.value = resultEditText.value;
  inputText.dispatchEvent(new Event('input'));
}

function setCopyButtonCopied(btn) {
  btn.textContent = '✅ 文章をコピーしました';
  btn.classList.add('copied');
  setTimeout(() => {
    btn.textContent = '📋 文章をコピー';
    btn.classList.remove('copied');
  }, 2000);
}

function fallbackCopyText(text) {
  const copyArea = document.createElement('textarea');
  copyArea.value = text;
  copyArea.setAttribute('readonly', '');
  copyArea.style.position = 'fixed';
  copyArea.style.top = '0';
  copyArea.style.left = '0';
  copyArea.style.opacity = '0';
  document.body.appendChild(copyArea);
  copyArea.select();
  document.execCommand('copy');
  copyArea.remove();
}

function copyText(buttonId = 'btn-copy-text') {
  const inputText = document.getElementById('input-text');
  if (!inputText) return;
  const text = inputText.value;
  if (!text) return;
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  const clipboard = navigator.clipboard && navigator.clipboard.writeText
    ? navigator.clipboard.writeText(text)
    : Promise.reject(new Error('Clipboard API is unavailable'));

  clipboard
    .then(() => {
      setCopyButtonCopied(btn);
    })
    .catch(() => {
      fallbackCopyText(text);
      setCopyButtonCopied(btn);
    });
}

function getSelectedAdviceTone() {
  const allowedTones = ['standard', 'soft', 'business'];
  const selected = document.querySelector('input[name="advice-tone"]:checked');
  const tone = selected ? selected.value : 'standard';
  return allowedTones.includes(tone) ? tone : 'standard';
}

function getSelectedUsageScene() {
  const allowedScenes = ['general', 'sns', 'reply', 'business', 'apology'];
  const selected = document.querySelector('input[name="usage-scene"]:checked');
  const scene = selected ? selected.value : 'general';
  return allowedScenes.includes(scene) ? scene : 'general';
}

function scrollToResult() {
  const resultArea = document.getElementById('result-area');
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  resultArea.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start'
  });
}

async function checkText() {
  const text = document.getElementById('input-text').value.trim();
  if (!text) return;
  const tone = getSelectedAdviceTone();
  const scene = getSelectedUsageScene();
  let hasRenderedResult = false;

  document.getElementById('submit-btn').disabled        = true;
  document.getElementById('loading').style.display       = 'flex';
  document.getElementById('result-area').style.display   = 'none';

  try {
    const res = await fetch('/prod/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, tone, scene, language: 'ja' })
    });

    if (!res.ok) throw new Error('API error: ' + res.status);
    let data = await res.json();

    if (data.body && typeof data.body === 'string') {
      data = JSON.parse(data.body);
    } else if (data.body && typeof data.body === 'object') {
      data = data.body;
    }

    renderResult(data);
    hasRenderedResult = true;
  } catch (e) {
    const demoData = generateDemoData(text);
    renderResult(demoData);
    hasRenderedResult = true;
  } finally {
    document.getElementById('loading').style.display   = 'none';
    document.getElementById('submit-btn').disabled     = false;
    if (hasRenderedResult) scrollToResult();
  }
}

// ─────────────────────────────────────────────
// DOM セットアップ用ヘルパー
// ─────────────────────────────────────────────
function setupDom() {
  previousRisk = null;
  document.body.innerHTML = `
    <textarea id="input-text"></textarea>
    <span id="char-count" class="char-count"></span>
    <button class="btn-copy-text" id="btn-copy-text">📋 文章をコピー</button>
    <button id="submit-btn" disabled></button>
    <div id="sns-guide" style="display:none;">
      <span id="guide-x"></span>
      <span id="guide-facebook"></span>
      <span id="guide-instagram"></span>
      <span id="guide-tiktok"></span>
      <span id="guide-threads"></span>
      <span id="guide-line"></span>
      <span id="guide-linkedin"></span>
      <span id="guide-youtube"></span>
      <span id="guide-pixiv"></span>
      <span id="guide-note"></span>
      <span id="guide-girls-channel"></span>
      <span id="guide-suki-kira"></span>
    </div>
    <div id="loading" style="display:none;"></div>
    <div id="result-area" style="display:none;"></div>
    <fieldset class="usage-scene" aria-label="利用シーン">
      <legend class="usage-scene-label">利用シーン</legend>
      <p class="usage-scene-note">文章を使う場面に合わせて、確認する観点を調整します。</p>
      <div class="usage-scene-options">
        <label class="usage-scene-option">
          <input type="radio" name="usage-scene" value="general" checked>
          <span>指定なし・おまかせ</span>
        </label>
        <label class="usage-scene-option">
          <input type="radio" name="usage-scene" value="sns">
          <span>SNSの投稿</span>
        </label>
        <label class="usage-scene-option">
          <input type="radio" name="usage-scene" value="reply">
          <span>返信・コメント</span>
        </label>
        <label class="usage-scene-option">
          <input type="radio" name="usage-scene" value="business">
          <span>仕事・依頼文</span>
        </label>
        <label class="usage-scene-option">
          <input type="radio" name="usage-scene" value="apology">
          <span>謝罪・説明文</span>
        </label>
      </div>
    </fieldset>
    <fieldset class="advice-tone" aria-label="アドバイスのトーン">
      <legend class="advice-tone-label">アドバイスのトーン</legend>
      <label>
        <input type="radio" name="advice-tone" value="standard" checked>
        <span>バランスよく確認したい（標準）</span>
      </label>
      <label>
        <input type="radio" name="advice-tone" value="soft">
        <span>やわらかめに整えたい</span>
      </label>
      <label>
        <input type="radio" name="advice-tone" value="business">
        <span>丁寧・ビジネス向けに整えたい</span>
      </label>
    </fieldset>
  `;
  document.getElementById('input-text').addEventListener('input', onTextInput);
}

// ─────────────────────────────────────────────
// テストスイート
// ─────────────────────────────────────────────

// ================================================================
// 1. onTextInput — 文字数カウント・クラス切り替え・ボタン制御
// ================================================================
describe('onTextInput()', () => {
  beforeEach(setupDom);

  test('空文字のとき「0 / 50000」と表示し、ボタンが disabled になる', () => {
    document.getElementById('input-text').value = '';
    onTextInput();

    expect(document.getElementById('char-count').textContent).toBe('0 / 50000');
    expect(document.getElementById('submit-btn').disabled).toBe(true);
    expect(document.getElementById('sns-guide').style.display).toBe('none');
  });

  test('1文字以上入力するとボタンが enabled になる', () => {
    document.getElementById('input-text').value = 'あ';
    onTextInput();

    expect(document.getElementById('submit-btn').disabled).toBe(false);
    expect(document.getElementById('sns-guide').style.display).toBe('flex');
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

  test('50000文字で over クラスが付く', () => {
    document.getElementById('input-text').value = 'a'.repeat(50000);
    onTextInput();

    expect(document.getElementById('char-count').className).toContain('over');
  });

  test('文字数が正しくカウントされる（絵文字含む）', () => {
    const input = '投稿テスト🎉';
    document.getElementById('input-text').value = input;
    onTextInput();

    // 絵文字はサロゲートペアで length=2 になるため実際の length を使用
    expect(document.getElementById('char-count').textContent).toBe(input.length + ' / 50000');
  });

  test('351文字で YouTube の文字数ガイドに over-limit クラスが付く', () => {
    document.getElementById('input-text').value = 'a'.repeat(351);
    onTextInput();

    expect(document.getElementById('guide-youtube').classList.contains('over-limit')).toBe(true);
  });

  test('3001文字で Linkedin の文字数ガイドに over-limit クラスが付く', () => {
    document.getElementById('input-text').value = 'a'.repeat(3001);
    onTextInput();

    expect(document.getElementById('guide-linkedin').classList.contains('over-limit')).toBe(true);
  });

  test('pixiv は140文字まで許容し、141文字で over-limit になる', () => {
    const input = document.getElementById('input-text');

    input.value = 'a'.repeat(140);
    onTextInput();
    expect(document.getElementById('guide-pixiv').classList.contains('over-limit')).toBe(false);

    input.value = 'a'.repeat(141);
    onTextInput();
    expect(document.getElementById('guide-pixiv').classList.contains('over-limit')).toBe(true);
  });

  test('note は500文字まで許容し、501文字で over-limit になる', () => {
    const input = document.getElementById('input-text');

    input.value = 'a'.repeat(500);
    onTextInput();
    expect(document.getElementById('guide-note').classList.contains('over-limit')).toBe(false);

    input.value = 'a'.repeat(501);
    onTextInput();
    expect(document.getElementById('guide-note').classList.contains('over-limit')).toBe(true);
  });

  test('未確認の2サービスは数値上限の判定対象にならない', () => {
    document.getElementById('input-text').value = 'a'.repeat(50001);
    onTextInput();

    expect(document.getElementById('guide-girls-channel').classList.contains('over-limit')).toBe(false);
    expect(document.getElementById('guide-suki-kira').classList.contains('over-limit')).toBe(false);
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
// 7. getSelectedAdviceTone — アドバイスのトーン取得
// ================================================================
describe('getSelectedAdviceTone()', () => {
  beforeEach(setupDom);

  test('初期値は standard を返す', () => {
    expect(getSelectedAdviceTone()).toBe('standard');
  });

  test('soft 選択時は soft を返す', () => {
    document.querySelector('input[name="advice-tone"][value="soft"]').checked = true;
    expect(getSelectedAdviceTone()).toBe('soft');
  });

  test('business 選択時は business を返す', () => {
    document.querySelector('input[name="advice-tone"][value="business"]').checked = true;
    expect(getSelectedAdviceTone()).toBe('business');
  });

  test('不正な値の場合は standard に戻す', () => {
    const selected = document.querySelector('input[name="advice-tone"][value="standard"]');
    selected.value = 'invalid';
    selected.checked = true;
    expect(getSelectedAdviceTone()).toBe('standard');
  });
});

// ================================================================
// 8. getSelectedUsageScene — 利用シーン取得
// ================================================================
describe('getSelectedUsageScene()', () => {
  beforeEach(setupDom);

  test('初期値は general を返す', () => {
    expect(getSelectedUsageScene()).toBe('general');
  });

  test.each([
    ['sns', 'sns'],
    ['reply', 'reply'],
    ['business', 'business'],
    ['apology', 'apology']
  ])('%s 選択時は %s を返す', (value, expected) => {
    document.querySelector(`input[name="usage-scene"][value="${value}"]`).checked = true;
    expect(getSelectedUsageScene()).toBe(expected);
  });

  test('不正な値の場合は general に戻す', () => {
    const selected = document.querySelector('input[name="usage-scene"][value="general"]');
    selected.value = 'invalid';
    selected.checked = true;
    expect(getSelectedUsageScene()).toBe('general');
  });

  test('利用シーン選択UIは5つの選択肢を表示する', () => {
    const labels = Array.from(document.querySelectorAll('.usage-scene-option span')).map(item => item.textContent.trim());

    expect(labels).toEqual([
      '指定なし・おまかせ',
      'SNSの投稿',
      '返信・コメント',
      '仕事・依頼文',
      '謝罪・説明文'
    ]);
  });
});

// ================================================================
// 9. getNextActionTips — risk 別の次にできること
// ================================================================
describe('getNextActionTips()', () => {
  test('risk: low のとき low 用の3項目を返す', () => {
    expect(getNextActionTips('low')).toEqual(nextActionTipsByRisk.low);
  });

  test('risk: medium のとき medium 用の3項目を返す', () => {
    expect(getNextActionTips('medium')).toEqual(nextActionTipsByRisk.medium);
  });

  test('risk: high のとき high 用の3項目を返す', () => {
    expect(getNextActionTips('high')).toEqual(nextActionTipsByRisk.high);
  });

  test('想定外の risk のとき medium 用の3項目を返す', () => {
    expect(getNextActionTips('unexpected')).toEqual(nextActionTipsByRisk.medium);
  });

  test('risk 未指定のとき medium 用の3項目を返す', () => {
    expect(getNextActionTips(undefined)).toEqual(nextActionTipsByRisk.medium);
  });
});

// ================================================================
// 10. renderResult — 結果レンダリング
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

  test('risk: low のとき「低リスク（おだやかに伝わりそう）」ラベルが表示される', () => {
    renderResult({ ...baseData, risk: 'low' });
    expect(document.getElementById('result-area').innerHTML).toContain('低リスク（おだやかに伝わりそう）');
  });

  test('risk: medium のとき「中リスク（少し見直すと安心）」ラベルが表示される', () => {
    renderResult({ ...baseData, risk: 'medium' });
    expect(document.getElementById('result-area').innerHTML).toContain('中リスク（少し見直すと安心）');
  });

  test('risk: high のとき「高リスク（ひと呼吸おいて見直したい）」ラベルが表示される', () => {
    renderResult({ ...baseData, risk: 'high' });
    expect(document.getElementById('result-area').innerHTML).toContain('高リスク（ひと呼吸おいて見直したい）');
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

  test('reasons がある場合「読み手によって気になりそうな点」セクションが表示される', () => {
    renderResult({ ...baseData, reasons: ['理由A'] });
    expect(document.getElementById('result-area').innerHTML).toContain('読み手によって気になりそうな点');
  });

  test('suggestions がある場合「言葉を整えるヒント」セクションが表示される', () => {
    renderResult({ ...baseData, suggestions: ['改善策A'] });
    expect(document.getElementById('result-area').innerHTML).toContain('言葉を整えるヒント');
  });

  test('suggestions が空のとき「言葉を整えるヒント」セクションが表示されない', () => {
    renderResult({ ...baseData, suggestions: [] });
    expect(document.getElementById('result-area').innerHTML).not.toContain('言葉を整えるヒント');
  });

  test('「次にできること」カードが表示される', () => {
    renderResult(baseData);
    expect(document.querySelector('.next-action-card h4').textContent).toBe('次にできること');
    expect(document.querySelector('.next-action-card').textContent).toContain('必要に応じて、投稿前の見直しに使ってください。');
  });

  test('risk: low のとき low 用の3項目が表示される', () => {
    renderResult({ ...baseData, risk: 'low' });
    const cardText = document.querySelector('.next-action-card').textContent;
    expect(document.querySelectorAll('.next-action-card li')).toHaveLength(3);
    nextActionTipsByRisk.low.forEach(tip => {
      expect(cardText).toContain(tip);
    });
  });

  test('risk: medium のとき medium 用の3項目が表示される', () => {
    renderResult({ ...baseData, risk: 'medium' });
    const cardText = document.querySelector('.next-action-card').textContent;
    expect(document.querySelectorAll('.next-action-card li')).toHaveLength(3);
    nextActionTipsByRisk.medium.forEach(tip => {
      expect(cardText).toContain(tip);
    });
  });

  test('risk: high のとき high 用の3項目が表示される', () => {
    renderResult({ ...baseData, risk: 'high' });
    const cardText = document.querySelector('.next-action-card').textContent;
    expect(document.querySelectorAll('.next-action-card li')).toHaveLength(3);
    nextActionTipsByRisk.high.forEach(tip => {
      expect(cardText).toContain(tip);
    });
  });

  test('risk が想定外のとき medium 相当の3項目が表示される', () => {
    renderResult({ ...baseData, risk: 'unknown' });
    const cardText = document.querySelector('.next-action-card').textContent;
    expect(document.querySelectorAll('.next-action-card li')).toHaveLength(3);
    nextActionTipsByRisk.medium.forEach(tip => {
      expect(cardText).toContain(tip);
    });
  });

  test('risk が未指定のとき medium 相当の3項目が表示される', () => {
    renderResult({ ...baseData, risk: undefined });
    const cardText = document.querySelector('.next-action-card').textContent;
    expect(document.querySelectorAll('.next-action-card li')).toHaveLength(3);
    nextActionTipsByRisk.medium.forEach(tip => {
      expect(cardText).toContain(tip);
    });
  });

  test('「投稿前セルフチェック」カードが次にできることの下に表示される', () => {
    renderResult(baseData);
    expect(document.querySelector('.pre-post-checklist-card h4').textContent).toBe('投稿前セルフチェック');
    expect(document.querySelector('.pre-post-checklist-card').textContent).toContain('投稿・送信前に、必要に応じて確認してみてください。');
    expect(document.querySelector('.next-action-card + .pre-post-checklist-card')).not.toBeNull();
  });

  test('投稿前セルフチェックの4項目がチェックボックス付きで表示される', () => {
    renderResult(baseData);
    const checklist = document.querySelector('.pre-post-checklist-card');
    const checkboxes = checklist.querySelectorAll('input[type="checkbox"]');
    const labels = Array.from(checklist.querySelectorAll('.pre-post-checklist-item span')).map(item => item.textContent.trim());

    expect(checkboxes).toHaveLength(4);
    expect(labels).toEqual(prePostChecklistItems);
  });

  test('投稿前セルフチェックは任意でチェックできる', () => {
    renderResult(baseData);
    const checkbox = document.querySelector('.pre-post-checklist-card input[type="checkbox"]');

    expect(checkbox.checked).toBe(false);
    checkbox.click();
    expect(checkbox.checked).toBe(true);
  });

  test('投稿前セルフチェックの状態は localStorage や sessionStorage に保存されない', () => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    renderResult(baseData);

    document.querySelector('.pre-post-checklist-card input[type="checkbox"]').click();

    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(document.cookie).not.toContain('pre-post-check');
  });

  test('「情報を確かめるヒント」が投稿前セルフチェックの直後に表示される', () => {
    renderResult(baseData);

    const card = document.querySelector('.information-checking-card');
    expect(card.querySelector('.information-checking-title').textContent).toContain('情報を確かめるヒント');
    expect(card.querySelector('.information-checking-teaser').textContent).toBe('情報を共有する前に、情報の根拠や事実関係なども確認してみませんか？');
    expect(document.querySelector('.pre-post-checklist-card + .information-checking-card')).not.toBeNull();
  });

  test('情報を確かめるヒントの6項目が指定順で表示される', () => {
    renderResult(baseData);

    const labels = Array.from(document.querySelectorAll('.information-checking-list .information-checking-item span'))
      .map(item => item.textContent.trim());

    expect(labels).toEqual(informationCheckingItems.map(item => item.label));
  });

  test('6項目の補足説明が一つの折りたたみ領域に表示される', () => {
    renderResult(baseData);

    const more = document.querySelector('.information-checking-more');
    const headings = Array.from(more.querySelectorAll('.information-checking-explanation h5'))
      .map(item => item.textContent.trim());
    const descriptions = Array.from(more.querySelectorAll('.information-checking-explanation p'))
      .map(item => item.textContent.trim());

    expect(document.querySelectorAll('.information-checking-more')).toHaveLength(1);
    expect(headings).toEqual(informationCheckingItems.map(item => item.label));
    expect(descriptions).toEqual(informationCheckingItems.map(item => item.description));
  });

  test('外側と補足説明は初期状態で閉じている', () => {
    renderResult(baseData);

    expect(document.querySelector('.information-checking-card').open).toBe(false);
    expect(document.querySelector('.information-checking-more').open).toBe(false);
  });

  test('外側を開閉できる', () => {
    renderResult(baseData);

    const details = document.querySelector('.information-checking-card');
    const summary = details.querySelector(':scope > summary');
    summary.click();
    expect(details.open).toBe(true);
    summary.click();
    expect(details.open).toBe(false);
  });

  test('補足説明を開閉できる', () => {
    renderResult(baseData);

    const more = document.querySelector('.information-checking-more');
    const summary = more.querySelector('summary');
    summary.click();
    expect(more.open).toBe(true);
    summary.click();
    expect(more.open).toBe(false);
  });

  test.each(['Enter', ' '])('%s キーで外側を開閉できる', key => {
    renderResult(baseData);

    const details = document.querySelector('.information-checking-card');
    const summary = details.querySelector(':scope > summary');
    const event = {
      key,
      currentTarget: summary,
      preventDefault: jest.fn()
    };

    handleInformationCheckingSummaryKeydown(event);
    expect(details.open).toBe(true);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    handleInformationCheckingSummaryKeydown(event);
    expect(details.open).toBe(false);
  });

  test('Enter キーで補足説明を開閉できる', () => {
    renderResult(baseData);

    const details = document.querySelector('.information-checking-more');
    const event = {
      key: 'Enter',
      currentTarget: details.querySelector('summary'),
      preventDefault: jest.fn()
    };

    handleInformationCheckingSummaryKeydown(event);
    expect(details.open).toBe(true);
    handleInformationCheckingSummaryKeydown(event);
    expect(details.open).toBe(false);
  });

  test('6個のチェックボックスはすべて未チェックで始まり、ラベルから一部だけ選択できる', () => {
    renderResult(baseData);

    const checkboxes = Array.from(document.querySelectorAll('.information-checking-list input[type="checkbox"]'));
    const secondLabel = document.querySelector('label[for="information-check-2"]');

    expect(checkboxes).toHaveLength(6);
    expect(checkboxes.every(checkbox => !checkbox.checked)).toBe(true);
    secondLabel.click();
    expect(checkboxes[1].checked).toBe(true);
    expect(checkboxes.filter(checkbox => checkbox.checked)).toHaveLength(1);
  });

  test('Space キーでチェックボックスを切り替えられる', () => {
    renderResult(baseData);

    const checkbox = document.getElementById('information-check-4');
    const event = {
      key: ' ',
      currentTarget: checkbox,
      preventDefault: jest.fn()
    };

    handleInformationCheckingCheckboxKeydown(event);
    expect(checkbox.checked).toBe(true);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    handleInformationCheckingCheckboxKeydown(event);
    expect(checkbox.checked).toBe(false);
  });

  test('チェックボックスとラベルが関連付けられ、開閉操作にネイティブ要素を使う', () => {
    renderResult(baseData);

    const labels = Array.from(document.querySelectorAll('.information-checking-list label'));
    expect(labels).toHaveLength(6);
    labels.forEach(label => {
      const input = label.querySelector('input');
      expect(label.htmlFor).toBe(input.id);
    });
    expect(document.querySelector('.information-checking-card').tagName).toBe('DETAILS');
    expect(document.querySelector('.information-checking-card > summary').tagName).toBe('SUMMARY');
    expect(document.querySelector('.information-checking-more').tagName).toBe('DETAILS');
  });

  test('外側を閉じて再度開いてもチェック状態を維持する', () => {
    renderResult(baseData);

    const details = document.querySelector('.information-checking-card');
    const summary = details.querySelector(':scope > summary');
    const checkbox = document.getElementById('information-check-1');
    summary.click();
    checkbox.click();
    summary.click();
    summary.click();

    expect(details.open).toBe(true);
    expect(checkbox.checked).toBe(true);
  });

  test('補足説明を閉じてもチェック状態を維持する', () => {
    renderResult(baseData);

    const more = document.querySelector('.information-checking-more');
    const checkbox = document.getElementById('information-check-3');
    checkbox.click();
    more.querySelector('summary').click();
    more.querySelector('summary').click();

    expect(more.open).toBe(false);
    expect(checkbox.checked).toBe(true);
  });

  test('新しい結果を表示すると外側と補足説明が閉じ、6項目が未チェックへ戻る', () => {
    renderResult(baseData);

    document.querySelector('.information-checking-card > summary').click();
    document.querySelector('.information-checking-more > summary').click();
    document.getElementById('information-check-1').click();
    document.getElementById('information-check-4').click();

    renderResult({ ...baseData, risk: 'medium', summary: '新しい結果' });

    expect(document.querySelector('.information-checking-card').open).toBe(false);
    expect(document.querySelector('.information-checking-more').open).toBe(false);
    expect(Array.from(document.querySelectorAll('.information-checking-list input')).every(checkbox => !checkbox.checked)).toBe(true);
  });

  test('チェックや開閉操作でfetchを呼ばず、ブラウザ保存領域も使用しない', () => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    global.fetch = jest.fn();
    renderResult(baseData);

    document.querySelector('.information-checking-card > summary').click();
    document.querySelector('.information-checking-more > summary').click();
    document.querySelector('label[for="information-check-5"]').click();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(document.cookie).not.toContain('information-check');
  });

  test('チェックや開閉操作をコンソールへ出力しない', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    renderResult(baseData);

    document.querySelector('.information-checking-card > summary').click();
    document.querySelector('.information-checking-more > summary').click();
    document.getElementById('information-check-6').click();

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
    warnSpy.mockRestore();
  });

  test('チェック状態によってリスク表示とリスク変化バナーは変化しない', () => {
    renderResult(baseData);
    renderResult({ ...baseData, risk: 'high' });

    const verdictBefore = document.querySelector('.verdict').className;
    const bannerBefore = document.querySelector('.risk-change-banner').textContent;
    document.getElementById('information-check-2').click();

    expect(document.querySelector('.verdict').className).toBe(verdictBefore);
    expect(document.querySelector('.risk-change-banner').textContent).toBe(bannerBefore);
  });

  test('結果ヘッダーに修正ボタンとコピーボタンが表示される', () => {
    renderResult(baseData);

    expect(document.querySelector('.result-actions .btn-recheck').textContent).toBe('✏️ 結果を見ながら修正する');
    expect(document.getElementById('btn-copy-text-result').textContent).toBe('📋 文章をコピー');
  });

  test('結果下にも修正ボタンとコピーボタンが表示される', () => {
    renderResult(baseData);

    expect(document.querySelector('.information-checking-card + .result-followup-actions')).not.toBeNull();
    expect(document.querySelector('.result-followup-actions .btn-recheck').textContent).toBe('✏️ 結果を見ながら修正する');
    expect(document.getElementById('btn-copy-text-result-bottom').textContent).toBe('📋 文章をコピー');
  });

  test('結果下の編集エリアは初期状態で非表示', () => {
    renderResult(baseData);

    expect(document.getElementById('result-editor').style.display).toBe('none');
    expect(document.getElementById('result-edit-text').value).toBe('');
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

  test('Linkedin リンクが結果エリアに含まれる', () => {
    renderResult(baseData);
    expect(document.getElementById('result-area').innerHTML).toContain('www.linkedin.com');
  });

  test('YouTube リンクが結果エリアに含まれる', () => {
    renderResult(baseData);
    expect(document.getElementById('result-area').innerHTML).toContain('www.youtube.com');
  });

  test('追加4サービスのリンク・表示名・順序が仕様どおり', () => {
    renderResult(baseData);
    const options = Array.from(document.querySelectorAll('#sns-select option'));
    const optionTexts = options.map(option => option.textContent);
    const optionValues = options.map(option => option.value);

    expect(optionTexts.slice(-4)).toEqual(['pixiv', 'note', 'ガールズちゃんねる', '好き嫌い.com']);
    expect(optionValues.slice(-4)).toEqual([
      'https://www.pixiv.net/',
      'https://note.com/',
      'https://girlschannel.net/',
      'https://suki-kira.com/'
    ]);
    expect(options[0].value).toBe('');
  });

  test('SNS選択肢の追加部分はYouTubeの直後に並ぶ', () => {
    renderResult(baseData);
    const optionTexts = Array.from(document.querySelectorAll('#sns-select option')).map(option => option.textContent);
    const youtubeIndex = optionTexts.indexOf('YouTube');

    expect(optionTexts.slice(youtubeIndex, youtubeIndex + 5)).toEqual([
      'YouTube', 'pixiv', 'note', 'ガールズちゃんねる', '好き嫌い.com'
    ]);
  });

  test('SNSプルダウンで Linkedin と YouTube は LINE の下に表示される', () => {
    renderResult(baseData);
    const optionTexts = Array.from(document.querySelectorAll('#sns-select option')).map(option => option.textContent);
    const lineIndex = optionTexts.indexOf('LINE（※アプリ必要）');

    expect(optionTexts[lineIndex + 1]).toBe('Linkedin');
    expect(optionTexts[lineIndex + 2]).toBe('YouTube');
  });

});

// ================================================================
// 10.5. 静的HTMLの日英表示・説明文
// ================================================================
describe('追加SNSの静的HTML仕様', () => {
  const jaIndex = readFileSync('index.html', 'utf8');
  const enIndex = readFileSync('en/index.html', 'utf8');
  const jaManual = readFileSync('manual.html', 'utf8');
  const enManual = readFileSync('en/manual.html', 'utf8');

  test('日本語トップの文字数ガイドがYouTubeの後ろに追加されている', () => {
    const labels = [
      'pixiv コメント上限：140字',
      'note コメント上限：500字',
      'ガールズちゃんねる コメント上限：未確認',
      '好き嫌い.com コメント上限：未確認'
    ];
    const youtubeIndex = jaIndex.indexOf('id="guide-youtube"');
    const positions = labels.map(label => jaIndex.indexOf(label));

    expect(youtubeIndex).toBeGreaterThanOrEqual(0);
    expect(positions.every(position => position > youtubeIndex)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  test('英語トップの文字数ガイドがYouTubeの後ろに追加されている', () => {
    const labels = [
      'pixiv comment limit: 140 chars',
      'note comment limit: 500 chars',
      'Girls Channel comment limit: not confirmed',
      '好き嫌い.com comment limit: not confirmed'
    ];
    const youtubeIndex = enIndex.indexOf('id="guide-youtube"');
    const positions = labels.map(label => enIndex.indexOf(label));

    expect(youtubeIndex).toBeGreaterThanOrEqual(0);
    expect(positions.every(position => position > youtubeIndex)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  test('日英トップに4サービスの説明と正しいURLがある', () => {
    expect(jaIndex).toContain('pixiv、note、ガールズちゃんねる、好き嫌い.comは、「開く」ボタンから各サービスのトップページを表示します。');
    expect(enIndex).toContain("For pixiv, note, Girls Channel, and 好き嫌い.com, the Open button opens each service's top page.");

    for (const url of [
      'https://www.pixiv.net/',
      'https://note.com/',
      'https://girlschannel.net/',
      'https://suki-kira.com/'
    ]) {
      expect(jaIndex).toContain(url);
      expect(enIndex).toContain(url);
    }
  });

  test('英語トップのSNS選択肢はYouTubeの直後に仕様どおり並ぶ', () => {
    const options = [
      'https://www.youtube.com/">YouTube',
      'https://www.pixiv.net/">pixiv',
      'https://note.com/">note',
      'https://girlschannel.net/">Girls Channel',
      'https://suki-kira.com/">好き嫌い.com'
    ];
    const positions = options.map(option => enIndex.indexOf(option));

    expect(positions.every(position => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  test('SNSを開く処理の別タブ・noopener挙動を維持している', () => {
    expect(jaIndex).toContain("window.open(sel.value, '_blank', 'noopener');");
    expect(enIndex).toContain("window.open(sel.value, '_blank', 'noopener');");
  });

  test('日英マニュアルに追加サービス・未確認の説明がある', () => {
    expect(jaManual).toContain('pixiv、note、ガールズちゃんねる、好き嫌い.comは、「開く」ボタンから各サービスのトップページを表示します。');
    expect(jaManual).toContain('pixivの140字、noteの500字はコメントの文字数上限の目安です。');
    expect(jaManual).toContain('「未確認」と表示し、文字数超過の判定は行いません。');
    expect(enManual).toContain("For pixiv, note, Girls Channel, and 好き嫌い.com, the Open button opens each service's top page.");
    expect(enManual).toContain('The 140-character limit for pixiv and the 500-character limit for note refer to comments.');
    expect(enManual).toContain('the comment limit is shown as “not confirmed,”');
    expect(enManual).not.toContain('Suki-Kira');
  });
});

// ================================================================
// 11. result editor — 結果下編集エリア
// ================================================================
describe('result editor', () => {
  beforeEach(() => {
    setupDom();
    document.getElementById('input-text').value = '元の文章';
    renderResult({ risk: 'low', summary: 'ok', reasons: [], suggestions: [] });
  });

  test('showResultEditor() で編集エリアが表示され、現在の文章が入る', () => {
    showResultEditor();

    expect(document.getElementById('result-editor').style.display).toBe('block');
    expect(document.getElementById('result-edit-text').value).toBe('元の文章');
  });

  test('syncResultEditorText() で上部 textarea と文字数カウントが更新される', () => {
    const resultEditText = document.getElementById('result-edit-text');
    resultEditText.value = '修正した文章';

    syncResultEditorText();

    expect(document.getElementById('input-text').value).toBe('修正した文章');
    expect(document.getElementById('char-count').textContent).toBe('6 / 50000');
    expect(document.getElementById('submit-btn').disabled).toBe(false);
  });
});

// ================================================================
// 12. copyText — 文章コピー
// ================================================================
describe('copyText()', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setupDom();
    document.getElementById('input-text').value = 'コピー対象の文章';
    navigator.clipboard = {
      writeText: jest.fn().mockResolvedValue()
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('指定したボタンだけ成功表示に変わる', async () => {
    renderResult({ risk: 'low', summary: 'ok', reasons: [], suggestions: [] });

    copyText('btn-copy-text-result-bottom');
    await Promise.resolve();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('コピー対象の文章');
    expect(document.getElementById('btn-copy-text-result-bottom').textContent).toBe('✅ 文章をコピーしました');
    expect(document.getElementById('btn-copy-text-result').textContent).toBe('📋 文章をコピー');
    expect(document.getElementById('btn-copy-text').textContent).toBe('📋 文章をコピー');
  });

  test('2秒後にボタン表示が戻る', async () => {
    copyText();
    await Promise.resolve();

    expect(document.getElementById('btn-copy-text').textContent).toBe('✅ 文章をコピーしました');
    jest.advanceTimersByTime(2000);
    expect(document.getElementById('btn-copy-text').textContent).toBe('📋 文章をコピー');
  });
});

// ================================================================
// 13. checkText — API通信・ローディング制御・フォールバック
// ================================================================
describe('checkText()', () => {
  beforeEach(() => {
    setupDom();
    document.getElementById('input-text').value = 'テスト投稿文';
    document.getElementById('submit-btn').disabled = false;
    HTMLElement.prototype.scrollIntoView = jest.fn();
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
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

  test('API成功時: Loadingを非表示にした後、結果へ1回だけsmooth scrollする', async () => {
    const scrollIntoView = jest.fn(() => {
      expect(document.getElementById('loading').style.display).toBe('none');
    });
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ risk: 'low', summary: 'ok', reasons: [], suggestions: [] })
    });

    await checkText();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  test('チェック開始時はLoadingへスクロールしない', async () => {
    let resolveRequest;
    global.fetch = jest.fn().mockReturnValue(new Promise(resolve => {
      resolveRequest = resolve;
    }));

    const checkPromise = checkText();

    expect(document.getElementById('loading').style.display).toBe('flex');
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();

    resolveRequest({ ok: true, json: async () => ({ risk: 'low', summary: 'ok', reasons: [], suggestions: [] }) });
    await checkPromise;
  });

  test('reduced motion時はアニメーションなしで結果へスクロールする', async () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ risk: 'low', summary: 'ok', reasons: [], suggestions: [] })
    });

    await checkText();

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
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
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
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

  test('通信中は現在のチェック状態を維持し、新しい結果の表示時にリセットする', async () => {
    renderResult({ risk: 'low', summary: '現在の結果', reasons: [], suggestions: [] });
    document.getElementById('information-check-1').click();

    let resolvePromise;
    global.fetch = jest.fn().mockReturnValue(
      new Promise(resolve => { resolvePromise = resolve; })
    );

    const promise = checkText();

    expect(document.getElementById('information-check-1').checked).toBe(true);
    resolvePromise({ ok: true, json: async () => ({ risk: 'medium', summary: '新しい結果', reasons: [], suggestions: [] }) });
    await promise;
    expect(Array.from(document.querySelectorAll('.information-checking-list input')).every(checkbox => !checkbox.checked)).toBe(true);
  });

  test('通信失敗時もデモ結果が表示されるまでは現在のチェック状態を消さない', async () => {
    renderResult({ risk: 'low', summary: '現在の結果', reasons: [], suggestions: [] });
    document.getElementById('information-check-2').click();

    let rejectPromise;
    global.fetch = jest.fn().mockReturnValue(
      new Promise((resolve, reject) => {
        rejectPromise = reject;
      })
    );

    const promise = checkText();

    expect(document.getElementById('information-check-2').checked).toBe(true);
    rejectPromise(new Error('Network Error'));
    await promise;
    expect(document.getElementById('result-area').style.display).toBe('block');
    expect(Array.from(document.querySelectorAll('.information-checking-list input')).every(checkbox => !checkbox.checked)).toBe(true);
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
    expect(JSON.parse(options.body)).toEqual({ text: inputText, tone: 'standard', scene: 'general', language: 'ja' });
  });

  test('情報を確かめるヒントのチェック状態をAPIリクエストへ含めない', async () => {
    renderResult({ risk: 'low', summary: '現在の結果', reasons: [], suggestions: [] });
    document.getElementById('information-check-1').click();
    document.getElementById('information-check-4').click();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ risk: 'low', summary: 'ok', reasons: [], suggestions: [] })
    });

    await checkText();

    const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(requestBody).toEqual({ text: 'テスト投稿文', tone: 'standard', scene: 'general', language: 'ja' });
    expect(JSON.stringify(requestBody)).not.toContain('information-check');
  });

  test('soft 選択時は tone: "soft" が送信される', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ risk: 'low', summary: 'ok', reasons: [], suggestions: [] })
    });

    document.querySelector('input[name="advice-tone"][value="soft"]').checked = true;
    await checkText();

    expect(JSON.parse(global.fetch.mock.calls[0][1].body).tone).toBe('soft');
  });

  test('business 選択時は tone: "business" が送信される', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ risk: 'low', summary: 'ok', reasons: [], suggestions: [] })
    });

    document.querySelector('input[name="advice-tone"][value="business"]').checked = true;
    await checkText();

    expect(JSON.parse(global.fetch.mock.calls[0][1].body).tone).toBe('business');
  });

  test('SNS投稿選択時は scene: "sns" が送信される', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ risk: 'low', summary: 'ok', reasons: [], suggestions: [] })
    });

    document.querySelector('input[name="usage-scene"][value="sns"]').checked = true;
    await checkText();

    expect(JSON.parse(global.fetch.mock.calls[0][1].body).scene).toBe('sns');
  });
});
