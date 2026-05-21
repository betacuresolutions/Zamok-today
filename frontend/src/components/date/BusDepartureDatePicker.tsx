"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { AnchoredDropdownPortal } from "@/components/search/AnchoredDropdownPortal";
import { searchFieldShell } from "@/components/search/searchFieldStyles";
import { useI18n } from "@/i18n/I18nProvider";
import { addDaysYmd, defaultBusDepartYmd } from "@/lib/busSearch";
import {
  addMonths,
  formatBusDepartureDisplay,
  formatMonthYear,
  isRangeEndpoint,
  monthGrid,
  parseYmd,
  startOfDay,
  startOfMonth,
  toYmd
} from "@/lib/dateRange";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

/** Stable radio group name (avoid useId — mismatches under SSR when the tree differs). */
const BUS_DEPART_QUICK_RADIO_NAME = "bus-depart-quick";

type QuickDay = "today" | "tomorrow";

function quickDayForYmd(ymd: string): QuickDay | null {
  const today = defaultBusDepartYmd();
  const tomorrow = addDaysYmd(today, 1);
  if (ymd === today) return "today";
  if (ymd === tomorrow) return "tomorrow";
  return null;
}

function MonthPanel({
  month,
  selectedYmd,
  locale,
  minDate,
  onDayClick
}: {
  month: Date;
  selectedYmd: string;
  locale: string;
  minDate: Date;
  onDayClick: (ymd: string) => void;
}) {
  const monthIndex = month.getMonth();
  const days = useMemo(() => monthGrid(month), [month]);

  const weekDays = useMemo(() => {
    const base = new Date(2024, 0, 7);
    return Array.from({ length: 7 }).map((_, i) =>
      new Date(base.getFullYear(), base.getMonth(), base.getDate() + i).toLocaleString(locale, {
        weekday: "short"
      })
    );
  }, [locale]);

  return (
    <div className="w-[min(360px,100%)] shrink-0">
      <div className="grid grid-cols-7 gap-1 px-1 pb-2 text-xs font-medium text-slate-500 dark:text-white/50">
        {weekDays.map((w) => (
          <div key={w} className="text-center">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 px-1">
        {days.map((day) => {
          const inMonth = day.getMonth() === monthIndex;
          if (!inMonth) {
            return <div key={day.toISOString()} className="h-10 rounded-xl" aria-hidden />;
          }
          const ymd = toYmd(day);
          const disabled = startOfDay(day).getTime() < minDate.getTime();
          const selected = isRangeEndpoint(day, selectedYmd, "");
          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onDayClick(ymd)}
              className={cn(
                "h-10 rounded-xl text-sm font-medium transition",
                disabled
                  ? "cursor-not-allowed text-slate-300 dark:text-white/35"
                  : "text-slate-900 hover:bg-slate-50 dark:text-white dark:hover:bg-white/10",
                selected && "bg-brand-600 font-semibold text-white hover:bg-brand-600"
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Props = {
  value: string;
  onChange: (ymd: string) => void;
  label: string;
  todayLabel: string;
  tomorrowLabel: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function BusDepartureDatePicker({
  value,
  onChange,
  label,
  todayLabel,
  tomorrowLabel,
  className,
  open: controlledOpen,
  onOpenChange
}: Props) {
  const { lang } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  function setOpen(next: boolean) {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  const minDate = useMemo(() => startOfDay(new Date()), []);
  const departDisplay = useMemo(() => formatBusDepartureDisplay(value, lang), [value, lang]);
  const quick = quickDayForYmd(value);

  const [leftMonth, setLeftMonth] = useState(() => {
    const anchor = parseYmd(value) || new Date();
    return startOfMonth(anchor);
  });

  const rightMonth = useMemo(() => addMonths(leftMonth, 1), [leftMonth]);

  useEffect(() => {
    const anchor = parseYmd(value);
    if (anchor) setLeftMonth(startOfMonth(anchor));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const node = e.target as Node;
      if (rootRef.current?.contains(node)) return;
      if (panelRef.current?.contains(node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function setQuick(day: QuickDay) {
    onChange(day === "today" ? defaultBusDepartYmd() : addDaysYmd(defaultBusDepartYmd(), 1));
  }

  function onDayClick(ymd: string) {
    onChange(ymd);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn(searchFieldShell, "relative", className)}>
      <div className="flex min-h-0 flex-1 items-center justify-between gap-3">
        <button
          type="button"
          className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:ring-offset-2 rounded-lg"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen(!open)}
        >
          <div className="text-xs font-medium leading-4 text-slate-500 dark:text-white/50">{label}</div>
          <div className="mt-1 truncate text-sm font-semibold leading-tight text-slate-900 dark:text-white">
            {departDisplay || "—"}
          </div>
        </button>

        <div className="flex shrink-0 flex-col gap-2 py-0.5" role="radiogroup" aria-label={label}>
          {(["today", "tomorrow"] as const).map((day) => {
            const selected = quick === day;
            const text = day === "today" ? todayLabel : tomorrowLabel;
            return (
              <label key={day} className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name={BUS_DEPART_QUICK_RADIO_NAME}
                  checked={selected}
                  onChange={() => setQuick(day)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 transition",
                    selected
                      ? "border-brand-600 bg-brand-600"
                      : "border-slate-300 bg-white dark:border-white/35 dark:bg-zinc-950"
                  )}
                  aria-hidden
                >
                  {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-white/90">{text}</span>
              </label>
            );
          })}
        </div>
      </div>

      <AnchoredDropdownPortal
        open={open}
        anchorRef={rootRef}
        panelRef={panelRef}
        align="right"
        maxWidth={760}
        className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-zinc-950 dark:ring-white/15"
      >
        <div role="dialog" aria-label={label}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/10">
            <button
              type="button"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white/80"
              onClick={() => setLeftMonth((m) => addMonths(m, -1))}
              aria-label="Previous month"
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 flex-1 items-center justify-center gap-6 sm:gap-12">
              <span className="text-base font-semibold text-slate-900 dark:text-white">
                {formatMonthYear(leftMonth, lang)}
              </span>
              <span className="hidden text-base font-semibold text-slate-900 sm:inline dark:text-white">
                {formatMonthYear(rightMonth, lang)}
              </span>
            </div>
            <button
              type="button"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white/80"
              onClick={() => setLeftMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
            >
              <FiChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="max-h-[min(70vh,22rem)] overflow-y-auto p-4">
            <div className="flex flex-col gap-6 sm:flex-row sm:justify-center">
              <MonthPanel
                month={leftMonth}
                selectedYmd={value}
                locale={lang}
                minDate={minDate}
                onDayClick={onDayClick}
              />
              <MonthPanel
                month={rightMonth}
                selectedYmd={value}
                locale={lang}
                minDate={minDate}
                onDayClick={onDayClick}
              />
            </div>
          </div>
        </div>
      </AnchoredDropdownPortal>
    </div>
  );
}
