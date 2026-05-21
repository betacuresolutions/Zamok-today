export type BusSearchForm = {
  from: string;
  to: string;
  departDate: string;
  findHotelsAtDestination: boolean;
};

export type BusSearchQuery = BusSearchForm;

export function buildBusSearchResultsHref(query: BusSearchQuery): string {
  const params = new URLSearchParams();
  if (query.from.trim()) params.set("from", query.from.trim());
  if (query.to.trim()) params.set("to", query.to.trim());
  if (query.departDate) params.set("departDate", query.departDate);
  if (query.findHotelsAtDestination) params.set("hotels", "1");
  const qs = params.toString();
  return qs ? `/search/buses?${qs}` : "/search/buses";
}

export function defaultBusDepartYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDaysYmd(ymd: string, days: number) {
  const [y, m, day] = ymd.split("-").map(Number);
  if (!y || !m || !day) return ymd;
  const dt = new Date(y, m - 1, day);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
