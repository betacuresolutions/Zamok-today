"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { HotelSearch } from "@/components/HotelSearch";
import { SiteFooter } from "@/components/SiteFooter";
import { Topbar } from "@/components/Topbar";
import { useT } from "@/i18n/I18nProvider";
import { useAppSelector } from "@/store/hooks";

export function HotelRouteSearchClient() {
  const searchParams = useSearchParams();
  const t = useT();
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const persisted = useAppSelector((s) => s.hotels.searchForm);
  const lastQuery = useAppSelector((s) => s.hotels.lastQuery);

  const destination = useMemo(
    () =>
      searchParams.get("destination")?.trim() ||
      lastQuery?.destination?.trim() ||
      persisted.destination.trim() ||
      "",
    [searchParams, lastQuery, persisted.destination]
  );
  const checkIn = useMemo(
    () => searchParams.get("checkIn")?.trim() || lastQuery?.checkIn || persisted.checkIn || "",
    [searchParams, lastQuery, persisted.checkIn]
  );
  const checkOut = useMemo(
    () => searchParams.get("checkOut")?.trim() || lastQuery?.checkOut || persisted.checkOut || "",
    [searchParams, lastQuery, persisted.checkOut]
  );
  const guests = useMemo(() => {
    const adults = Number(searchParams.get("adults") || lastQuery?.adults || persisted.guests.adults);
    const children = Number(searchParams.get("children") || lastQuery?.children || persisted.guests.children);
    const rooms = Number(searchParams.get("rooms") || lastQuery?.rooms || persisted.guests.rooms);
    return {
      adults: Number.isFinite(adults) && adults > 0 ? adults : 2,
      children: Number.isFinite(children) && children >= 0 ? children : 0,
      rooms: Number.isFinite(rooms) && rooms > 0 ? rooms : 1
    };
  }, [searchParams, lastQuery, persisted.guests]);

  return (
    <main className="min-h-dvh bg-slate-50 dark:bg-black">
      <Topbar />
      <section className="overflow-visible border-b border-slate-200 bg-brand-600 dark:border-white/10 dark:bg-black">
        <div className="mx-auto w-full max-w-[1220px] overflow-visible px-4 py-4 md:py-6">
          <HotelSearch
            usePersistedSearchForm
            forceCompact
            initialDestination={destination}
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
            initialGuests={guests}
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1240px] px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {destination
            ? tr("search.hotels.resultsFor", "Hotels in {{place}}").replace("{{place}}", destination)
            : t("search.hotels.resultsTitle")}
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-white/60">
          {t("search.hotels.resultsComingSoon")}
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
