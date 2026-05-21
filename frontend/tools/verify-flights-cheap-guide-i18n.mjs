import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FLIGHTS_CHEAP_GUIDE_I18N_KEYS } from "./flights-cheap-guide-i18n-keys.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "..", "public", "locales");
const en = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));

let failed = false;
for (const name of fs.readdirSync(localesDir)) {
  if (!name.endsWith(".json")) continue;
  const loc = JSON.parse(fs.readFileSync(path.join(localesDir, name), "utf8"));
  const missing = FLIGHTS_CHEAP_GUIDE_I18N_KEYS.filter((key) => typeof loc[key] !== "string" || !loc[key].trim());
  const englishOnly =
    name !== "en.json" && name !== "tr.json"
      ? FLIGHTS_CHEAP_GUIDE_I18N_KEYS.filter((key) => loc[key] === en[key])
      : [];
  if (missing.length) {
    failed = true;
    console.error(`${name}: missing`, missing.join(", "));
  } else if (englishOnly.length) {
    console.warn(`${name}: ${englishOnly.length} key(s) still English`);
  }
}

if (failed) process.exit(1);
console.log(`OK: ${FLIGHTS_CHEAP_GUIDE_I18N_KEYS.length} keys in all locales.`);
