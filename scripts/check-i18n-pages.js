#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT_DIR = path.resolve(__dirname, "..");
const SITE_ORIGIN = "https://words-watching-app.na0aaooq.com";

const PAGE_PAIRS = [
  { ja: "index.html", en: "en/index.html", jaPath: "/", enPath: "/en/" },
  { ja: "about.html", en: "en/about.html", jaPath: "/about.html", enPath: "/en/about.html" },
  { ja: "manual.html", en: "en/manual.html", jaPath: "/manual.html", enPath: "/en/manual.html" },
  { ja: "consultation.html", en: "en/consultation.html", jaPath: "/consultation.html", enPath: "/en/consultation.html" },
  { ja: "terms_of_service.html", en: "en/terms_of_service.html", jaPath: "/terms_of_service.html", enPath: "/en/terms_of_service.html" },
  { ja: "disclaimer.html", en: "en/disclaimer.html", jaPath: "/disclaimer.html", enPath: "/en/disclaimer.html" },
  { ja: "privacy.html", en: "en/privacy.html", jaPath: "/privacy.html", enPath: "/en/privacy.html" },
  { ja: "contact.html", en: "en/contact.html", jaPath: "/contact.html", enPath: "/en/contact.html" },
];

const pages = PAGE_PAIRS.flatMap((pair) => [
  {
    file: pair.ja,
    lang: "ja",
    canonicalUrl: toSiteUrl(pair.jaPath),
    jaUrl: toSiteUrl(pair.jaPath),
    enUrl: toSiteUrl(pair.enPath),
    counterpart: pair.en,
  },
  {
    file: pair.en,
    lang: "en",
    canonicalUrl: toSiteUrl(pair.enPath),
    jaUrl: toSiteUrl(pair.jaPath),
    enUrl: toSiteUrl(pair.enPath),
    counterpart: pair.ja,
  },
]);

const pageByFile = new Map(pages.map((page) => [page.file, page]));
const failures = [];
const domCache = new Map();

function toSiteUrl(urlPath) {
  return `${SITE_ORIGIN}${urlPath}`;
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8");
}

function fileExists(relativePath) {
  const resolvedPath = path.resolve(ROOT_DIR, relativePath);
  return resolvedPath.startsWith(ROOT_DIR) && fs.existsSync(resolvedPath);
}

function getDom(file) {
  if (!domCache.has(file)) {
    domCache.set(file, new JSDOM(readText(file)));
  }
  return domCache.get(file);
}

function mapUrlPathToFile(urlPath) {
  let localPath = decodeURIComponent(urlPath);
  if (localPath === "/" || localPath === "") return "index.html";
  if (localPath.startsWith("/")) localPath = localPath.slice(1);
  if (localPath.endsWith("/")) localPath = `${localPath}index.html`;
  return path.posix.normalize(localPath);
}

function resolveInternalReference(fromFile, rawValue) {
  const value = (rawValue || "").trim();
  if (value === "") {
    return { file: fromFile, hash: "" };
  }
  if (/^(mailto|tel|javascript|data|blob):/i.test(value)) {
    return null;
  }
  if (value.startsWith("//")) {
    return null;
  }

  const baseUrl = `${SITE_ORIGIN}/${fromFile}`;
  let parsed;
  try {
    parsed = new URL(value, baseUrl);
  } catch {
    failures.push(`${fromFile}: invalid URL-like value "${value}"`);
    return null;
  }

  if (parsed.origin !== SITE_ORIGIN) {
    return null;
  }

  return {
    file: mapUrlPathToFile(parsed.pathname),
    hash: parsed.hash ? decodeURIComponent(parsed.hash.slice(1)) : "",
  };
}

function hasAnchorTarget(file, hash) {
  const document = getDom(file).window.document;
  if (document.getElementById(hash)) return true;
  return Array.from(document.querySelectorAll("[name]")).some((element) => element.getAttribute("name") === hash);
}

function checkExpectedFiles() {
  for (const page of pages) {
    assert(fileExists(page.file), `${page.file}: expected page file is missing`);
  }
}

function checkInternalHrefTargets() {
  for (const page of pages) {
    const document = getDom(page.file).window.document;
    const elements = Array.from(document.querySelectorAll("[href]"));

    for (const element of elements) {
      const href = element.getAttribute("href");
      const target = resolveInternalReference(page.file, href);
      if (!target) continue;

      assert(fileExists(target.file), `${page.file}: href="${href}" points to missing file ${target.file}`);
      if (target.hash && fileExists(target.file) && target.file.endsWith(".html")) {
        assert(hasAnchorTarget(target.file, target.hash), `${page.file}: href="${href}" points to missing anchor #${target.hash} in ${target.file}`);
      }
    }
  }
}

function optionText(option) {
  return option.textContent.replace(/\s+/g, " ").trim();
}

function optionTargetFile(fromFile, option) {
  const target = resolveInternalReference(fromFile, option.getAttribute("value") || "");
  return target ? target.file : "";
}

