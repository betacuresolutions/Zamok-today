"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BiSolidPlaneAlt } from "react-icons/bi";
import { FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import { DestinationTicketCard } from "@/components/DestinationTicketCard";
import { FlightSearch } from "@/components/FlightSearch";
import { SiteFooter } from "@/components/SiteFooter";
import { Topbar } from "@/components/Topbar";
import { useI18n } from "@/i18n/I18nProvider";
import { buildFlightSearchResultsHref } from "@/lib/siteDefaults";
import type { DestinationTicket } from "@/lib/siteDestinationData";
import type { FlightOffer } from "@/lib/types";
import { env } from "@/lib/env";
import { setFlightSearchForm } from "@/store/flightsSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";


const BLANK_CITY_IMAGE = "/Images/blank.webp";

type DestinationCountryPayload = {
  slug: string;
  country: string;
  regionCode: string;
  currency: string;
  cities: Array<{
    name: string;
    fromPrice: number;
    destinationIata?: string;
    image?: string;
  }>;
  tickets: DestinationTicket[];
};

function CityImageCard({
  src,
  alt,
  sizes = "(max-width: 640px) 100vw, 25vw"
}: {
  src?: string;
  alt: string;
  sizes?: string;
}) {
  const [imageSrc, setImageSrc] = useState<string>(src || BLANK_CITY_IMAGE);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageSrc(src || BLANK_CITY_IMAGE);
    setImageLoaded(false);
  }, [src]);

  return (
    <div className="relative h-full w-full">
      {!imageLoaded ? <div className="absolute inset-0 z-[1] animate-pulse bg-slate-200 dark:bg-white/10" /> : null}
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className={[
          "object-cover transition duration-300 group-hover:scale-105",
          imageLoaded ? "opacity-100" : "opacity-0"
        ].join(" ")}
        sizes={sizes}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          if (imageSrc !== BLANK_CITY_IMAGE) setImageSrc(BLANK_CITY_IMAGE);
        }}
      />
    </div>
  );
}

