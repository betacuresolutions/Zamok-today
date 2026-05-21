export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toYmd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, count: number) {
  return new Date(d.getFullYear(), d.getMonth() + count, 1);
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function monthGrid(month: Date) {
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

export function formatMonthYear(month: Date, locale?: string) {
  return month.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

export type DateRangeValue = { from: string; to: string };

/** First click → from; second → to; when both set, next click restarts with a new from. */
export function normalizeRangeSelection(from: string, to: string, clickedYmd: string): DateRangeValue {
  if (!from || (from && to)) {
    return { from: clickedYmd, to: "" };
  }
  if (clickedYmd < from) {
    return { from: clickedYmd, to: from };
  }
  return { from, to: clickedYmd };
}

/**
 * Ferry / flexible stay range: first click sets departure, second sets return.
 * When both are set, a later click moves return; an earlier click starts a new departure.
 */
export function normalizeFerryRangeSelection(from: string, to: string, clickedYmd: string): DateRangeValue {
  if (!from) {
    return { from: clickedYmd, to: "" };
  }
  if (!to) {
    if (clickedYmd < from) {
      return { from: clickedYmd, to: from };
    }
    return { from, to: clickedYmd };
  }
  if (clickedYmd < from) {
    return { from: clickedYmd, to: "" };
  }
  return { from, to: clickedYmd };
}

export function isDayInRange(day: Date, fromYmd: string, toYmd: string) {
  const from = parseYmd(fromYmd);
  const to = parseYmd(toYmd);
  if (!from || !to) return false;
  const t = startOfDay(day).getTime();
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return t > lo && t < hi;
}

export function isRangeEndpoint(day: Date, fromYmd: string, toYmd: string) {
  const from = parseYmd(fromYmd);
  const to = parseYmd(toYmd);
  if (from && sameDay(day, from)) return true;
  if (to && sameDay(day, to)) return true;
  return false;
}

export function formatHotelDateWithWeekday(ymd: string, locale?: string) {
  const d = parseYmd(ymd);
  if (!d) return "";
  const datePart = d.toLocaleDateString(locale, { month: "short", day: "numeric" });
  const weekday = d.toLocaleDateString(locale, { weekday: "long" });
  return `${datePart} (${weekday})`;
}

/** Car rental date cells: "22 May" + "Friday". */
export function formatCarDateParts(ymd: string, locale?: string) {
  const d = parseYmd(ymd);
  if (!d) return { dayMonth: "", weekday: "" };
  return {
    dayMonth: d.toLocaleDateString(locale, { day: "numeric", month: "short" }),
    weekday: d.toLocaleDateString(locale, { weekday: "long" })
  };
}

/** Car rental display: "May 22 (Friday)". */
export function formatCarDateWithWeekday(ymd: string, locale?: string) {
  const { dayMonth, weekday } = formatCarDateParts(ymd, locale);
  if (!dayMonth) return "";
  return weekday ? `${dayMonth} (${weekday})` : dayMonth;
}

/** Ferry date field: stacked "22 May" + "Friday" (desktop legacy). */
export function formatFerryDateStack(ymd: string, locale?: string) {
  return formatCarDateParts(ymd, locale);
}

/** Ferry display: "MAY 19 (Sunday)" — same as bus departure style. */
export function formatFerryDateDisplay(ymd: string, locale?: string) {
  return formatBusDepartureDisplay(ymd, locale);
}

/** Bus departure field: "MAY 21 (Thursday)". */
export function formatBusDepartureDisplay(ymd: string, locale?: string) {
  const d = parseYmd(ymd);
  if (!d) return "";
  const month = d
    .toLocaleDateString(locale, { month: "short" })
    .replace(/\./g, "")
    .trim()
    .toUpperCase();
  const day = d.getDate();
  const weekday = d.toLocaleDateString(locale, { weekday: "long" });
  return weekday ? `${month} ${day} (${weekday})` : `${month} ${day}`;
}

export function addDaysYmd(ymd: string, days: number) {
  const dt = parseYmd(ymd);
  if (!dt) return "";
  dt.setDate(dt.getDate() + days);
  return toYmd(dt);
}

/** Hotels / cars: at least one night between check-in and check-out (or pick-up / drop-off). */
export function ensureMinimumStayRange(from: string, to: string, minNights = 1): DateRangeValue {
  if (!from || !to) return { from, to };
  if (to <= from) return { from, to: addDaysYmd(from, minNights) };
  return { from, to };
}

export function applyHotelRangeDayClick(from: string, to: string, clickedYmd: string): DateRangeValue {
  const next = normalizeRangeSelection(from, to, clickedYmd);
  return ensureMinimumStayRange(next.from, next.to);
}

export function applyFerryRangeDayClick(from: string, to: string, clickedYmd: string): DateRangeValue {
  return normalizeFerryRangeSelection(from, to, clickedYmd);
}

export function formatHotelStayRangeLabel(checkIn: string, checkOut: string, locale?: string) {
  if (checkIn && checkOut) {
    return `${formatHotelDateWithWeekday(checkIn, locale)} - ${formatHotelDateWithWeekday(checkOut, locale)}`;
  }
  if (checkIn) return formatHotelDateWithWeekday(checkIn, locale);
  if (checkOut) return formatHotelDateWithWeekday(checkOut, locale);
  return "";
}
