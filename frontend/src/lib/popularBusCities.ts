/** Popular Türkiye bus destinations — city photos via IATA on avs.io (same as flights). */

export type PopularBusCity = {
  id: string;
  iata: string;
  nameKey: string;
  /** Prefilled in bus search “To” field */
  searchDestination: string;
  /** Indicative one-way bus fare for card display */
  fromPrice: number;
};

export function busCityImageFromIata(iata: string): string {
  const code = String(iata || "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) return "";
  return `https://img.avs.io/explore/cities/${code}`;
}

/** Fourteen major Türkiye cities for intercity bus routes. */
export const POPULAR_BUS_CITIES: ReadonlyArray<PopularBusCity> = [
  { id: "istanbul", iata: "IST", nameKey: "popularBuses.city.istanbul", searchDestination: "Istanbul", fromPrice: 28 },
  { id: "ankara", iata: "ESB", nameKey: "popularBuses.city.ankara", searchDestination: "Ankara", fromPrice: 32 },
  { id: "izmir", iata: "ADB", nameKey: "popularBuses.city.izmir", searchDestination: "Izmir", fromPrice: 35 },
  { id: "antalya", iata: "AYT", nameKey: "popularBuses.city.antalya", searchDestination: "Antalya", fromPrice: 42 },
  { id: "bursa", iata: "YEI", nameKey: "popularBuses.city.bursa", searchDestination: "Bursa", fromPrice: 22 },
  { id: "adana", iata: "ADA", nameKey: "popularBuses.city.adana", searchDestination: "Adana", fromPrice: 38 },
  { id: "gaziantep", iata: "GZT", nameKey: "popularBuses.city.gaziantep", searchDestination: "Gaziantep", fromPrice: 45 },
  { id: "konya", iata: "KYA", nameKey: "popularBuses.city.konya", searchDestination: "Konya", fromPrice: 30 },
  { id: "trabzon", iata: "TZX", nameKey: "popularBuses.city.trabzon", searchDestination: "Trabzon", fromPrice: 48 },
  { id: "diyarbakir", iata: "DIY", nameKey: "popularBuses.city.diyarbakir", searchDestination: "Diyarbakır", fromPrice: 52 },
  { id: "samsun", iata: "SZF", nameKey: "popularBuses.city.samsun", searchDestination: "Samsun", fromPrice: 40 },
  { id: "bodrum", iata: "BJV", nameKey: "popularBuses.city.bodrum", searchDestination: "Bodrum", fromPrice: 46 },
] as const;
