"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import { AnchoredDropdownPortal } from "@/components/search/AnchoredDropdownPortal";
import { searchFieldShell } from "@/components/search/searchFieldStyles";
import { useI18n } from "@/i18n/I18nProvider";
import {
  addMonths,
  formatCarDateWithWeekday,
  formatMonthYear,
  isDayInRange,
  isRangeEndpoint,
  monthGrid,
  normalizeRangeSelection,
  parseYmd,
  startOfDay,
  startOfMonth,
  toYmd
} from "@/lib/dateRange";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function MonthPanel({
  month,
  from,
  to,
  locale,
  minDate,
  onDayClick
}: {
  month: Date;
  from: string;
  to: string;
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
          const endpoint = isRangeEndpoint(day, from, to);
          const inRange = isDayInRange(day, from, to);
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
                inRange && !endpoint && "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200",
                endpoint && "bg-brand-600 font-semibold text-white hover:bg-brand-600"
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
  pickUpDate: string;
  dropOffDate: string;
  onChange: (pickUpDate: string, dropOffDate: string) => void;
  pickUpLabel: string;
  dropOffLabel: string;
  clearLabel?: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CarDateRangePicker({
  pickUpDate,
  dropOffDate,
  onChange,
  pickUpLabel,
  dropOffLabel,
  clearLabel = "Clear dates",
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

  const [draftFrom, setDraftFrom] = useState(pickUpDate);
  const [draftTo, setDraftTo] = useState(dropOffDate);
  const minDate = useMemo(() => startOfDay(new Date()), []);

  const [leftMonth, setLeftMonth] = useState(() => {
    const anchor = parseYmd(pickUpDate) || parseYmd(dropOffDate) || new Date();
    return startOfMonth(anchor);
  });

  const rightMonth = useMemo(() => addMonths(leftMonth, 1), [leftMonth]);
  const hasRange = Boolean(pickUpDate || dropOffDate);
  const pickUpDisplay = formatCarDateWithWeekday(pickUpDate, lang);
  const dropOffDisplay = formatCarDateWithWeekday(dropOffDate, lang);

  useEffect(() => {
    if (!open) return;
    setDraftFrom(pickUpDate);
    setDraftTo(dropOffDate);
  }, [open, pickUpDate, dropOffDate]);

  useEffect(() => {
    const anchor = parseYmd(pickUpDate) || parseYmd(dropOffDate);
    if (anchor) setLeftMonth(startOfMonth(anchor));
  }, [pickUpDate, dropOffDate]);

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

  function onDayClick(ymd: string) {
    const next = normalizeRangeSelection(draftFrom, draftTo, ymd);
    setDraftFrom(next.from);
    setDraftTo(next.to);
    onChange(next.from, next.to);
    if (next.from && next.to) setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("", "");
    setDraftFrom("");
    setDraftTo("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn(searchFieldShell, "relative", className)}>
      <button
        type="button"
        className="flex h-full w-full items-center gap-0 pr-9 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:ring-offset-2 rounded-xl"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(!open)}
      >
        <div className="min-w-0 flex-1 px-0">
          <div className="text-xs font-medium leading-4 text-slate-500 dark:text-white/50">{pickUpLabel}</div>
          <div className="mt-1 h-5 truncate text-sm font-semibold leading-5 text-slate-900 dark:text-white">
            {pickUpDisplay || "—"}
          </div>
        </div>

        <div className="mx-2 h-9 w-px shrink-0 bg-slate-200 dark:bg-white/15" aria-hidden />

        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium leading-4 text-slate-500 dark:text-white/50">{dropOffLabel}</div>
          <div className="mt-1 h-5 truncate text-sm font-semibold leading-5 text-slate-900 dark:text-white">
            {dropOffDisplay || "—"}
          </div>
        </div>
      </button>

      {hasRange ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 dark:text-white/70 dark:hover:bg-white/10"
          aria-label={clearLabel}
        >
          <FiX className="h-5 w-5" />
        </button>
      ) : (
        <FiCalendar
          className="pointer-events-none absolute right-2 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-500"
          aria-hidden
        />
      )}

      <AnchoredDropdownPortal
        open={open}
        anchorRef={rootRef}
        panelRef={panelRef}
        className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-zinc-950 dark:ring-white/15"
      >
        <div role="dialog" aria-label={`${pickUpLabel} – ${dropOffLabel}`}>
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
                from={draftFrom}
                to={draftTo}
                locale={lang}
                minDate={minDate}
                onDayClick={onDayClick}
              />
              <MonthPanel
                month={rightMonth}
                from={draftFrom}
                to={draftTo}
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
