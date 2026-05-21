"use client";

import { useT } from "@/i18n/I18nProvider";
import type { FerryTripType } from "@/lib/ferrySearch";

const RADIO_NAME = "ferry-trip-type";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export function FerryTripTypeRadios({
  value,
  onChange,
  className
}: {
  value: FerryTripType;
  onChange: (tripType: FerryTripType) => void;
  className?: string;
}) {
  const t = useT();

  return (
    <div
      className={cn("flex flex-wrap items-center gap-5", className)}
      role="radiogroup"
      aria-label={t("search.ferries.tripType")}
    >
      {(["oneWay", "roundTrip"] as const).map((trip) => {
        const selected = value === trip;
        const label =
          trip === "oneWay" ? t("search.ferries.oneWay") : t("search.ferries.roundTrip");
        return (
          <label key={trip} className="inline-flex cursor-pointer items-center gap-2.5">
            <input
              type="radio"
              name={RADIO_NAME}
              checked={selected}
              onChange={() => onChange(trip)}
              className="sr-only"
            />
            <span
              className={cn(
                "grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 transition",
                selected
                  ? "border-brand-600 bg-brand-600"
                  : "border-white/50 bg-transparent dark:border-white/40"
              )}
              aria-hidden
            >
              {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
            </span>
            <span className="text-sm font-semibold text-white">{label}</span>
          </label>
        );
      })}
    </div>
  );
}
