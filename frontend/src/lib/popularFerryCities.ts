/** Popular Türkiye ferry ports — city photos via IATA on avs.io (same as flights/buses). */

export type PopularFerryCity = {
  id: string;
  iata: string;
  nameKey: string;
  searchDestination: string;
  fromPrice: number;
};

export function ferryCityImageFromIata(iata: string): string {
  const code = String(iata || "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) return "";
  return `https://img.avs.io/explore/cities/${code}`;
}

/** Major Türkiye coastal cities and ferry hubs. */
export const POPULAR_FERRY_CITIES: ReadonlyArray<PopularFerryCity> = [
  { id: "istanbul", iata: "IST", nameKey: "popularFerries.city.istanbul", searchDestination: "Istanbul", fromPrice: 18 },
  { id: "izmir", iata: "ADB", nameKey: "popularFerries.city.izmir", searchDestination: "Izmir", fromPrice: 22 },
  { id: "bodrum", iata: "BJV", nameKey: "popularFerries.city.bodrum", searchDestination: "Bodrum", fromPrice: 28 },
  { id: "cesme", iata: "ADB", nameKey: "popularFerries.city.cesme", searchDestination: "Çeşme", fromPrice: 24 },
  { id: "marmaris", iata: "DLM", nameKey: "popularFerries.city.marmaris", searchDestination: "Marmaris", fromPrice: 30 },
  { id: "antalya", iata: "AYT", nameKey: "popularFerries.city.antalya", searchDestination: "Antalya", fromPrice: 32 },
  { id: "bursa", iata: "YEI", nameKey: "popularFerries.city.bursa", searchDestination: "Bursa", fromPrice: 16 },
  { id: "bandirma", iata: "YEI", nameKey: "popularFerries.city.bandirma", searchDestination: "Bandırma", fromPrice: 14 },
  { id: "yalova", iata: "YEI", nameKey: "popularFerries.city.yalova", searchDestination: "Yalova", fromPrice: 12 },
  { id: "canakkale", iata: "CKZ", nameKey: "popularFerries.city.canakkale", searchDestination: "Çanakkale", fromPrice: 20 },
  { id: "kusadasi", iata: "ADB", nameKey: "popularFerries.city.kusadasi", searchDestination: "Kuşadası", fromPrice: 26 },
  { id: "fethiye", iata: "DLM", nameKey: "popularFerries.city.fethiye", searchDestination: "Fethiye", fromPrice: 29 },
  { id: "trabzon", iata: "TZX", nameKey: "popularFerries.city.trabzon", searchDestination: "Trabzon", fromPrice: 38 },
  { id: "mersin", iata: "COV", nameKey: "popularFerries.city.mersin", searchDestination: "Mersin", fromPrice: 34 }
] as const;
