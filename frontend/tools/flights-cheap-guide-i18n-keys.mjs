/** Cheap flight tickets guide (home page, below Popular destinations). */
export const FLIGHTS_CHEAP_GUIDE_I18N_KEYS = [
  "flights.cheapGuide.title",
  "flights.cheapGuide.intro",
  "flights.cheapGuide.tip1.title",
  "flights.cheapGuide.tip1.text",
  "flights.cheapGuide.tip2.title",
  "flights.cheapGuide.tip2.text",
  "flights.cheapGuide.tip3.title",
  "flights.cheapGuide.tip3.text",
  "flights.cheapGuide.tip4.title",
  "flights.cheapGuide.tip4.text",
  "flights.cheapGuide.outro"
];

export function pickFlightsCheapGuideFromEn(en) {
  const out = {};
  for (const key of FLIGHTS_CHEAP_GUIDE_I18N_KEYS) {
    if (typeof en[key] === "string") out[key] = en[key];
  }
  return out;
}
