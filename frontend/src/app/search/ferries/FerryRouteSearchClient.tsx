"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FerrySearch } from "@/components/FerrySearch";
import { SiteFooter } from "@/components/SiteFooter";
import { Topbar } from "@/components/Topbar";
import { useT } from "@/i18n/I18nProvider";
import {
  defaultFerryDepartYmd,
  defaultFerryReturnYmd,
  parsePassengersFromSearchParams,
  type FerryTripType
} from "@/lib/ferrySearch";
import { useAppSelector } from "@/store/hooks";

function parseTripType(raw: string | null): FerryTripType {
  return raw === "oneWay" ? "oneWay" : "roundTrip";
}

export function FerryRouteSearchClient() {
  const searchParams = useSearchParams();
  const t = useT();
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const persisted = useAppSelector((s) => s.ferries.searchForm);
  const lastQuery = useAppSelector((s) => s.ferries.lastQuery);

  const initialForm = useMemo(() => {
    const tripType = parseTripType(searchParams.get("trip"));
    const departDate =
      searchParams.get("departDate")?.trim() ||
      lastQuery?.departDate ||
      persisted.departDate ||
      defaultFerryDepartYmd();
    const returnDate =
      searchParams.get("returnDate")?.trim() ||
      lastQuery?.returnDate ||
      persisted.returnDate ||
      defaultFerryReturnYmd(departDate);
    const passengers = parsePassengersFromSearchParams(
      searchParams,
      lastQuery?.passengers ?? persisted.passengers
    );

    return {
      tripType,
      from: searchParams.get("from")?.trim() || lastQuery?.from?.trim() || persisted.from || "",
      to: searchParams.get("to")?.trim() || lastQuery?.to?.trim() || persisted.to || "",
      departDate,
      returnDate,
      passengers
    };
  }, [searchParams, lastQuery, persisted]);

  const routeLabel =
    initialForm.from && initialForm.to ? `${initialForm.from} → ${initialForm.to}` : "";

  return (
    <main className="min-h-dvh bg-slate-50 dark:bg-black">
      <Topbar />
      <section className="overflow-visible border-b border-slate-200 bg-brand-600 dark:border-white/10 dark:bg-black">
        <div className="mx-auto w-full max-w-[1440px] overflow-visible px-4 py-4 md:py-6">
          <FerrySearch usePersistedSearchForm forceCompact initialForm={initialForm} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1240px] px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {routeLabel
            ? tr("search.ferries.resultsFor", "Ferry tickets: {{route}}").replace("{{route}}", routeLabel)
            : t("search.ferries.resultsTitle")}
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-white/60">{t("search.ferries.resultsComingSoon")}</p>
      </section>

      <SiteFooter />
    </main>
  );
}
