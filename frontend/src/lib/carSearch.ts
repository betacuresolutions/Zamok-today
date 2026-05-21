export type CarSearchForm = {
  pickUpCity: string;
  pickUpSubtitle: string;
  dropOffCity: string;
  dropOffSubtitle: string;
  pickUpDate: string;
  dropOffDate: string;
  pickUpTime: string;
  dropOffTime: string;
  driverAge: string;
};

export type CarSearchQuery = CarSearchForm;

export const DRIVER_AGE_OPTIONS = [
  { value: "21-24", labelKey: "search.cars.driverAge21_24" },
  { value: "25-29", labelKey: "search.cars.driverAge25_29" },
  { value: "30-65", labelKey: "search.cars.driverAge30_65" },
  { value: "66+", labelKey: "search.cars.driverAge66Plus" }
] as const;

export const DEFAULT_DRIVER_AGE = "30-65";

export function buildCarTimeOptions(): string[] {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    out.push(`${pad2(h)}:00`, `${pad2(h)}:30`);
  }
  return out;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function buildCarSearchResultsHref(query: CarSearchQuery): string {
  const params = new URLSearchParams();
  if (query.pickUpCity.trim()) params.set("pickUp", query.pickUpCity.trim());
  if (query.pickUpSubtitle.trim()) params.set("pickUpPlace", query.pickUpSubtitle.trim());
  if (query.dropOffCity.trim()) params.set("dropOff", query.dropOffCity.trim());
  if (query.dropOffSubtitle.trim()) params.set("dropOffPlace", query.dropOffSubtitle.trim());
  if (query.pickUpDate) params.set("pickUpDate", query.pickUpDate);
  if (query.dropOffDate) params.set("dropOffDate", query.dropOffDate);
  if (query.pickUpTime) params.set("pickUpTime", query.pickUpTime);
  if (query.dropOffTime) params.set("dropOffTime", query.dropOffTime);
  if (query.driverAge) params.set("driverAge", query.driverAge);
  const qs = params.toString();
  return qs ? `/search/cars?${qs}` : "/search/cars";
}
