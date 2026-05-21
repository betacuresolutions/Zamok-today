"use client";

import type { ReactNode } from "react";
import { FiCalendar, FiRepeat, FiSearch, FiX } from "react-icons/fi";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

/** Flights-style mobile search card shell (hidden from md breakpoint up). */
export const mobileSearchCardClass =
  "overflow-hidden rounded-3xl bg-white text-slate-900 ring-1 ring-black/10 dark:bg-black dark:text-white dark:ring-white/15 md:hidden";

/** Primary CTA below the card on mobile (matches FlightSearch). */
export const mobileSearchSubmitBtnClass =
  "mt-2.5 w-full rounded-2xl bg-[#ff8021] px-5 py-3 text-[16px] font-semibold text-white shadow-sm transition hover:bg-[#f07310] active:bg-[#e56a0c] ring-1 ring-black/10 md:hidden";

export const mobileSearchBottomBarClass = "mt-4 md:hidden";

export function MobileSearchCard({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(mobileSearchCardClass, className)}>{children}</div>;
}

export function MobileSearchSubmitButton({
  onClick,
  children,
  className
}: {
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button type="button" onClick={onClick} className={cn(mobileSearchSubmitBtnClass, className)}>
      {children}
    </button>
  );
}

/** Stacked from / to fields with search icon (flights mobile route row). */
export function MobileRouteFields({
  fromValue,
  onFromChange,
  toValue,
  onToChange,
  fromPlaceholder,
  toPlaceholder,
  canSwap,
  onSwap,
  swapAriaLabel = "Swap locations"
}: {
  fromValue: string;
  onFromChange: (value: string) => void;
  toValue: string;
  onToChange: (value: string) => void;
  fromPlaceholder: string;
  toPlaceholder: string;
  canSwap?: boolean;
  onSwap?: () => void;
  swapAriaLabel?: string;
}) {
  return (
    <div className="flex w-full items-center gap-5 px-3">
      <FiSearch className="h-5 w-5 shrink-0 text-slate-900 dark:text-white/80" aria-hidden />
      <div className="relative flex w-full min-w-0 flex-col">
        <div className="relative border-b border-slate-300/90 py-4 text-[14px] font-semibold leading-none dark:border-white/10">
          <input
            value={fromValue}
            onChange={(e) => onFromChange(e.target.value)}
            className="w-full bg-transparent text-[14px] outline-none placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-white/35"
            placeholder={fromPlaceholder}
          />
        </div>
        {canSwap && onSwap ? (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onSwap();
            }}
            onClick={(e) => e.preventDefault()}
            className="absolute right-1 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-blue-600 shadow-md ring-1 ring-blue-100 transition hover:bg-blue-50 hover:text-blue-700 dark:bg-zinc-950 dark:text-blue-400 dark:ring-white/10 dark:hover:bg-white/10"
            aria-label={swapAriaLabel}
          >
            <FiRepeat className="h-5 w-5" />
          </button>
        ) : null}
        <div className="relative flex items-center gap-3 border-t border-slate-300/90 py-3 dark:border-white/10">
          <input
            value={toValue}
            onChange={(e) => onToChange(e.target.value)}
            className="w-full bg-transparent text-[14px] outline-none placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-white/35"
            placeholder={toPlaceholder}
          />
        </div>
      </div>
    </div>
  );
}

/** Single destination field with search icon (hotels). */
export function MobileDestinationField({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex w-full items-center gap-5 border-b border-slate-300/90 px-3 py-4 dark:border-white/10">
      <FiSearch className="h-5 w-5 shrink-0 text-slate-900 dark:text-white/80" aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold outline-none placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-white/35"
        placeholder={placeholder}
      />
    </div>
  );
}

/** Date row with optional right slot (passengers / guests). */
export function MobileSearchMetaRow({
  dateLabel,
  onDateClick,
  showClearDates,
  onClearDates,
  clearDatesAriaLabel = "Clear dates",
  right
}: {
  dateLabel: ReactNode;
  onDateClick: () => void;
  showClearDates?: boolean;
  onClearDates?: () => void;
  clearDatesAriaLabel?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-t border-slate-300/90 dark:border-white/10">
      <div className="flex min-w-0 flex-1 items-center px-3 py-3.5">
        <button type="button" onClick={onDateClick} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <FiCalendar className="h-5 w-5 shrink-0 text-slate-500 dark:text-white/70" aria-hidden />
          <span className="truncate text-[14px] font-semibold">{dateLabel}</span>
        </button>
        {showClearDates && onClearDates ? (
          <button
            type="button"
            onClick={onClearDates}
            className="ml-2 grid h-8 w-8 shrink-0 place-items-center rounded-md text-blue-600 transition hover:bg-slate-100 dark:text-blue-400 dark:hover:bg-white/10"
            aria-label={clearDatesAriaLabel}
          >
            <FiX className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      {right ? (
        <div className="w-[min(42%,11.5rem)] max-w-[200px] shrink-0 border-l border-slate-300/90 py-1 dark:border-white/10">
          <div className="flex min-w-0 items-center gap-2 px-2.5 sm:gap-3 sm:px-3">{right}</div>
        </div>
      ) : null}
    </div>
  );
}

/** Full-width row for passengers / guests (ferries, long date ranges). */
export function MobileSearchSecondaryRow({
  icon,
  children
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-slate-300/90 px-3 py-3.5 dark:border-white/10">
      {icon}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
