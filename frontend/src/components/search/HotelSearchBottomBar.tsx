"use client";

import { SearchOpenBookingToggle } from "@/components/search/SearchOpenBookingToggle";
import { TravelForWorkCheckbox } from "@/components/search/TravelForWorkCheckbox";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

/** Checkbox + Booking.com toggle row below the hotel search fields (on brand red). */
export function HotelSearchBottomBar({
  travelForWork,
  onTravelForWorkChange,
  openBookingInNewTab,
  onOpenBookingInNewTabChange,
  className
}: {
  travelForWork: boolean;
  onTravelForWorkChange: (checked: boolean) => void;
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
      <TravelForWorkCheckbox
        variant="onBrand"
        checked={travelForWork}
        onChange={onTravelForWorkChange}
      />
      <SearchOpenBookingToggle
        checked={openBookingInNewTab}
        onChange={onOpenBookingInNewTabChange}
        className="shrink-0 sm:ml-auto"
      />
    </div>
  );
}
