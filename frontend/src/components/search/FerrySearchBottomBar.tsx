"use client";

import { FerryTripTypeRadios } from "@/components/ferries/FerryTripTypeRadios";
import { SearchOpenBookingToggle } from "@/components/search/SearchOpenBookingToggle";
import type { FerryTripType } from "@/lib/ferrySearch";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export function FerrySearchBottomBar({
  tripType,
  onTripTypeChange,
  openBookingInNewTab,
  onOpenBookingInNewTabChange,
  className
}: {
  tripType: FerryTripType;
  onTripTypeChange: (tripType: FerryTripType) => void;
  openBookingInNewTab: boolean;
  onOpenBookingInNewTabChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6",
        className
      )}
    >
      <FerryTripTypeRadios value={tripType} onChange={onTripTypeChange} />
      <SearchOpenBookingToggle
        checked={openBookingInNewTab}
        onChange={onOpenBookingInNewTabChange}
        className="shrink-0 sm:ml-auto"
      />
    </div>
  );
}
