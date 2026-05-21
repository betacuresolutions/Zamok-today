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
import { formatFerryDateDisplay, startOfDay } from "@/lib/dateRange";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function DateHalf({
  label,
  ymd,
  active,
  onClick
}: {
  label: string;
  ymd: string;
  active: boolean;
  onClick: () => void;
}) {
  const { lang } = useI18n();
  const display = formatFerryDateDisplay(ymd, lang);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-0 flex-1 rounded-lg px-1 py-0.5 text-left transition",
        active && "ring-2 ring-brand-600 ring-offset-1 dark:ring-brand-500"
      )}
    >
      <div className="text-xs font-medium leading-4 text-slate-500 dark:text-white/50">{label}</div>
      <div
        className={cn(
          "truncate text-sm font-semibold leading-snug",
          display ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-white/40"
        )}
      >
        {display || "—"}
      </div>
    </button>
  );
}

type Props = {
  departDate: string;
  returnDate: string;
  onChange: (departDate: string, returnDate: string) => void;
  departLabel: string;
  returnLabel: string;
  clearLabel?: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function FerryDateRangePicker({
  departDate,
  returnDate,
  onChange,
  departLabel,
  returnLabel,
  clearLabel = "Clear dates",
  className,
  open: controlledOpen,
  onOpenChange
}: Props) {
  const { lang } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [activeField, setActiveField] = useState<"depart" | "return">("depart");
  const open = controlledOpen ?? uncontrolledOpen;

  function setOpen(next: boolean) {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  const [draftFrom, setDraftFrom] = useState(departDate);
  const [draftTo, setDraftTo] = useState(returnDate);
  const minDate = useMemo(() => startOfDay(new Date()), []);
  const [leftMonth, setLeftMonth] = useState(() => initialLeftMonthFromRange(departDate, returnDate));
  const hasRange = Boolean(departDate || returnDate);

  useEffect(() => {
    if (!open) return;
    setDraftFrom(departDate);
    setDraftTo(returnDate);
    if (!departDate) setActiveField("depart");
    else if (!returnDate) setActiveField("return");
  }, [open, departDate, returnDate]);

  useEffect(() => {
    setLeftMonth(initialLeftMonthFromRange(departDate, returnDate));
  }, [departDate, returnDate]);

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

  function openField(field: "depart" | "return") {
    if (open && activeField === field) {
      setOpen(false);
      return;
    }
    setActiveField(field);
    setOpen(true);
  }

  /** Flights-style: pick departure → focus return → pick return (closes). */
  function onDayClick(ymd: string) {
    if (activeField === "depart") {
      const keepReturn = draftTo && draftTo > ymd ? draftTo : "";
      setDraftFrom(ymd);
      setDraftTo(keepReturn);
      onChange(ymd, keepReturn);
      setActiveField("return");
      return;
    }
    if (!draftFrom || ymd < draftFrom) {
      setDraftFrom(ymd);
      setDraftTo("");
      onChange(ymd, "");
      setActiveField("return");
      return;
    }
    setDraftTo(ymd);
    onChange(draftFrom, ymd);
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("", "");
    setDraftFrom("");
    setDraftTo("");
    setActiveField("depart");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn(searchFieldShell, "relative", className)}>
      <div className="flex h-full w-full items-center gap-0 pr-9">
        <DateHalf
          label={departLabel}
          ymd={departDate}
          active={open && activeField === "depart"}
          onClick={() => openField("depart")}
        />
        <div className="mx-2 h-9 w-px shrink-0 bg-slate-200 dark:bg-white/15" aria-hidden />
        <DateHalf
          label={returnLabel}
          ymd={returnDate}
          active={open && activeField === "return"}
          onClick={() => openField("return")}
        />
      </div>

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
        align="right"
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
          ariaLabel={`${departLabel} – ${returnLabel}`}
        />
      </AnchoredDropdownPortal>
    </div>
  );
}
