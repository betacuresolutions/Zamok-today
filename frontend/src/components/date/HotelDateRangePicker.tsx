"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import { AnchoredDropdownPortal } from "@/components/search/AnchoredDropdownPortal";
import {
  searchFieldLabelClass,
  searchFieldShell,
  searchFieldValueClass
} from "@/components/search/searchFieldStyles";
import { useI18n } from "@/i18n/I18nProvider";
import {
  addMonths,
  formatHotelStayRangeLabel,
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

type Props = {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  label: string;
  placeholder: string;
  clearLabel?: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

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
    <div className="w-[360px] max-w-full shrink-0">
      <div className="grid grid-cols-7 gap-1 px-1 pb-2 text-xs text-slate-500 dark:text-white/50">
        {weekDays.map((w) => (
          <div key={w} className="text-center font-medium">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 px-1">
        {days.map((day) => {
          const inMonth = day.getMonth() === monthIndex;
          if (!inMonth) {
            return <div key={day.toISOString()} className="h-11 rounded-xl" aria-hidden />;
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
                "h-11 rounded-xl text-sm font-medium transition",
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

export function HotelDateRangePicker({
  checkIn,
  checkOut,
  onChange,
  label,
  placeholder,
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

  const [draftFrom, setDraftFrom] = useState(checkIn);
  const [draftTo, setDraftTo] = useState(checkOut);
  const minDate = useMemo(() => startOfDay(new Date()), []);

  const [leftMonth, setLeftMonth] = useState(() => {
    const anchor = parseYmd(checkIn) || parseYmd(checkOut) || new Date();
    return startOfMonth(anchor);
  });

  const rightMonth = useMemo(() => addMonths(leftMonth, 1), [leftMonth]);

  const displayLabel = useMemo(() => {
    const from = open ? draftFrom : checkIn;
    const to = open ? draftTo : checkOut;
    return formatHotelStayRangeLabel(from, to, lang) || placeholder;
  }, [open, draftFrom, draftTo, checkIn, checkOut, lang, placeholder]);

  useEffect(() => {
    if (!open) return;
    setDraftFrom(checkIn);
    setDraftTo(checkOut);
  }, [open, checkIn, checkOut]);

  useEffect(() => {
    const anchor = parseYmd(checkIn) || parseYmd(checkOut);
    if (anchor) setLeftMonth(startOfMonth(anchor));
  }, [checkIn, checkOut]);

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

  const hasRange = Boolean(checkIn || checkOut);

  return (
    <div ref={rootRef} className={cn(searchFieldShell, "relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-full w-full flex-col justify-center pr-8 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:ring-offset-2 rounded-xl"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className={searchFieldLabelClass}>{label}</span>
        <span
          className={cn(
            searchFieldValueClass,
            "truncate",
            !hasRange && "font-normal text-slate-400 dark:text-white/40"
          )}
        >
          {displayLabel}
        </span>
      </button>

      {hasRange ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 dark:text-white/70 dark:hover:bg-white/10"
          aria-label={clearLabel}
        >
          <FiX className="h-5 w-5" />
        </button>
      ) : (
        <FiCalendar
          className="pointer-events-none absolute right-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-500"
          aria-hidden
        />
      )}

      <AnchoredDropdownPortal
        open={open}
        anchorRef={rootRef}
        panelRef={panelRef}
        className="max-h-[min(85vh,32rem)] overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-black/10 dark:bg-zinc-950 dark:ring-white/15"
      >
        <div role="dialog" aria-label={label}>
          <div className="flex items-center justify-between gap-4 px-1 pb-3">
            <button
              type="button"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15"
              onClick={() => setLeftMonth((m) => addMonths(m, -1))}
              aria-label="Previous month"
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 flex-1 items-center justify-center gap-8 sm:gap-14">
              <div className="text-lg font-semibold text-slate-900 dark:text-white">
                {formatMonthYear(leftMonth, lang)}
              </div>
              <div className="hidden text-lg font-semibold text-slate-900 sm:block dark:text-white">
                {formatMonthYear(rightMonth, lang)}
              </div>
            </div>
            <button
              type="button"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15"
              onClick={() => setLeftMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
            >
              <FiChevronRight className="h-5 w-5" />
            </button>
          </div>
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
      </AnchoredDropdownPortal>
    </div>
  );
}
