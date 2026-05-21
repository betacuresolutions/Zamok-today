export type FerryVehicleType = "automobile" | "motorcycle";

export type FerryFootPassengers = {
  adult: number;
  child: number;
  senior: number;
  student: number;
  infant: number;
};

export type FerryVehiclePassengers = {
  vehicleType: FerryVehicleType;
  adult: number;
  child: number;
  infant: number;
};

export type FerryPassengersState = {
  mode: "foot" | "vehicle";
  foot: FerryFootPassengers;
  vehicle: FerryVehiclePassengers;
};

export const FERRY_VEHICLE_OPTIONS: ReadonlyArray<{
  id: FerryVehicleType;
  labelKey: string;
  maxOccupants: number;
}> = [
  { id: "automobile", labelKey: "search.ferries.vehicleAutomobile", maxOccupants: 5 },
  { id: "motorcycle", labelKey: "search.ferries.vehicleMotorcycle", maxOccupants: 2 }
];

export function defaultFerryPassengers(): FerryPassengersState {
  return {
    mode: "foot",
    foot: { adult: 1, child: 0, senior: 0, student: 0, infant: 0 },
    vehicle: { vehicleType: "automobile", adult: 0, child: 0, infant: 0 }
  };
}

export function normalizeFerryPassengers(raw: unknown): FerryPassengersState {
  const defaults = defaultFerryPassengers();
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return {
      ...defaults,
      foot: { ...defaults.foot, adult: Math.min(9, Math.max(1, Math.round(raw))) }
    };
  }
  if (!raw || typeof raw !== "object") return defaults;
  const o = raw as Partial<FerryPassengersState>;
  const mode = o.mode === "vehicle" ? "vehicle" : "foot";
  const foot = { ...defaults.foot, ...(o.foot || {}) };
  const vehicle = {
    ...defaults.vehicle,
    ...(o.vehicle || {}),
    vehicleType:
      o.vehicle?.vehicleType === "motorcycle" ? "motorcycle" : defaults.vehicle.vehicleType
  };
  return { mode, foot: clampFoot(foot), vehicle: clampVehicle(vehicle) };
}

function clampFoot(foot: FerryFootPassengers): FerryFootPassengers {
  return {
    adult: Math.max(0, Math.min(9, foot.adult)),
    child: Math.max(0, Math.min(9, foot.child)),
    senior: Math.max(0, Math.min(9, foot.senior)),
    student: Math.max(0, Math.min(9, foot.student)),
    infant: Math.max(0, Math.min(9, foot.infant))
  };
}

function vehicleMax(vehicleType: FerryVehicleType) {
  return FERRY_VEHICLE_OPTIONS.find((v) => v.id === vehicleType)?.maxOccupants ?? 5;
}

function clampVehicle(vehicle: FerryVehiclePassengers): FerryVehiclePassengers {
  const max = vehicleMax(vehicle.vehicleType);
  const extra = Math.max(0, vehicle.adult) + Math.max(0, vehicle.child) + Math.max(0, vehicle.infant);
  const maxExtra = Math.max(0, max - 1);
  let adult = Math.max(0, Math.min(maxExtra, vehicle.adult));
  let child = Math.max(0, Math.min(maxExtra, vehicle.child));
  let infant = Math.max(0, Math.min(maxExtra, vehicle.infant));
  while (adult + child + infant > maxExtra) {
    if (infant > 0) infant -= 1;
    else if (child > 0) child -= 1;
    else if (adult > 0) adult -= 1;
    else break;
  }
  return {
    vehicleType: vehicle.vehicleType === "motorcycle" ? "motorcycle" : "automobile",
    adult,
    child,
    infant
  };
}

export function totalFerryPassengers(state: FerryPassengersState): number {
  if (state.mode === "vehicle") {
    return 1 + state.vehicle.adult + state.vehicle.child + state.vehicle.infant;
  }
  return (
    state.foot.adult + state.foot.child + state.foot.senior + state.foot.student + state.foot.infant
  );
}

export function footPassengerSum(foot: FerryFootPassengers) {
  return foot.adult + foot.child + foot.senior + foot.student + foot.infant;
}

export function isValidFerryPassengers(state: FerryPassengersState): boolean {
  if (state.mode === "foot") {
    const total = footPassengerSum(state.foot);
    return total >= 1 && total <= 9 && state.foot.adult >= 1;
  }
  const max = vehicleMax(state.vehicle.vehicleType);
  const total = 1 + state.vehicle.adult + state.vehicle.child + state.vehicle.infant;
  return total >= 1 && total <= max;
}
