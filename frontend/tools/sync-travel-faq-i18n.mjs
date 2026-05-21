/**
 * Merges flights & hotels FAQ strings into all locale files.
 * From frontend: npm run i18n:travel-faq
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { travelFaqEn } from "./travel-faq-en.mjs";
import { travelFaqTr } from "./travel-faq-tr.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "..", "public", "locales");

let updated = 0;
for (const name of fs.readdirSync(localesDir)) {
  if (!name.endsWith(".json")) continue;
  const filePath = path.join(localesDir, name);
  const loc = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const source = name === "tr.json" ? travelFaqTr : travelFaqEn;
  let changed = false;

  for (const [key, value] of Object.entries(source)) {
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

console.log(`Done. ${updated} locale file(s) updated.`);
