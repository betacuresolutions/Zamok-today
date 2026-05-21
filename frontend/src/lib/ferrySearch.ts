import {
  defaultFerryPassengers,
  normalizeFerryPassengers,
  type FerryPassengersState
} from "@/lib/ferryPassengers";

export type { FerryPassengersState } from "@/lib/ferryPassengers";
export { defaultFerryPassengers, normalizeFerryPassengers, totalFerryPassengers } from "@/lib/ferryPassengers";

export type FerryTripType = "oneWay" | "roundTrip";

export type FerrySearchForm = {
  tripType: FerryTripType;
  from: string;
  to: string;
  departDate: string;
  returnDate: string;
  passengers: FerryPassengersState;
};

export type FerrySearchQuery = FerrySearchForm;

export function defaultFerryDepartYmd() {
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

export function defaultFerryReturnYmd(departYmd: string) {
  return addDaysYmd(departYmd || defaultFerryDepartYmd(), 7);
}

function appendPassengerParams(params: URLSearchParams, passengers: FerryPassengersState) {
  params.set("pMode", passengers.mode);
  if (passengers.mode === "foot") {
    params.set("pAdult", String(passengers.foot.adult));
    params.set("pChild", String(passengers.foot.child));
    params.set("pSenior", String(passengers.foot.senior));
    params.set("pStudent", String(passengers.foot.student));
    params.set("pInfant", String(passengers.foot.infant));
  } else {
    params.set("vehicle", passengers.vehicle.vehicleType);
    params.set("pAdult", String(passengers.vehicle.adult));
    params.set("pChild", String(passengers.vehicle.child));
    params.set("pInfant", String(passengers.vehicle.infant));
  }
}

export function parsePassengersFromSearchParams(
  params: URLSearchParams,
  fallback?: FerryPassengersState
): FerryPassengersState {
  const mode = params.get("pMode") === "vehicle" ? "vehicle" : params.get("pMode") === "foot" ? "foot" : null;
  if (!mode) {
    const legacy = Number(params.get("passengers"));
    if (Number.isFinite(legacy) && legacy > 0) {
      return normalizeFerryPassengers(legacy);
    }
    return fallback ? normalizeFerryPassengers(fallback) : defaultFerryPassengers();
  }

  if (mode === "vehicle") {
    return normalizeFerryPassengers({
      mode: "vehicle",
      vehicle: {
        vehicleType: params.get("vehicle") === "motorcycle" ? "motorcycle" : "automobile",
        adult: Number(params.get("pAdult")) || 0,
        child: Number(params.get("pChild")) || 0,
        infant: Number(params.get("pInfant")) || 0
      },
      foot: defaultFerryPassengers().foot
    });
  }

  return normalizeFerryPassengers({
    mode: "foot",
    foot: {
      adult: Number(params.get("pAdult")) || 1,
      child: Number(params.get("pChild")) || 0,
      senior: Number(params.get("pSenior")) || 0,
      student: Number(params.get("pStudent")) || 0,
      infant: Number(params.get("pInfant")) || 0
    },
    vehicle: defaultFerryPassengers().vehicle
  });
}

export function buildFerrySearchResultsHref(query: FerrySearchQuery): string {
  const params = new URLSearchParams();
  if (query.tripType) params.set("trip", query.tripType);
  if (query.from.trim()) params.set("from", query.from.trim());
  if (query.to.trim()) params.set("to", query.to.trim());
  if (query.departDate) params.set("departDate", query.departDate);
  if (query.returnDate) params.set("returnDate", query.returnDate);
  appendPassengerParams(params, query.passengers);
  const qs = params.toString();
  return qs ? `/search/ferries?${qs}` : "/search/ferries";
}
