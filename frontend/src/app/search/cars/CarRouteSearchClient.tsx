"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CarSearch } from "@/components/CarSearch";
import { SiteFooter } from "@/components/SiteFooter";
import { Topbar } from "@/components/Topbar";
import { useT } from "@/i18n/I18nProvider";
import { DEFAULT_DRIVER_AGE } from "@/lib/carSearch";
import { useAppSelector } from "@/store/hooks";

export function CarRouteSearchClient() {
  const searchParams = useSearchParams();
  const t = useT();
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const persisted = useAppSelector((s) => s.cars.searchForm);
  const lastQuery = useAppSelector((s) => s.cars.lastQuery);

  const initialForm = useMemo(
    () => ({
      pickUpCity:
        searchParams.get("pickUp")?.trim() || lastQuery?.pickUpCity?.trim() || persisted.pickUpCity || "",
      pickUpSubtitle:
        searchParams.get("pickUpPlace")?.trim() ||
        lastQuery?.pickUpSubtitle?.trim() ||
        persisted.pickUpSubtitle ||
        "",
      dropOffCity:
        searchParams.get("dropOff")?.trim() || lastQuery?.dropOffCity?.trim() || persisted.dropOffCity || "",
      dropOffSubtitle:
        searchParams.get("dropOffPlace")?.trim() ||
        lastQuery?.dropOffSubtitle?.trim() ||
        persisted.dropOffSubtitle ||
        "",
      pickUpDate: searchParams.get("pickUpDate")?.trim() || lastQuery?.pickUpDate || persisted.pickUpDate || "",
      dropOffDate:
        searchParams.get("dropOffDate")?.trim() || lastQuery?.dropOffDate || persisted.dropOffDate || "",
      pickUpTime: searchParams.get("pickUpTime")?.trim() || lastQuery?.pickUpTime || persisted.pickUpTime || "10:30",
      dropOffTime:
        searchParams.get("dropOffTime")?.trim() || lastQuery?.dropOffTime || persisted.dropOffTime || "10:30",
      driverAge:
        searchParams.get("driverAge")?.trim() || lastQuery?.driverAge || persisted.driverAge || DEFAULT_DRIVER_AGE
    }),
    [searchParams, lastQuery, persisted]
  );

  const routeLabel = initialForm.pickUpCity && initialForm.dropOffCity
    ? `${initialForm.pickUpCity} → ${initialForm.dropOffCity}`
    : "";

  return (
    <main className="min-h-dvh bg-slate-50 dark:bg-black">
      <Topbar />
      <section className="overflow-visible border-b border-slate-200 bg-brand-600 dark:border-white/10 dark:bg-black">
        <div className="mx-auto w-full max-w-[1440px] overflow-visible px-4 py-4 md:py-6">
          <CarSearch usePersistedSearchForm forceCompact initialForm={initialForm} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1240px] px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {routeLabel
            ? tr("search.cars.resultsFor", "Car rental: {{route}}").replace("{{route}}", routeLabel)
            : t("search.cars.resultsTitle")}
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-white/60">{t("search.cars.resultsComingSoon")}</p>
      </section>

      <SiteFooter />
    </main>
  );
}
