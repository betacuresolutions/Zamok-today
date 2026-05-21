/**
 * Ensures every locale file contains all car page keys from en.json.
 * From frontend: node tools/verify-cars-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CAR_I18N_KEYS, CAR_I18N_PROPER_NOUN_KEYS } from "./cars-i18n-keys.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "..", "public", "locales");

const en = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));
let failed = false;
let warned = 0;

for (const name of fs.readdirSync(localesDir)) {
  if (!name.endsWith(".json")) continue;
  const loc = JSON.parse(fs.readFileSync(path.join(localesDir, name), "utf8"));
  const missing = CAR_I18N_KEYS.filter((key) => typeof loc[key] !== "string" || !loc[key].trim());
  const englishOnly =
    name !== "en.json" && name !== "tr.json"
      ? CAR_I18N_KEYS.filter((key) => !CAR_I18N_PROPER_NOUN_KEYS.has(key) && loc[key] === en[key])
      : [];

  if (missing.length) {
    failed = true;
    console.error(`${name}: missing ${missing.length} key(s)`, missing.join(", "));
  } else if (englishOnly.length > 0) {
    warned += 1;
    console.warn(`${name}: ${englishOnly.length} car key(s) still English (run npm run i18n:translate-cars)`);
  }
}

if (failed) {
  process.exit(1);
}
console.log(`OK: ${CAR_I18N_KEYS.length} car keys present in all ${fs.readdirSync(localesDir).filter((n) => n.endsWith(".json")).length} locale files.`);
if (warned) {
  console.log(`Note: ${warned} locale(s) may need translation.`);
}
