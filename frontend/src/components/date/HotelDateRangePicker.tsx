"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiX } from "react-icons/fi";
import { AnchoredDropdownPortal } from "@/components/search/AnchoredDropdownPortal";
import {
  initialLeftMonthFromRange,
  TwoMonthRangeCalendar
} from "@/components/date/TwoMonthRangeCalendar";
import {
  searchFieldLabelClass,
  searchFieldShell,
  searchFieldValueClass
} from "@/components/search/searchFieldStyles";
import { useI18n } from "@/i18n/I18nProvider";
import { applyHotelRangeDayClick, formatHotelStayRangeLabel, startOfDay } from "@/lib/dateRange";

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
  const [leftMonth, setLeftMonth] = useState(() => initialLeftMonthFromRange(checkIn, checkOut));

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
    setLeftMonth(initialLeftMonthFromRange(checkIn, checkOut));
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
          ariaLabel={label}
        />
      </AnchoredDropdownPortal>
    </div>
  );
}