function checkLanguageSwitchers() {
  for (const page of pages) {
    const document = getDom(page.file).window.document;
    const select = document.querySelector("select.language-select");
    assert(Boolean(select), `${page.file}: language select is missing`);
    if (!select) continue;

    const options = Array.from(select.querySelectorAll("option"));
    assert(options.length === 2, `${page.file}: language select should have exactly 2 options`);

    const jaOption = options.find((option) => optionText(option) === "日本語");
    const enOption = options.find((option) => optionText(option) === "English");
    const selectedOption = options.find((option) => option.selected);
    assert(Boolean(jaOption), `${page.file}: Japanese option is missing`);
    assert(Boolean(enOption), `${page.file}: English option is missing`);
    assert(Boolean(selectedOption), `${page.file}: selected language option is missing`);

    for (const option of options) {
      const value = option.getAttribute("value") || "";
      if (value === "") continue;

      const target = resolveInternalReference(page.file, value);
      assert(Boolean(target), `${page.file}: language option "${optionText(option)}" must point to an internal page`);
      if (target) {
        assert(fileExists(target.file), `${page.file}: language option "${optionText(option)}" points to missing file ${target.file}`);
      }
    }

    if (page.lang === "ja") {
      assert(selectedOption === jaOption, `${page.file}: Japanese page should select Japanese`);
      assert(optionTargetFile(page.file, enOption) === page.counterpart, `${page.file}: English option should point to ${page.counterpart}`);
    } else {
      assert(selectedOption === enOption, `${page.file}: English page should select English`);
      assert(optionTargetFile(page.file, jaOption) === page.counterpart, `${page.file}: Japanese option should point to ${page.counterpart}`);
      assert(optionTargetFile(page.file, enOption) === page.file, `${page.file}: English option should keep the current English page`);
    }
  }
}

function getLinkHref(document, selector) {
  const element = document.querySelector(selector);
  return element ? element.getAttribute("href") : "";
}

function getAlternateMap(document) {
  return new Map(
    Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map((element) => [
      element.getAttribute("hreflang"),
      element.getAttribute("href"),
    ])
  );
}

function checkSeoAlternates() {
  for (const page of pages) {
    const document = getDom(page.file).window.document;
    assert(document.documentElement.getAttribute("lang") === page.lang, `${page.file}: html lang should be ${page.lang}`);

    assert(getLinkHref(document, 'link[rel="canonical"]') === page.canonicalUrl, `${page.file}: canonical should be ${page.canonicalUrl}`);

    const alternates = getAlternateMap(document);
    assert(alternates.get("ja") === page.jaUrl, `${page.file}: hreflang ja should be ${page.jaUrl}`);
    assert(alternates.get("en") === page.enUrl, `${page.file}: hreflang en should be ${page.enUrl}`);
    assert(alternates.get("x-default") === page.jaUrl, `${page.file}: hreflang x-default should be ${page.jaUrl}`);

    const counterpart = pageByFile.get(page.counterpart);
    const counterpartAlternates = getAlternateMap(getDom(counterpart.file).window.document);
    assert(counterpartAlternates.get("ja") === page.jaUrl, `${page.file}: counterpart hreflang ja should match`);
    assert(counterpartAlternates.get("en") === page.enUrl, `${page.file}: counterpart hreflang en should match`);
    assert(counterpartAlternates.get("x-default") === page.jaUrl, `${page.file}: counterpart hreflang x-default should match`);
  }
}

function getSitemapLocs() {
  const sitemapDom = new JSDOM(readText("sitemap.xml"), { contentType: "text/xml" });
  const parserError = sitemapDom.window.document.querySelector("parsererror");
  assert(!parserError, "sitemap.xml: XML should parse without errors");
  return Array.from(sitemapDom.window.document.querySelectorAll("loc")).map((loc) => loc.textContent.trim());
}

function checkSitemap() {
  const locs = getSitemapLocs();
  const locSet = new Set(locs);
  const expectedUrls = pages.map((page) => page.canonicalUrl);
  const expectedSet = new Set(expectedUrls);

  assert(locs.length === locSet.size, "sitemap.xml: loc entries should not contain duplicates");

  for (const expectedUrl of expectedUrls) {
    assert(locSet.has(expectedUrl), `sitemap.xml: missing ${expectedUrl}`);
  }

  for (const loc of locs) {
    assert(expectedSet.has(loc), `sitemap.xml: unexpected URL ${loc}`);

    let parsed;
    try {
      parsed = new URL(loc);
    } catch {
      failures.push(`sitemap.xml: invalid loc ${loc}`);
      continue;
    }

    if (parsed.origin === SITE_ORIGIN) {
      const file = mapUrlPathToFile(parsed.pathname);
      assert(fileExists(file), `sitemap.xml: ${loc} points to missing file ${file}`);
    }
  }
}

function checkDeployScript() {
  const script = readText("deploy_kotoba_mimamori_site.sh");
  const expectedSnippets = [
    "--include \"*.html\"",
    "--include \"en/*.html\"",
    "--include \"*.css\"",
    "--include \"assets/css/*.css\"",
    "--include \"sitemap.xml\"",
    "--dryrun",
  ];

  for (const snippet of expectedSnippets) {
    assert(script.includes(snippet), `deploy_kotoba_mimamori_site.sh: missing ${snippet}`);
  }
}

function checkApiRequestLanguages() {
  const expectedLanguages = [
    { file: "index.html", language: "ja" },
    { file: "en/index.html", language: "en" },
  ];

  for (const { file, language } of expectedLanguages) {
    const htmlText = readText(file);
    const pattern = new RegExp(`JSON\\.stringify\\(\\{\\s*text,\\s*tone,\\s*scene,\\s*language:\\s*['"]${language}['"]\\s*\\}\\)`);
    assert(pattern.test(htmlText), `${file}: API request body should include language: "${language}"`);
  }
}

checkExpectedFiles();
checkInternalHrefTargets();
checkLanguageSwitchers();
checkSeoAlternates();
checkSitemap();
checkDeployScript();
checkApiRequestLanguages();

if (failures.length > 0) {
  console.error("Static i18n checks failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Static i18n checks passed.");
