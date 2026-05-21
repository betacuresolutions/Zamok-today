/**
 * Merges cheap flight guide strings into all locale files.
 * From frontend: npm run i18n:flights-cheap-guide
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pickFlightsCheapGuideFromEn } from "./flights-cheap-guide-i18n-keys.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "..", "public", "locales");

const en = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));
const fromEn = pickFlightsCheapGuideFromEn(en);

let updated = 0;
for (const name of fs.readdirSync(localesDir)) {
  if (!name.endsWith(".json") || name === "en.json") continue;
  const filePath = path.join(localesDir, name);
  const loc = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let changed = false;

  for (const [key, enValue] of Object.entries(fromEn)) {
    if (name === "tr.json" && key in loc && loc[key] !== enValue) {
      continue;
    }
    if (loc[key] !== enValue) {
      loc[key] = enValue;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(loc, null, 2) + "\n");
    console.log("updated", name);
    updated += 1;
  }
}

console.log(`Done. ${updated} locale file(s) updated (tr keeps existing Turkish).`);
