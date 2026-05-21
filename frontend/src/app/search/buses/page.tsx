import { Suspense } from "react";
import { BusRouteSearchClient } from "@/app/search/buses/BusRouteSearchClient";

export default function BusSearchPage() {
  return (
    <Suspense fallback={null}>
      <BusRouteSearchClient />
    </Suspense>
  );
}