function formatPriceByCurrency(amount: number, currencyCode: string): string {
  const normalized = String(currencyCode || "USD")
    .trim()
    .toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalized,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${normalized} ${Math.round(amount)}`;
  }
}

export default function DestinationCountryPage() {
  const dispatch = useAppDispatch();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0]! : "";
  const { t } = useI18n();
  const localeCountry = useAppSelector((s) => s.locale.country);
  const currencyCode = useAppSelector((s) => s.locale.currency);
  const originIata = useAppSelector((s) => s.locale.originIata);
  const fromCity = useAppSelector((s) => s.flights.searchForm.from);
  const [data, setData] = useState<DestinationCountryPayload | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);

  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };

  const [cityStart, setCityStart] = useState(0);
  const [visibleCities, setVisibleCities] = useState(4);
  const [filterCity, setFilterCity] = useState("");
  const [allCitiesOpen, setAllCitiesOpen] = useState(false);
  const [ticketStart, setTicketStart] = useState(0);
  const [cityRouteTickets, setCityRouteTickets] = useState<DestinationTicket[] | null>(null);
  const [isTicketLoading, setIsTicketLoading] = useState(false);
  const visibleTickets = 2;
  const effectiveCurrency = data?.currency || currencyCode;

  useEffect(() => {
    function sync() {
      const w = window.innerWidth;
      if (w >= 1024) setVisibleCities(4);
      else if (w >= 640) setVisibleCities(2);
      else setVisibleCities(1);
    }
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const baseFilteredTickets = useMemo(() => {
    if (!data || !filterCity) return [];
    return data.tickets.filter((x) => x.toCity === filterCity);
  }, [data, filterCity]);
  const filteredTickets = useMemo(() => {
    if (filterCity && cityRouteTickets && cityRouteTickets.length > 0) return cityRouteTickets;
    return baseFilteredTickets;
  }, [baseFilteredTickets, cityRouteTickets, filterCity]);
  const availableCityNames = useMemo(() => {
    if (!data) return new Set<string>();
    return new Set(
      data.tickets
        .map((ticket) => String(ticket.toCity || "").trim())
        .filter(Boolean)
    );
  }, [data]);
  const filteredCities = useMemo(() => {
    if (!data) return [];
    return data.cities.filter((city) => availableCityNames.has(String(city.name || "").trim()));
  }, [availableCityNames, data]);

  const maxCityStart = useMemo(() => {
    return Math.max(0, filteredCities.length - visibleCities);
  }, [filteredCities.length, visibleCities]);

  const maxTicketStart = useMemo(
    () => Math.max(0, filteredTickets.length - visibleTickets),
    [filteredTickets.length, visibleTickets]
  );

  useEffect(() => {
    if (cityStart > maxCityStart) setCityStart(maxCityStart);
  }, [maxCityStart, cityStart]);

  useEffect(() => {
    if (ticketStart > maxTicketStart) setTicketStart(maxTicketStart);
  }, [maxTicketStart, ticketStart]);

  useEffect(() => {
    setTicketStart(0);
  }, [filterCity, slug]);
  useEffect(() => {
    if (!filterCity) {
      setCityRouteTickets(null);
      setIsTicketLoading(false);
      return;
    }
    const from = String(fromCity || "").trim();
    const to = String(filterCity || "").trim();
    if (!from || !to) {
      setCityRouteTickets(null);
      setIsTicketLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsTicketLoading(true);
    void fetch(`${env.apiBaseUrl}/api/flights/search?currency=${encodeURIComponent(String(effectiveCurrency || "USD"))}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        from,
        to,
        passengers: 1,
        cabin: "economy"
      })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`route search failed (${res.status})`);
        return (await res.json()) as { offers?: FlightOffer[] };
      })
      .then((payload) => {
        if (controller.signal.aborted) return;
        const offers = Array.isArray(payload?.offers) ? payload.offers : [];
        const mapped = offers.map((offer, idx) => {
          const first = offer.segments[0];
          const depart = first ? new Date(first.departAt) : new Date();
          const arrive = first ? new Date(first.arriveAt) : new Date();
          const dateLabel = depart.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
          const timeRange = `${depart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — ${arrive.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
          const totalDuration = offer.segments.reduce((sum, seg) => sum + (Number(seg.durationMinutes) || 0), 0);
          const totalStops = offer.segments.reduce((sum, seg) => sum + (Number(seg.stops) || 0), 0);
          const hours = Math.floor(totalDuration / 60);
          const mins = totalDuration % 60;
          return {
            id: offer.id || `offer-${idx}`,
            price: offer.price.amount,
            currencyCode: String(offer.price.currency || effectiveCurrency || "USD").toUpperCase(),
            toCity: to,
            dateLabel,
            timeRange,
            durationMeta: `${hours}h ${mins}m · ${totalStops === 0 ? "direct" : `${totalStops} stop${totalStops > 1 ? "s" : ""}`}`,
            layoverText: totalStops > 0 ? `${totalStops} stop${totalStops > 1 ? "s" : ""}` : undefined
          } satisfies DestinationTicket;
        });
        setCityRouteTickets(mapped);
        setIsTicketLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setCityRouteTickets(null);
        setIsTicketLoading(false);
      });

    return () => {
      controller.abort();
      setIsTicketLoading(false);
    };
  }, [effectiveCurrency, filterCity, fromCity]);
  useEffect(() => {
    const firstCity = filteredCities[0]?.name || "";
    if (!firstCity) {
      if (filterCity) setFilterCity("");
      return;
    }
    if (!filterCity) {
      setFilterCity(firstCity);
      return;
    }
    const exists = filteredCities.some((city) => city.name === filterCity);
    if (!exists) setFilterCity(firstCity);
  }, [filterCity, filteredCities]);

  useEffect(() => {
    if (!allCitiesOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [allCitiesOpen]);

  useEffect(() => {
    if (!allCitiesOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAllCitiesOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [allCitiesOpen]);

  useEffect(() => {
    const toValue = String(data?.country || "").trim();
    if (!toValue) return;
    dispatch(setFlightSearchForm({ to: toValue }));
  }, [data?.country, dispatch]);

  useEffect(() => {
    if (!slug) return;
    const url = new URL(`${env.apiBaseUrl}/api/flights/destination-country`);
    url.searchParams.set("slug", slug.toLowerCase());
    const regionCode = String(searchParams.get("rc") || "")
      .trim()
      .toUpperCase();
    if (/^[A-Z]{2}$/.test(regionCode)) {
      url.searchParams.set("regionCode", regionCode);
    }
    const originCountry = String(localeCountry || "TR")
      .trim()
      .toUpperCase();
    if (/^[A-Z]{2}$/.test(originCountry)) {
      url.searchParams.set("originCountry", originCountry);
    }
    const oi = String(originIata || "")
      .trim()
      .toUpperCase();
    if (/^[A-Z]{3}$/.test(oi)) {
      url.searchParams.set("originIata", oi);
    }
    if (currencyCode) {
      url.searchParams.set("currency", String(currencyCode).toLowerCase());
    }

    const controller = new AbortController();
    setData(null);
    setIsLoaded(false);
    setIsNotFound(false);
    void fetch(url.toString(), { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const err = new Error(`destination-country failed (${res.status})`) as Error & { status?: number };
          err.status = res.status;
          throw err;
        }
        return (await res.json()) as DestinationCountryPayload;
      })
      .then((payload) => {
        if (controller.signal.aborted) return;
        setData(payload);
        const firstCity = payload?.cities?.[0]?.name ? String(payload.cities[0].name) : "";
        setFilterCity(firstCity);
        setCityStart(0);
        setTicketStart(0);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const status = typeof err === "object" && err && "status" in err ? Number((err as { status?: number }).status) : 0;
        setIsNotFound(status === 404);
        setData(null);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsLoaded(true);
      });
    return () => controller.abort();
  }, [slug, searchParams, localeCountry, originIata, currencyCode]);

  if (!data) {
    if (!isLoaded) {
      return (
        <main className="min-h-screen bg-slate-50 dark:bg-black">
          <Topbar />
          <section className="sticky top-14 z-40 shrink-0 bg-brand-600 shadow-sm dark:bg-black lg:top-16">
            <div className="mx-auto w-full max-w-[1440px] px-4 py-2">
              <FlightSearch stickyEnabled={false} forceCompact showBottomActions={false} />
            </div>
          </section>
          <div className="mx-auto w-full max-w-[1240px] px-4 py-8">
            <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200 dark:bg-black dark:ring-white/10">
              <div className="h-8 w-52 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={`city-skeleton-${idx}`} className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/10" />
                ))}
              </div>
            </section>
            <section className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-slate-200 dark:bg-black dark:ring-white/10">
              <div className="h-8 w-56 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
              <div className="mt-4 flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={`ticket-chip-skeleton-${idx}`}
                    className="h-9 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-white/10"
                  />
                ))}
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, idx) => (
                  <div
                    key={`ticket-skeleton-initial-${idx}`}
                    className="h-[140px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/10"
                  />
                ))}
              </div>
            </section>
          </div>
        </main>
      );
    }
    if (isNotFound) {
      notFound();
    }
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-black">
        <Topbar />
        <section className="sticky top-14 z-40 shrink-0 bg-brand-600 shadow-sm dark:bg-black lg:top-16">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-2">
            <FlightSearch stickyEnabled={false} forceCompact showBottomActions={false} />
          </div>
        </section>
        <div className="mx-auto w-full max-w-[1240px] px-4 py-10">
          <section className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 dark:bg-black dark:ring-white/10">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              {tr("common.error", "Something went wrong")}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-white/70">
              {tr("destination.loadFailed", "Could not load destination data. Please try again.")}
            </p>
          </section>
        </div>
      </main>
    );
  }

  const showCitySlider = filteredCities.length > visibleCities;
  const showTicketSlider = filteredTickets.length > visibleTickets;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black">
      <Topbar />
      <section className="sticky top-14 z-40 shrink-0 bg-brand-600 shadow-sm dark:bg-black lg:top-16">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-2">
          <FlightSearch
            stickyEnabled={false}
            forceCompact
            showBottomActions={false}
          />
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1240px] px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <span className={`fi fi-${data.regionCode} h-[30px] w-[40px] shrink-0`} />
          <h1 className={`text-3xl font-bold text-slate-900 dark:text-white md:text-4xl`}>
            {data.country}
          </h1>
        </div>

        <section className="mb-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-black dark:ring-white/10 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className={`text-2xl font-semibold text-slate-900 dark:text-white`}>
              {tr("destination.citiesTitle", "Cities")}
            </h2>
            {showCitySlider ? (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCityStart((s) => Math.max(0, s - 1))}
                  disabled={cityStart === 0}
                  className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:text-white/80 dark:hover:bg-white/10"
                  aria-label="Previous cities"
                >
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCityStart((s) => Math.min(maxCityStart, s + 1))}
                  disabled={cityStart >= maxCityStart}
                  className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:text-white/80 dark:hover:bg-white/10"
                  aria-label="Next cities"
                >
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden">
            {showCitySlider ? (
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${cityStart * (100 / visibleCities)}%)` }}
              >
                {filteredCities.map((city) => (
                  <Link
                    key={city.name}
                    href={buildFlightSearchResultsHref(city.name)}
                    className="block shrink-0 px-2 cursor-pointer"
                    style={{ width: `${100 / visibleCities}%` }}
                  >
                    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-black">
                      <div className="relative h-44">
                        <CityImageCard src={city.image} alt={city.name} />
                      </div>
                      <div className="p-4">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{city.name}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-white/70">
                          <span className="inline-flex items-center gap-2">
                            <BiSolidPlaneAlt className="h-4 w-4" />
                            {tr("common.from", "from")}{" "}
                            <span className="font-semibold text-slate-800 dark:text-white">{formatPriceByCurrency(city.fromPrice, effectiveCurrency)}</span>
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {filteredCities.map((city) => (
                  <Link
                    key={city.name}
                    href={buildFlightSearchResultsHref(city.name)}
                    className="block min-w-0 cursor-pointer"
                  >
                    <article className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-black">
                      <div className="relative h-44">
                        <CityImageCard src={city.image} alt={city.name} />
                      </div>
                      <div className="p-4">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{city.name}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-white/70">
                          <span className="inline-flex items-center gap-2">
                            <BiSolidPlaneAlt className="h-4 w-4" />
                            {tr("common.from", "from")}{" "}
                            <span className="font-semibold text-slate-800 dark:text-white">{formatPriceByCurrency(city.fromPrice, effectiveCurrency)}</span>
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {showCitySlider ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => setAllCitiesOpen(true)}
                className="w-full max-w-md rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15 md:w-auto md:px-12"
              >
                {tr("destination.showAll", "Show all")}
              </button>
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-black dark:ring-white/10 md:p-6">
          <div className="mb-4 flex items-center gap-3">
            <h2 className={`text-2xl font-semibold text-slate-900 dark:text-white`}>
              {tr("destination.cheapestTitle", "Cheapest tickets")}
            </h2>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {filteredCities.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setFilterCity(c.name)}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                  filterCity === c.name
                    ? "bg-brand-600 text-white ring-brand-600"
                    : "bg-slate-100 text-slate-800 ring-slate-200 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
                ].join(" ")}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="pb-2 pt-1">
            {isTicketLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: visibleTickets }).map((_, idx) => (
                  <div
                    key={`ticket-skeleton-${idx}`}
                    className="h-[140px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/10"
                  />
                ))}
              </div>
            ) : showTicketSlider ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTicketStart((s) => Math.max(0, s - 1))}
                  disabled={ticketStart === 0}
                  className="absolute left-0 top-1/2 z-10 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-sm transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-brand-500/40 dark:bg-black dark:text-brand-300 dark:hover:bg-brand-950/30"
                  aria-label={tr("destination.ticketsPrev", "Previous tickets")}
                >
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTicketStart((s) => Math.min(maxTicketStart, s + 1))}
                  disabled={ticketStart >= maxTicketStart}
                  className="absolute right-0 top-1/2 z-10 grid h-9 w-9 translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-sm transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-brand-500/40 dark:bg-black dark:text-brand-300 dark:hover:bg-brand-950/30"
                  aria-label={tr("destination.ticketsNext", "Next tickets")}
                >
                  <FiChevronRight className="h-5 w-5" />
                </button>
                <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${ticketStart * (100 / visibleTickets)}%)` }}
                >
                  {filteredTickets.map((ticket) => (
                    <div key={ticket.id} className="shrink-0 px-1.5 sm:px-2" style={{ width: `${100 / visibleTickets}%` }}>
                      <DestinationTicketCard ticket={ticket} fromCity={fromCity} currencyCode={effectiveCurrency} directLabel={tr("destination.ticketDirect", "Direct")} />
                    </div>
                  ))}
                </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filteredTickets.map((ticket) => (
                  <DestinationTicketCard key={ticket.id} ticket={ticket} fromCity={fromCity} currencyCode={effectiveCurrency} directLabel={tr("destination.ticketDirect", "Direct")} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {allCitiesOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="destination-all-cities-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            aria-label={tr("destination.closeAllCities", "Close")}
            onClick={() => setAllCitiesOpen(false)}
          />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-white/10 sm:max-h-[85vh] sm:rounded-3xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/10 sm:px-6">
              <h2
                id="destination-all-cities-title"
                className={`text-xl font-bold text-slate-900 dark:text-white sm:text-2xl`}
              >
                {tr("destination.allCitiesTitle", "All cities")} — {data.country}
              </h2>
              <button
                type="button"
                onClick={() => setAllCitiesOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
                aria-label={tr("destination.closeAllCities", "Close")}
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCities.map((city) => (
                  <Link
                    key={city.name}
                    href={buildFlightSearchResultsHref(city.name)}
                    aria-label={`${city.name}, ${tr("common.from", "from")} ${formatPriceByCurrency(city.fromPrice, effectiveCurrency)}`}
                    onClick={() => setAllCitiesOpen(false)}
                    className="block text-left"
                  >
                    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:ring-2 hover:ring-brand-500/30 dark:border-white/10 dark:bg-black">
                      <div className="relative h-36">
                        <CityImageCard src={city.image} alt="" sizes="(max-width: 640px) 100vw, 33vw" />
                      </div>
                      <div className="p-3 sm:p-4">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{city.name}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-white/70">
                          <span className="inline-flex items-center gap-2">
                            <BiSolidPlaneAlt className="h-4 w-4" />
                            {tr("common.from", "from")}{" "}
                            <span className="font-semibold text-slate-800 dark:text-white">{formatPriceByCurrency(city.fromPrice, effectiveCurrency)}</span>
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <SiteFooter />
    </main>
  );
}
