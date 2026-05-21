"use client";

import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiMinus, FiPlus } from "react-icons/fi";
import { AnchoredDropdownPortal } from "@/components/search/AnchoredDropdownPortal";
import { MobileFullScreenSheet } from "@/components/search/MobileFullScreenSheet";
import { searchFieldShell } from "@/components/search/searchFieldStyles";
import { useT } from "@/i18n/I18nProvider";
import {
  FERRY_VEHICLE_OPTIONS,
  footPassengerSum,
  totalFerryPassengers,
  type FerryFootPassengers,
  type FerryPassengersState,
  normalizeFerryPassengers,
  type FerryVehiclePassengers,
  type FerryVehicleType
} from "@/lib/ferryPassengers";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

type Props = {
  value: FerryPassengersState;
  onChange: (next: FerryPassengersState) => void;
  className?: string;
  compact?: boolean;
  /** Match FerrySearch mobile vs desktop shell so only one dropdown mounts. */
  layout?: "mobile" | "desktop";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function CounterRow({
  label,
  hint,
  count,
  min,
  max,
  onDec,
  onInc
}: {
  label: string;
  hint?: string;
  count: number;
  min: number;
  max: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0 dark:border-white/10">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">{label}</div>
        {hint ? <div className="text-xs text-slate-500 dark:text-white/50">{hint}</div> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          disabled={count <= min}
          onClick={onDec}
          className={cn(
            "grid h-9 w-9 place-items-center rounded-lg border text-slate-700 transition dark:text-white",
            count <= min
              ? "cursor-not-allowed border-slate-200 text-slate-300 dark:border-white/10 dark:text-white/30"
              : "border-brand-600/50 hover:bg-brand-50 dark:border-brand-500/40 dark:hover:bg-brand-900/20"
          )}
          aria-label="Decrease"
        >
          <FiMinus className="h-4 w-4" />
        </button>
        <span className="min-w-[1.25rem] text-center text-base font-semibold tabular-nums text-slate-900 dark:text-white">
          {count}
        </span>
        <button
          type="button"
          disabled={count >= max}
          onClick={onInc}
          className={cn(
            "grid h-9 w-9 place-items-center rounded-lg border transition",
            count >= max
              ? "cursor-not-allowed border-slate-200 text-slate-300 dark:border-white/10 dark:text-white/30"
              : "border-brand-600 text-brand-600 hover:bg-brand-50 dark:border-brand-500 dark:text-brand-400 dark:hover:bg-brand-900/20"
          )}
          aria-label="Increase"
        >
          <FiPlus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function FerryPassengersPicker({
  value,
  onChange,
  className,
  compact = false,
  layout,
  open: controlledOpen,
  onOpenChange
}: Props) {
  const t = useT();
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [vehicleMenuOpen, setVehicleMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const open = controlledOpen ?? uncontrolledOpen;
  const layoutMatches =
    layout === "mobile" ? isMobileViewport : layout === "desktop" ? !isMobileViewport : true;
  const showPanel = open && layoutMatches;

  function setOpen(next: boolean) {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
    if (!next) setVehicleMenuOpen(false);
  }

  const total = totalFerryPassengers(value);
  const summaryLabel =
    total === 1
      ? tr("search.ferries.passengerOne", "1 Passenger")
      : tr("search.ferries.passengerMany", "{{count}} Passengers").replace("{{count}}", String(total));

  useEffect(() => {
    setMounted(true);
    function syncViewport() {
      setIsMobileViewport(window.innerWidth < 768);
    }
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (!showPanel) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointerDown(e: MouseEvent) {
      if (isMobileViewport) return;
      const node = e.target as Node;
      if (rootRef.current?.contains(node)) return;
      if (panelRef.current?.contains(node)) return;
      setOpen(false);
      setVehicleMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [showPanel, isMobileViewport]);

  useEffect(() => {
    if (!showPanel || !isMobileViewport) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showPanel, isMobileViewport]);

  function setMode(mode: "foot" | "vehicle") {
    onChange(normalizeFerryPassengers({ ...value, mode }));
    setVehicleMenuOpen(false);
  }

  function patchFoot(patch: Partial<FerryFootPassengers>) {
    onChange(normalizeFerryPassengers({ ...value, foot: { ...value.foot, ...patch } }));
  }

  function patchVehicle(patch: Partial<FerryVehiclePassengers>) {
    onChange(normalizeFerryPassengers({ ...value, vehicle: { ...value.vehicle, ...patch } }));
  }

  function footMaxFor(key: keyof FerryFootPassengers, nextFoot: FerryFootPassengers) {
    const others = footPassengerSum(nextFoot) - nextFoot[key];
    return Math.max(0, 9 - others);
  }

  const vehicleOption = FERRY_VEHICLE_OPTIONS.find((v) => v.id === value.vehicle.vehicleType)!;
  const vehicleMaxExtra = Math.max(0, vehicleOption.maxOccupants - 1);

  const doneButton = (
    <button
      type="button"
      onClick={() => setOpen(false)}
      className="w-full rounded-2xl bg-brand-600 py-3 text-base font-semibold text-white hover:bg-brand-700"
    >
      {t("search.hotels.done")}
    </button>
  );

  const panelContent = (
    <div className="flex flex-col">
      <div className="flex border-b border-slate-200 dark:border-white/10">
        {(["foot", "vehicle"] as const).map((mode) => {
          const active = value.mode === mode;
          const tabLabel =
            mode === "foot"
              ? t("search.ferries.passengersTabFoot")
              : t("search.ferries.passengersTabVehicle");
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setMode(mode)}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-semibold transition",
                active
                  ? "border-b-2 border-brand-600 text-brand-600 dark:border-brand-500 dark:text-brand-400"
                  : "text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white"
              )}
            >
              {tabLabel}
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          "overflow-y-auto px-4 py-2",
          isMobileViewport ? "max-h-none" : "max-h-[min(70vh,24rem)]"
        )}
      >
        {value.mode === "foot" ? (
          <>
            <CounterRow
              label={t("search.ferries.passengerAdult")}
              count={value.foot.adult}
              min={1}
              max={footMaxFor("adult", { ...value.foot, adult: value.foot.adult })}
              onDec={() => patchFoot({ adult: Math.max(1, value.foot.adult - 1) })}
              onInc={() => patchFoot({ adult: value.foot.adult + 1 })}
            />
            <CounterRow
              label={t("search.ferries.passengerChild")}
              hint={t("search.ferries.passengerChildAge")}
              count={value.foot.child}
              min={0}
              max={footMaxFor("child", value.foot)}
              onDec={() => patchFoot({ child: Math.max(0, value.foot.child - 1) })}
              onInc={() => patchFoot({ child: value.foot.child + 1 })}
            />
            <CounterRow
              label={t("search.ferries.passengerSenior")}
              count={value.foot.senior}
              min={0}
              max={footMaxFor("senior", value.foot)}
              onDec={() => patchFoot({ senior: Math.max(0, value.foot.senior - 1) })}
              onInc={() => patchFoot({ senior: value.foot.senior + 1 })}
            />
            <CounterRow
              label={t("search.ferries.passengerStudent")}
              hint={t("search.ferries.passengerStudentAge")}
              count={value.foot.student}
              min={0}
              max={footMaxFor("student", value.foot)}
              onDec={() => patchFoot({ student: Math.max(0, value.foot.student - 1) })}
              onInc={() => patchFoot({ student: value.foot.student + 1 })}
            />
            <CounterRow
              label={t("search.ferries.passengerInfant")}
              hint={t("search.ferries.passengerInfantAge")}
              count={value.foot.infant}
              min={0}
              max={footMaxFor("infant", value.foot)}
              onDec={() => patchFoot({ infant: Math.max(0, value.foot.infant - 1) })}
              onInc={() => patchFoot({ infant: value.foot.infant + 1 })}
            />
          </>
        ) : (
          <>
            <p className="py-3 text-xs leading-relaxed text-slate-600 dark:text-white/60">
              {t("search.ferries.vehicleFootnote")}
            </p>
            <div className="relative mb-2">
              <button
                type="button"
                onClick={() => setVehicleMenuOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-xl bg-slate-100 px-4 py-3 text-left dark:bg-white/10"
              >
                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-white/50">
                    {t("search.ferries.vehicleType")}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                    {t(vehicleOption.labelKey)}
                  </div>
                </div>
                <FiChevronDown
                  className={cn("h-5 w-5 shrink-0 text-slate-500 transition", vehicleMenuOpen && "rotate-180")}
                />
              </button>
              {vehicleMenuOpen ? (
                <ul
                  className={cn(
                    "mt-1 overflow-hidden rounded-xl bg-white py-1 ring-1 ring-black/10 dark:bg-zinc-950 dark:ring-white/15",
                    isMobileViewport
                      ? "relative shadow-none"
                      : "absolute left-0 right-0 top-full z-10 shadow-lg"
                  )}
                >
                  {FERRY_VEHICLE_OPTIONS.map((opt) => (
                    <li key={opt.id}>
                      <button
                        type="button"
                        onClick={() => {
                          patchVehicle({ vehicleType: opt.id as FerryVehicleType, adult: 0, child: 0, infant: 0 });
                          setVehicleMenuOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2.5 text-left text-sm font-medium transition",
                          value.vehicle.vehicleType === opt.id
                            ? "bg-brand-600 text-white"
                            : "text-slate-800 hover:bg-slate-50 dark:text-white dark:hover:bg-white/10"
                        )}
                      >
                        {t(opt.labelKey)}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <CounterRow
              label={t("search.ferries.passengerAdult")}
              hint={t("search.ferries.passengerAdultExDriver")}
              count={value.vehicle.adult}
              min={0}
              max={vehicleMaxExtra}
              onDec={() => patchVehicle({ adult: Math.max(0, value.vehicle.adult - 1) })}
              onInc={() => patchVehicle({ adult: value.vehicle.adult + 1 })}
            />
            <CounterRow
              label={t("search.ferries.passengerChild")}
              hint={t("search.ferries.passengerChildAge")}
              count={value.vehicle.child}
              min={0}
              max={vehicleMaxExtra}
              onDec={() => patchVehicle({ child: Math.max(0, value.vehicle.child - 1) })}
              onInc={() => patchVehicle({ child: value.vehicle.child + 1 })}
            />
            <CounterRow
              label={t("search.ferries.passengerInfant")}
              hint={t("search.ferries.passengerInfantAge")}
              count={value.vehicle.infant}
              min={0}
              max={vehicleMaxExtra}
              onDec={() => patchVehicle({ infant: Math.max(0, value.vehicle.infant - 1) })}
              onInc={() => patchVehicle({ infant: value.vehicle.infant + 1 })}
            />
          </>
        )}
      </div>
    </div>
  );

  const panel = (
    <>
      {panelContent}
      <div className="border-t border-slate-200 p-4 dark:border-white/10">{doneButton}</div>
    </>
  );

  const trigger = compact ? (
    <button
      type="button"
      className="flex w-full min-w-0 items-center gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:ring-offset-2 rounded-xl"
      aria-expanded={showPanel}
      aria-haspopup="dialog"
      onClick={() => setOpen(!open)}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-white/50">
        {t("search.ferries.passengers")}
      </span>
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-slate-900 dark:text-white">
        {summaryLabel}
      </span>
    </button>
  ) : (
    <button
      type="button"
      className="flex h-full w-full flex-col justify-center text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:ring-offset-2 rounded-xl"
      aria-expanded={showPanel}
      aria-haspopup="dialog"
      onClick={() => setOpen(!open)}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="text-xs font-medium leading-4 text-slate-500 dark:text-white/50">
        {t("search.ferries.passengers")}
      </div>
      <div className="mt-1 truncate text-sm font-semibold leading-5 text-slate-900 dark:text-white">
        {summaryLabel}
      </div>
    </button>
  );

  return (
    <div ref={rootRef} className={cn(compact ? "relative" : searchFieldShell, "relative", className)}>
      {trigger}

      <MobileFullScreenSheet
        open={showPanel && isMobileViewport}
        mounted={mounted}
        title={t("search.ferries.passengers")}
        onClose={() => setOpen(false)}
        closeAriaLabel={t("nav.menu.close")}
        footer={doneButton}
      >
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/10 dark:bg-zinc-950 dark:ring-white/15">
          {panelContent}
        </div>
      </MobileFullScreenSheet>

      {mounted && !isMobileViewport && layoutMatches ? (
        <AnchoredDropdownPortal
          open={showPanel}
          anchorRef={rootRef}
          panelRef={panelRef}
          align="right"
          maxWidth={400}
          className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-zinc-950 dark:ring-white/15"
        >
          <div role="dialog" aria-label={t("search.ferries.passengers")}>
            {panel}
          </div>
        </AnchoredDropdownPortal>
      ) : null}
    </div>
  );
}
