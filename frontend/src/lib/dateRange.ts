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

export function formatHotelStayRangeLabel(checkIn: string, checkOut: string, locale?: string) {
  if (checkIn && checkOut) {
    return `${formatHotelDateWithWeekday(checkIn, locale)} - ${formatHotelDateWithWeekday(checkOut, locale)}`;
  }
  if (checkIn) return formatHotelDateWithWeekday(checkIn, locale);
  if (checkOut) return formatHotelDateWithWeekday(checkOut, locale);
  return "";
}
