/**
 * Ensures every locale file contains all hotel page keys from en.json.
 * From frontend: node tools/verify-hotels-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HOTEL_I18N_KEYS } from "./hotels-i18n-keys.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "..", "public", "locales");

const en = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));
let failed = false;

for (const name of fs.readdirSync(localesDir)) {
  if (!name.endsWith(".json")) continue;
  const loc = JSON.parse(fs.readFileSync(path.join(localesDir, name), "utf8"));
  const missing = HOTEL_I18N_KEYS.filter((key) => typeof loc[key] !== "string" || !loc[key].trim());
  const englishOnly = HOTEL_I18N_KEYS.filter(
    (key) => name !== "en.json" && loc[key] === en[key]
  );

  if (missing.length) {
    failed = true;
    console.error(`${name}: missing ${missing.length} key(s)`, missing.join(", "));
  } else if (englishOnly.length === HOTEL_I18N_KEYS.length && name !== "en.json") {
    console.warn(`${name}: all hotel keys still English`);
  }
}

if (failed) {
  process.exit(1);
}
console.log(`OK: ${HOTEL_I18N_KEYS.length} hotel keys present in all locale files.`);
