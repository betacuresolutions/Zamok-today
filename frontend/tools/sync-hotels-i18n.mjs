/**
 * Merges hotel page strings into all locale files.
 * From frontend: npm run i18n:hotels
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pickHotelStringsFromEn } from "./hotels-i18n-keys.mjs";
import { hotelTranslations } from "./hotels-i18n-translations.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "..", "public", "locales");

const en = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));
const fromEn = pickHotelStringsFromEn(en);

function resolveValue(key, enValue, lang, fileName, loc) {
  if (fileName === "tr.json" && key in loc && loc[key] !== enValue) {
    return loc[key];
  }
  const translated = hotelTranslations[lang]?.[key];
  if (translated) return translated;
  return enValue;
}

let updated = 0;
for (const name of fs.readdirSync(localesDir)) {
  if (!name.endsWith(".json") || name === "en.json") continue;
  const filePath = path.join(localesDir, name);
  const lang = name.replace(/\.json$/, "");
  const loc = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let changed = false;

  for (const [key, enValue] of Object.entries(fromEn)) {
    const value = resolveValue(key, enValue, lang, name, loc);
    if (loc[key] !== value) {
      loc[key] = value;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(loc, null, 2) + "\n");
    console.log("updated", name);
    updated += 1;
  }
}

let enChanged = false;
for (const [key, value] of Object.entries(fromEn)) {
  if (en[key] !== value) {
    en[key] = value;
    enChanged = true;
  }
}
if (enChanged) {
  fs.writeFileSync(path.join(localesDir, "en.json"), JSON.stringify(en, null, 2) + "\n");
  console.log("updated en.json");
}

console.log(`Done. ${updated} locale file(s) updated.`);
