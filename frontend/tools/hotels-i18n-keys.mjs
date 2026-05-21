/** Hotel page i18n keys (source: en.json). */
export const HOTEL_I18N_KEYS = [
  "hero.hotels.title",
  "search.hotels.checkIn",
  "search.hotels.checkOut",
  "search.hotels.dates",
  "search.hotels.guests",
  "search.hotels.search",
  "search.hotels.datesPlaceholder",
  "search.hotels.destinationPlaceholder",
  "search.hotels.destinationRequired",
  "search.hotels.checkInRequired",
  "search.hotels.checkOutRequired",
  "search.hotels.clearDates",
  "search.hotels.adults",
  "search.hotels.adultsHint",
  "search.hotels.children",
  "search.hotels.childrenHint",
  "search.hotels.rooms",
  "search.hotels.roomsHint",
  "search.hotels.done",
  "search.hotels.guestOne",
  "search.hotels.guestsMany",
  "search.hotels.roomOne",
  "search.hotels.roomsMany",
  "search.hotels.resultsTitle",
  "search.hotels.resultsFor",
  "search.hotels.resultsComingSoon",
  "popularHotels.title",
  "popularHotels.subtitle",
  "popularHotels.all",
  "hotels.reasons.title",
  "hotels.reasons.choice",
  "hotels.reasons.discounts",
  "hotels.reasons.support",
  "hotels.about.title",
  "hotels.about.p1",
  "hotels.about.p2",
  "hotels.about.p3",
  "popularHotels.city.antalya",
  "popularHotels.city.bursa",
  "popularHotels.city.izmir",
  "popularHotels.city.ankara",
  "popularHotels.city.istanbul",
  "popularHotelsInternational.title",
  "popularHotelsInternational.desc1",
  "popularHotelsInternational.desc2",
  "popularHotelsInternational.dest.cyprus",
  "popularHotelsInternational.dest.dubai",
  "popularHotelsInternational.dest.belgrade",
  "popularHotelsInternational.dest.amsterdam",
  "popularHotelsInternational.dest.sharmElSheikh"
];

export function pickHotelStringsFromEn(en) {
  const out = {};
  for (const key of HOTEL_I18N_KEYS) {
    if (typeof en[key] === "string") out[key] = en[key];
  }
  return out;
}
