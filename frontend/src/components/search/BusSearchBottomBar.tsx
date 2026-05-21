"use client";

import { SearchOpenBookingToggle } from "@/components/search/SearchOpenBookingToggle";
import { useT } from "@/i18n/I18nProvider";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function BusFindHotelsToggle({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const t = useT();

  return (
    <label className="inline-flex shrink-0 cursor-pointer select-none items-center gap-3 text-sm font-semibold text-white/95">
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={[
            "absolute inset-0 rounded-full transition-colors duration-200",
            "bg-white/20 ring-1 ring-inset ring-white/30",
            "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-white/80 peer-focus-visible:outline-offset-2",
            "peer-checked:bg-white peer-checked:ring-white/90"
          ].join(" ")}
          aria-hidden="true"
        />
        <span
          className={[
            "pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow-sm transition-transform duration-200",
            "bg-white",
            "peer-checked:translate-x-5 peer-checked:bg-brand-600 peer-checked:shadow-md"
          ].join(" ")}
          aria-hidden="true"
        />
      </span>
      <span className="leading-snug">{t("search.buses.findHotelsAtDestination")}</span>
    </label>
  );
}

export function BusSearchBottomBar({
  findHotelsAtDestination,
  onFindHotelsAtDestinationChange,
  openBookingInNewTab,
  onOpenBookingInNewTabChange,
  showFindHotelsToggle = true,
  className
}: {
  findHotelsAtDestination: boolean;
  onFindHotelsAtDestinationChange: (checked: boolean) => void;
  openBookingInNewTab: boolean;
  onOpenBookingInNewTabChange: (checked: boolean) => void;
  showFindHotelsToggle?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6",
        className
      )}
    >
      {showFindHotelsToggle ? (
        <BusFindHotelsToggle
          checked={findHotelsAtDestination}
          onChange={onFindHotelsAtDestinationChange}
        />
      ) : (
        <span className="hidden sm:block" aria-hidden />
      )}
      <SearchOpenBookingToggle
        checked={openBookingInNewTab}
        onChange={onOpenBookingInNewTabChange}
        className="shrink-0 sm:ml-auto"
      />
    </div>
  );
}
