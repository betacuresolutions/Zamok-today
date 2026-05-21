"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiCalendar, FiX } from "react-icons/fi";
import { applyFerryRangeDayClick, applyHotelRangeDayClick } from "@/lib/dateRange";

type Props = {
  departDate: string;
  returnDate: string;
  initialField?: "depart" | "return";
  onChange: (next: { departDate: string; returnDate: string }) => void;
  onClose: () => void;
  departureLabel: string;
  returnLabel: string;
  /** Hotels: click start → end → next click restarts range (clears end, sets new start). */
  cycleRangeOnDayClick?: boolean;
  /** Ferries: later clicks move return; use with cycleRangeOnDayClick. */
  ferryRangeSelection?: boolean;
  /** Buses: single departure date only — hide return tab and close after pick. */
  departOnly?: boolean;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYmd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function monthDays(month: Date) {
  const first = startOfMonth(month);
  const startDow = first.getDay();
  const start = new Date(first);
  start.setDate(first.getDate() - startDow);
  return Array.from({ length: 42 }, (_, idx) => {
    const day = new Date(start);
    day.setDate(start.getDate() + idx);
    return day;
  });
}

export function MobileDateRangePicker({
  departDate,
  returnDate,
  initialField = "depart",
  onChange,
  onClose,
  departureLabel,
  returnLabel,
  cycleRangeOnDayClick = false,
  ferryRangeSelection = false,
  departOnly = false
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeField, setActiveField] = useState<"depart" | "return">(initialField);

  const today = useMemo(() => startOfDay(new Date()), []);
  const depart = useMemo(() => parseYmd(departDate), [departDate]);
  const ret = useMemo(() => parseYmd(returnDate), [returnDate]);

  const months = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = new Date(start.getFullYear() + 1, 11, 1);
    const list: Date[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      list.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return list;
  }, []);

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    setActiveField(initialField);
  }, [initialField]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  function selectDay(day: Date) {
    const ymd = toYmd(day);
    if (cycleRangeOnDayClick) {
      const next = ferryRangeSelection
        ? applyFerryRangeDayClick(departDate, returnDate, ymd)
        : applyHotelRangeDayClick(departDate, returnDate, ymd);
      onChange({ departDate: next.from, returnDate: next.to });
      return;
    }
    if (activeField === "depart") {
      if (departOnly) {
        onChange({ departDate: ymd, returnDate: "" });
        window.setTimeout(() => onClose(), 0);
        return;
      }
      const nextReturn = returnDate && returnDate < ymd ? "" : returnDate;
      onChange({ departDate: ymd, returnDate: nextReturn });
      setActiveField("return");
      return;
    }
    if (departDate && ymd >= departDate) {
      onChange({ departDate, returnDate: ymd });
      window.setTimeout(() => onClose(), 0);
    }
  }

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] bg-slate-100 dark:bg-[#0f0f0f] md:hidden">
      <div
        ref={panelRef}
        className="absolute inset-0 overflow-hidden bg-slate-100 text-slate-900 dark:bg-[#0f0f0f] dark:text-white"
      >
        <div className="flex items-center justify-center border-b border-slate-300 bg-slate-100 px-4 py-3.5 dark:border-white/10 dark:bg-[#111111]">
          <div className="text-[20px] font-semibold leading-none md:text-[34px] py-3">Calendar</div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-3.5 grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-200 dark:text-white/70 dark:hover:bg-white/10"
            aria-label="Close calendar"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <div className="px-4 py-4">
          {departOnly ? (
            <div className="flex items-center justify-between rounded-2xl border-2 border-orange-500 bg-white px-4 py-2.5 dark:bg-[#171717]">
              <span className="text-[14px] font-medium text-slate-900 dark:text-white">{departureLabel}</span>
              <FiCalendar className="h-6 w-6 text-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 rounded-2xl bg-white ring-1 ring-slate-200 dark:bg-black/30 dark:ring-white/10">
              <button
                type="button"
                onClick={() => setActiveField("depart")}
                className={[
                  "flex items-center justify-between rounded-l-2xl px-4 py-2.5 text-left text-[14px] font-medium md:text-base",
                  activeField === "depart"
                    ? "border-2 border-orange-500 bg-white text-slate-900 dark:bg-[#171717] dark:text-white"
                    : "border border-slate-200 text-slate-500 dark:border-white/10 dark:text-white/60"
                ].join(" ")}
              >
                <span>{departureLabel}</span>
                <FiCalendar className="h-6 w-6 text-blue-500" />
              </button>
              <button
                type="button"
                onClick={() => setActiveField("return")}
                className={[
                  "rounded-r-2xl px-4 py-2.5 text-left text-[14px] font-medium md:text-base",
                  activeField === "return"
                    ? "border-2 border-orange-500 bg-white text-slate-900 dark:bg-[#171717] dark:text-white"
                    : "border border-slate-200 text-slate-500 dark:border-white/10 dark:text-white/60"
                ].join(" ")}
              >
                {returnLabel}
              </button>
            </div>
          )}
        </div>

        <div className="h-[calc(100vh-155px)] overflow-y-auto px-4 pb-8">
          {months.map((month) => {
            const days = monthDays(month);
            const monthIdx = month.getMonth();
            return (
              <section key={`${month.getFullYear()}-${month.getMonth()}`} className="mb-3 rounded-3xl bg-white p-4 dark:bg-black/30">
                <div className="mb-2.5 text-[20px] font-semibold leading-none md:text-[32px] ml-3">
                  {month.toLocaleString(undefined, { month: "long" })}
                </div>
                <div className="mb-2 grid grid-cols-7 text-center text-[12px] font-semibold text-slate-500 dark:text-white/60 md:text-sm">
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((w) => (
                    <div key={w}>{w}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1 text-center">
                  {days.map((day) => {
                    const isOutside = day.getMonth() !== monthIdx;
                    const isPast = startOfDay(day).getTime() < today.getTime();
                    const isBeforeDepart =
                      !cycleRangeOnDayClick &&
                      activeField === "return" &&
                      depart
                        ? startOfDay(day).getTime() < startOfDay(depart).getTime()
                        : false;
                    const disabled = isPast || isBeforeDepart;
                    const isDepart = depart ? sameDay(depart, day) : false;
                    const isReturn = ret ? sameDay(ret, day) : false;
                    const dayTime = startOfDay(day).getTime();
                    const departTime = depart ? startOfDay(depart).getTime() : null;
                    const returnTime = ret ? startOfDay(ret).getTime() : null;
                    const inRange =
                      departTime !== null &&
                      returnTime !== null &&
                      dayTime > departTime &&
                      dayTime < returnTime;
                    if (isOutside) {
                      return <div key={day.toISOString()} className="h-10 md:h-11" aria-hidden="true" />;
                    }
                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        disabled={disabled}
                        onClick={() => selectDay(day)}
                        className={[
                          "h-10 text-[16px] leading-none md:h-11 md:text-[22px]",
                          disabled
                            ? "text-slate-300 dark:text-white/20"
                            : "text-slate-900 dark:text-white",
                          inRange ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200" : "",
                          isDepart || isReturn
                            ? "rounded-xl bg-brand-600 text-white dark:bg-brand-500 dark:text-white"
                            : "rounded-xl"
                        ].join(" ")}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

