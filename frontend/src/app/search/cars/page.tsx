import { Suspense } from "react";
import { CarRouteSearchClient } from "@/app/search/cars/CarRouteSearchClient";

export default function CarSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-slate-50 dark:bg-black" aria-busy="true" />
      }
    >
      <CarRouteSearchClient />
    </Suspense>
  );
}
