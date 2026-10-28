/** @jest-environment node */
/* global require, __dirname */

const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { Buffer } = require('node:buffer');
const { runInNewContext } = require('node:vm');

const functionPath = join(__dirname, '../modules/aws/cloudfront/functions/words-watching-app-maintenance.js');
const source = readFileSync(functionPath, 'utf8');
const handler = runInNewContext(`${source}\nhandler;`, {}, {
  filename: functionPath,
  timeout: 1000
});

function request(method = 'GET', uri = '/') {
  return { method, uri, querystring: {}, headers: {}, cookies: {} };
}

const getResponse = handler({ request: request() });

describe('CloudFront maintenance function', () => {
  test('CF-01: GET / returns HTTP 503 and bilingual HTML', () => {
    expect(getResponse.statusCode).toBe(503);
    expect(getResponse.statusDescription).toBe('Service Unavailable');
    expect(getResponse.headers['content-type'].value).toBe('text/html; charset=utf-8');
    expect(getResponse.body).toContain('現在、システムメンテナンス中です。');
    expect(getResponse.body).toContain('This site is temporarily unavailable due to maintenance.');
  });

  test('CF-02: GET /en/index.html returns the same fixed response', () => {
    expect(handler({ request: request('GET', '/en/index.html') })).toEqual(getResponse);
  });

  test.each(['/favicon.png', '/not-found.html'])(
    'CF-03: GET %s returns the same fixed response',
    (uri) => {
      expect(handler({ request: request('GET', uri) })).toEqual(getResponse);
    }
  );

  test('CF-04: HEAD / returns HTTP 503 with an empty body', () => {
    expect(handler({ request: request('HEAD') })).toEqual({ ...getResponse, body: '' });
  });

  test('CF-05: response contains only the specified headers', () => {
    expect(getResponse.headers).toEqual({
      'content-type': { value: 'text/html; charset=utf-8' },
      'cache-control': { value: 'no-store' },
      'x-content-type-options': { value: 'nosniff' },
      'referrer-policy': { value: 'no-referrer' },
      'x-frame-options': { value: 'DENY' },
      'content-security-policy': {
        value: "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
      }
    });
  });

  test('CF-06: HTML preserves official text, language, charset and viewport', () => {
    expect(getResponse.body).toContain('<h1>ことばみまもり</h1>');
    expect(getResponse.body).toContain('<p class="subtitle" lang="en">Kotoba Mimamori</p>');
    expect(getResponse.body).toContain('ご不便をおかけいたしますが、しばらく時間をおいてから再度アクセスしてください。');
    expect(getResponse.body).toContain('<html lang="ja">');
    expect(getResponse.body).toMatch(/<section\b[^>]*lang="en"[^>]*>\s*<h2>This site is temporarily unavailable due to maintenance\.<\/h2>\s*<p>We apologize for the inconvenience\. Please try again later\.<\/p>\s*<\/section>/);
    expect(getResponse.body).toMatch(/<meta\s+charset="UTF-8"\s*>/i);
    expect(getResponse.body).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
  });

  test('CF-07: URI, query, headers and cookies are never reflected', () => {
    const sentinel = 'REQUEST_VALUE_MUST_NOT_APPEAR';
    const response = handler({
      request: {
        ...request('GET', `/${sentinel}`),
        querystring: { marker: { value: sentinel } },
        headers: { 'x-marker': { value: sentinel } },
        cookies: { marker: { value: sentinel } }
      }
    });
    expect(response).toEqual(getResponse);
    expect(response.body).not.toContain(sentinel);
  });

  test('CF-08: HTML has no external assets, JavaScript or automatic redirects', () => {
    expect(getResponse.body).not.toMatch(/<(?:script|link|img|image|iframe|object|embed|audio|video|source)\b/i);
    expect(getResponse.body).not.toMatch(/@import\b|url\s*\(/i);
    expect(getResponse.body).not.toMatch(/\son\w+\s*=|javascript:/i);
    expect(getResponse.body).not.toMatch(/<meta\b[^>]*http-equiv\s*=\s*["']?refresh\b/i);
  });

  test('CF-09: official HTML does not include the test-only notice', () => {
    expect(getResponse.body).not.toContain('[システムメンテナンスのテストです]');
  });

  test('CF-10: UTF-8 source size is within 10 KB', () => {
    expect(Buffer.byteLength(source, 'utf8')).toBeLessThanOrEqual(10 * 1024);
  });
});
