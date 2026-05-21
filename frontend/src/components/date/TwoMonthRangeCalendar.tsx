"use client";

import { useMemo } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import {
  addMonths,
  formatMonthYear,
  isDayInRange,
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

/** Shared two-month range grid (flights-style layout). */
export function TwoMonthRangeCalendar({
  from,
  to,
  locale,
  leftMonth,
  onLeftMonthChange,
  onDayClick,
  minDate = startOfDay(new Date()),
  ariaLabel = "Select dates"
}: {
  from: string;
  to: string;
  locale: string;
  leftMonth: Date;
  onLeftMonthChange: (month: Date) => void;
  onDayClick: (ymd: string) => void;
  minDate?: Date;
  ariaLabel?: string;
}) {
  const rightMonth = useMemo(() => addMonths(leftMonth, 1), [leftMonth]);

  return (
    <div role="dialog" aria-label={ariaLabel}>
      <div className="flex items-center justify-between gap-4 px-1 pb-3">
        <button
          type="button"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15"
          onClick={() => onLeftMonthChange(addMonths(leftMonth, -1))}
          aria-label="Previous month"
        >
          <FiChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-8 lg:gap-14">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">
            {formatMonthYear(leftMonth, locale)}
          </div>
          <div className="text-lg font-semibold text-slate-900 dark:text-white">
            {formatMonthYear(rightMonth, locale)}
          </div>
        </div>
        <button
          type="button"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15"
          onClick={() => onLeftMonthChange(addMonths(leftMonth, 1))}
          aria-label="Next month"
        >
          <FiChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max justify-center gap-6">
          <MonthPanel month={leftMonth} from={from} to={to} locale={locale} minDate={minDate} onDayClick={onDayClick} />
          <MonthPanel month={rightMonth} from={from} to={to} locale={locale} minDate={minDate} onDayClick={onDayClick} />
        </div>
      </div>
    </div>
  );
}

export function initialLeftMonthFromRange(fromYmd: string, toYmd: string) {
  const anchor = parseYmd(fromYmd) || parseYmd(toYmd) || new Date();
  return startOfMonth(anchor);
}
