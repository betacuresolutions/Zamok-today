export type HotelGuestsState = {
  adults: number;
  children: number;
  rooms: number;
};

export type HotelSearchQuery = {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
};

export function buildHotelSearchResultsHref(query: HotelSearchQuery): string {
  const params = new URLSearchParams();
  if (query.destination.trim()) params.set("destination", query.destination.trim());
  if (query.checkIn) params.set("checkIn", query.checkIn);
  if (query.checkOut) params.set("checkOut", query.checkOut);
  params.set("adults", String(query.adults));
  if (query.children > 0) params.set("children", String(query.children));
  params.set("rooms", String(query.rooms));
  const qs = params.toString();
  return qs ? `/search/hotels?${qs}` : "/search/hotels";
}
