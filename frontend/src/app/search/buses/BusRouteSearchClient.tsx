"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { BusSearch } from "@/components/BusSearch";
import { SiteFooter } from "@/components/SiteFooter";
import { Topbar } from "@/components/Topbar";
import { useT } from "@/i18n/I18nProvider";
import { defaultBusDepartYmd } from "@/lib/busSearch";
import { useAppSelector } from "@/store/hooks";

export function BusRouteSearchClient() {
  const searchParams = useSearchParams();
  const t = useT();
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const persisted = useAppSelector((s) => s.buses.searchForm);
  const lastQuery = useAppSelector((s) => s.buses.lastQuery);

  const initialForm = useMemo(
    () => ({
      from: searchParams.get("from")?.trim() || lastQuery?.from?.trim() || persisted.from || "",
      to: searchParams.get("to")?.trim() || lastQuery?.to?.trim() || persisted.to || "",
      departDate:
        searchParams.get("departDate")?.trim() ||
        lastQuery?.departDate ||
        persisted.departDate ||
        defaultBusDepartYmd(),
      findHotelsAtDestination:
        searchParams.get("hotels") === "1" ||
        lastQuery?.findHotelsAtDestination ||
        persisted.findHotelsAtDestination
    }),
    [searchParams, lastQuery, persisted]
  );

  const routeLabel =
    initialForm.from && initialForm.to ? `${initialForm.from} → ${initialForm.to}` : "";

  return (
    <main className="min-h-dvh bg-slate-50 dark:bg-black">
      <Topbar />
      <section className="overflow-visible border-b border-slate-200 bg-brand-600 dark:border-white/10 dark:bg-black">
        <div className="mx-auto w-full max-w-[1440px] overflow-visible px-4 py-4 md:py-6">
          <BusSearch usePersistedSearchForm forceCompact initialForm={initialForm} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1240px] px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {routeLabel
            ? tr("search.buses.resultsFor", "Bus tickets: {{route}}").replace("{{route}}", routeLabel)
            : t("search.buses.resultsTitle")}
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-white/60">{t("search.buses.resultsComingSoon")}</p>
      </section>

      <SiteFooter />
    </main>
  );
}
