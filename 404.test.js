/* global require, process, global */
/* 404.html — 日英共通404ページの静的仕様テスト */

const fs = require("node:fs");
const path = require("node:path");
const { TextDecoder, TextEncoder } = require("node:util");
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;
const { JSDOM } = require("jsdom");

const htmlPath = path.join(process.cwd(), "404.html");
const sitemapPath = path.join(process.cwd(), "sitemap.xml");
const cssPath = path.join(process.cwd(), "assets/css/404.css");

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function getDocument() {
  return new JSDOM(readFile(htmlPath)).window.document;
}

describe("404.html", () => {
  test("ファイルが存在する", () => {
    expect(fs.existsSync(htmlPath)).toBe(true);
  });

  test("titleとH1が確定文言になっている", () => {
    const document = getDocument();
    expect(document.title).toBe("ページが見つかりません / Page not found | ことばみまもり");
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector("h1").textContent).toContain("ページが見つかりません");
    expect(document.querySelector("h1").textContent).toContain("Page not found");
  });

  test("日本語・英語の案内とlang属性がある", () => {
    const document = getDocument();
    const japaneseCopy = document.querySelector('.not-found-copy p[lang="ja"]');
    const englishCopy = document.querySelector('.not-found-copy p[lang="en"]');

    expect(japaneseCopy).not.toBeNull();
    expect(document.body.textContent).toContain("お探しのページは見つかりませんでした。");
    expect(document.body.textContent).toContain("URLが変更されたか、ページが利用できなくなっている可能性があります。");
    expect(document.body.textContent).toContain("トップページから、もう一度お探しください。");
    expect(englishCopy).not.toBeNull();
    expect(englishCopy.textContent).toContain("The page you were looking for could not be found.");
    expect(document.body.textContent).toContain("The page you were looking for could not be found.");
    expect(document.body.textContent).toContain("The URL may have changed or the page may no longer be available.");
    expect(document.body.textContent).toContain("Please return to the top page.");
  });

  test("日本語・英語トップへの導線が静的配信向けになっている", () => {
    const document = getDocument();
    const hrefs = Array.from(document.querySelectorAll("a")).map((link) => link.getAttribute("href"));

    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/en/index.html");
    expect(hrefs).not.toContain("/en/");
  });

  test("robotsとSEO除外仕様が守られている", () => {
    const document = getDocument();
    expect(document.documentElement.getAttribute("lang")).toBe("ja");
    expect(document.querySelector('meta[name="robots"]').getAttribute("content")).toBe("noindex, follow");
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.querySelector('link[rel="alternate"][hreflang]')).toBeNull();
    expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  test("自動リダイレクトと表示言語プルダウンがない", () => {
    const document = getDocument();
    const html = readFile(htmlPath);

    expect(document.querySelector('meta[http-equiv="refresh"]')).toBeNull();
    expect(document.querySelector(".language-switcher")).toBeNull();
    expect(document.querySelector(".language-select")).toBeNull();
    expect(html).not.toMatch(/setTimeout|setInterval|location\.(?:assign|replace)\s*\(|window\.location\s*=/);
  });

  test("内部アセットがルート相対URLで、GA4は既存Measurement IDだけを利用する", () => {
    const document = getDocument();
    const html = readFile(htmlPath);

    expect(document.querySelector('link[href="/assets/css/common.css"]')).not.toBeNull();
    expect(document.querySelector('link[href="/assets/css/404.css"]')).not.toBeNull();
    expect(document.querySelector('link[href="/favicon.png"]')).not.toBeNull();
    expect(document.querySelector('link[href="/favicon.svg"]')).not.toBeNull();
    expect(html).toContain("https://www.googletagmanager.com/gtag/js?id=G-V947PLZR3S");
    expect(html).toContain("gtag('config', 'G-V947PLZR3S');");
    expect(html).not.toMatch(/gtag\(\s*['"]event['"]/);
  });

  test("アクセシビリティ用の主要構造とfocus-visibleがある", () => {
    const document = getDocument();
    const css = readFile(cssPath);

    expect(document.querySelector("header")).not.toBeNull();
    expect(document.querySelector("main")).not.toBeNull();
    expect(document.querySelector("footer")).not.toBeNull();
    expect(document.querySelectorAll("a.not-found-link")).toHaveLength(2);
    expect(css).toContain(".not-found-link:focus-visible");
  });

  test("sitemapに404.htmlを含めない", () => {
    expect(readFile(sitemapPath)).not.toContain("404.html");
  });
});
