"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiX } from "react-icons/fi";
import { AnchoredDropdownPortal } from "@/components/search/AnchoredDropdownPortal";
import {
  initialLeftMonthFromRange,
  TwoMonthRangeCalendar
} from "@/components/date/TwoMonthRangeCalendar";
import { searchFieldShell } from "@/components/search/searchFieldStyles";
import { useI18n } from "@/i18n/I18nProvider";
import { applyHotelRangeDayClick, formatCarDateWithWeekday, startOfDay } from "@/lib/dateRange";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
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
  const [leftMonth, setLeftMonth] = useState(() => initialLeftMonthFromRange(pickUpDate, dropOffDate));
  const hasRange = Boolean(pickUpDate || dropOffDate);
  const pickUpDisplay = formatCarDateWithWeekday(pickUpDate, lang);
  const dropOffDisplay = formatCarDateWithWeekday(dropOffDate, lang);

  useEffect(() => {
    if (!open) return;
    setDraftFrom(pickUpDate);
    setDraftTo(dropOffDate);
  }, [open, pickUpDate, dropOffDate]);

  useEffect(() => {
    setLeftMonth(initialLeftMonthFromRange(pickUpDate, dropOffDate));
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
    const next = applyHotelRangeDayClick(draftFrom, draftTo, ymd);
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
        maxWidth={820}
        className="overflow-hidden rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-black/10 dark:bg-zinc-950 dark:ring-white/15"
      >
        <TwoMonthRangeCalendar
          from={draftFrom}
          to={draftTo}
          locale={lang}
          leftMonth={leftMonth}
          onLeftMonthChange={setLeftMonth}
          onDayClick={onDayClick}
          minDate={minDate}
          ariaLabel={`${pickUpLabel} – ${dropOffLabel}`}
        />
      </AnchoredDropdownPortal>
    </div>
  );
}
