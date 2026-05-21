"use client";

import { CarSearchDriverAgeBar } from "@/components/search/CarSearchDriverAgeBar";
import { SearchOpenBookingToggle } from "@/components/search/SearchOpenBookingToggle";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export function CarSearchBottomBar({
  driverAge,
  onDriverAgeChange,
  openBookingInNewTab,
  onOpenBookingInNewTabChange,
  className
}: {
  driverAge: string;
  onDriverAgeChange: (value: string) => void;
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
      <CarSearchDriverAgeBar driverAge={driverAge} onDriverAgeChange={onDriverAgeChange} />
      <SearchOpenBookingToggle
        checked={openBookingInNewTab}
        onChange={onOpenBookingInNewTabChange}
        className="shrink-0 sm:ml-auto"
      />
    </div>
  );
}
