/**
 * Translates flights & hotels FAQ keys that still match English (except en + tr).
 * Preserves {{brand}} placeholder.
 *
 * Run: npm run i18n:translate-travel-faq
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { batchTranslate, translate } from "google-translate-api-x";
import { TRAVEL_FAQ_KEYS, travelFaqEn } from "../tools/travel-faq-en.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "..", "public", "locales");
const en = travelFaqEn;

const LOCALE_TO_GOOGLE = {
  da: "da",
  de: "de",
  el: "el",
  es: "es",
  fi: "fi",
  fr: "fr",
  he: "he",
  hi: "hi",
  id: "id",
  it: "it",
  ja: "ja",
  ms: "ms",
  nl: "nl",
  no: "no",
  pl: "pl",
  pt: "pt",
  ro: "ro",
  ru: "ru",
  sv: "sv",
  th: "th",
  uk: "uk",
  vi: "vi",
  zh: "zh-CN"
};

const BRAND_PLACEHOLDER = "___ZAMOK_BRAND___";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BATCH_SIZE = 6;
const BETWEEN_BATCH_MS = 500;
const RETRIES = 4;

function shieldBrand(text) {
  return text.replace(/\{\{brand\}\}/g, BRAND_PLACEHOLDER);
}

function restoreBrand(text) {
  return text.replace(new RegExp(BRAND_PLACEHOLDER, "g"), "{{brand}}");
}

async function translateBatchWithRetry(strings, googleTo) {
  let lastErr;
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      const res = await batchTranslate(strings, {
        from: "en",
        to: googleTo,
        client: "gtx",
        rejectOnPartialFail: false
      });
      return strings.map((src, i) => {
        const item = res[i];
        const out = item && typeof item === "object" && "text" in item ? item.text : null;
        return restoreBrand(out != null && out !== "" ? out : src);
      });
    } catch (e) {
      lastErr = e;
      await sleep(800 * (attempt + 1));
    }
  }
  const out = [];
  for (const s of strings) {
    try {
      const r = await translate(s, { from: "en", to: googleTo, client: "gtx" });
      out.push(restoreBrand(r.text || s));
    } catch {
      out.push(s);
    }
    await sleep(120);
  }
  console.warn("batch fallback used:", lastErr?.message);
  return out;
}

async function translateLocale(fileBase, googleTo) {
  const name = `${fileBase}.json`;
  const filePath = path.join(localesDir, name);
  if (!fs.existsSync(filePath)) return;

  const loc = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const entries = TRAVEL_FAQ_KEYS.filter((k) => {
    if (k === "common.brand") return loc[k] === en[k];
    const v = loc[k];
    return typeof en[k] === "string" && v === en[k];
  }).map((k) => [k, en[k]]);

  if (entries.length === 0) {
    console.log(fileBase, ": nothing to translate");
    return;
  }

  const updates = {};
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const slice = entries.slice(i, i + BATCH_SIZE);
    const keys = slice.map(([k]) => k);
    const strings = slice.map(([, v]) => shieldBrand(v));
    const translated = await translateBatchWithRetry(strings, googleTo);
    keys.forEach((k, j) => {
      updates[k] = translated[j];
    });
    process.stdout.write(`\r${fileBase}: ${Math.min(i + BATCH_SIZE, entries.length)}/${entries.length}`);
    await sleep(BETWEEN_BATCH_MS);
  }
  console.log();

  fs.writeFileSync(filePath, JSON.stringify({ ...loc, ...updates }, null, 2) + "\n");
  console.log("wrote", name, `(${entries.length} key(s))`);
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const all = Object.entries(LOCALE_TO_GOOGLE);
  const targets =
    args.length > 0
      ? args.flatMap((a) => {
          const base = a.replace(/\.json$/i, "");
          const googleTo = LOCALE_TO_GOOGLE[base];
          if (!googleTo) return [];
          return [[base, googleTo]];
        })
      : all;

  for (const [fileBase, googleTo] of targets) {
    console.log("\n---", fileBase, "→", googleTo, "---");
    await translateLocale(fileBase, googleTo);
  }
  console.log("\nDone. en.json and tr.json were not run (translate manually for tr).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
