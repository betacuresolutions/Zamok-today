import { Suspense } from "react";
import { HotelRouteSearchClient } from "./HotelRouteSearchClient";

export default function HotelRouteSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-slate-50 dark:bg-black" aria-busy="true" />
      }
    >
      <HotelRouteSearchClient />
    </Suspense>
  );
}
