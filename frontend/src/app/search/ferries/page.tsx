import { Suspense } from "react";
import { FerryRouteSearchClient } from "./FerryRouteSearchClient";

export default function FerrySearchPage() {
  return (
    <Suspense fallback={null}>
      <FerryRouteSearchClient />
    </Suspense>
  );
}
