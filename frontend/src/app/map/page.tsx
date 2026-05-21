"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BiSolidPlaneAlt } from "react-icons/bi";
import { FiChevronLeft, FiChevronRight, FiMapPin, FiMaximize2, FiMinimize2 } from "react-icons/fi";
import { LuArrowDownUp } from "react-icons/lu";
import { FlightSearch } from "@/components/FlightSearch";
import { Topbar } from "@/components/Topbar";
import { useI18n } from "@/i18n/I18nProvider";
import { useTheme } from "@/theme/ThemeProvider";
import { useAppSelector } from "@/store/hooks";
import { env } from "@/lib/env";
import { buildFlightSearchResultsHref } from "@/lib/siteDefaults";

const LeafletMap = dynamic(() => import("@/components/map/LeafletMap").then((m) => m.LeafletMap), { ssr: false });
const BLANK_CITY_IMAGE = "/Images/blank.webp";

type MapCity = {
  name: string;
  fromPrice: number;
  popularity?: number;
  isDirect?: boolean;
  hasBaggage?: boolean;
  lat: number;
  lng: number;
  image: string;
  destinationIata?: string;
};

type RealMapCountryGroup = {
  country: string;
  regionCode: string;
  cities: MapCity[];
};

type OriginPoint = {
  name: string;
  lat: number;
  lng: number;
};

export default function MapPage() {
  const router = useRouter();
  const { lang, t } = useI18n();
  const { resolved } = useTheme();
  const currencyCode = useAppSelector((s) => s.locale.currency);
  const originIata = useAppSelector((s) => s.locale.originIata);
  const originCity = useAppSelector((s) => s.flights.searchForm.from);
  const searchFromIata = useAppSelector((s) => s.flights.searchForm.fromIata);
  const searchFrom = useAppSelector((s) => s.flights.searchForm.from);
  const isDark = resolved === "dark";
  const [groups, setGroups] = useState<RealMapCountryGroup[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileFullMapOpen, setMobileFullMapOpen] = useState(false);
  const [focusedCountry, setFocusedCountry] = useState<string | null>(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"popularity" | "price">("popularity");
  const [directOnly, setDirectOnly] = useState(false);
  const [baggageOnly, setBaggageOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const [visibleGroupCount, setVisibleGroupCount] = useState(10);
  const [startByCountry, setStartByCountry] = useState<Record<string, number>>({});
  const [originPoint, setOriginPoint] = useState<OriginPoint | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const formatPriceByCurrency = useCallback(
    (amount: number) => {
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
    },
    [currencyCode]
  );
  const sortedGroups = useMemo(() => {
    return groups
      .map((group) => {
        const cities = [...group.cities].sort((a, b) => {
          if (sortBy === "price") return a.fromPrice - b.fromPrice;
          const pa = a.popularity ?? 0;
          const pb = b.popularity ?? 0;
          if (pb !== pa) return pb - pa;
          return a.fromPrice - b.fromPrice;
        });
        return {
          ...group,
          cities,
          _popularity: cities.reduce((sum, c) => sum + (c.popularity ?? 0), 0),
          _minPrice: cities[0]?.fromPrice ?? Number.POSITIVE_INFINITY
        };
      })
      .sort((a, b) => {
        if (sortBy === "price") return a._minPrice - b._minPrice;
        if (b._popularity !== a._popularity) return b._popularity - a._popularity;
        return a.country.localeCompare(b.country);
      });
  }, [groups, sortBy]);
  const filteredGroups = useMemo(() => {
    return sortedGroups
      .map((group) => {
        const cities = group.cities.filter((city) => {
          if (directOnly && !city.isDirect) return false;
          if (baggageOnly && !city.hasBaggage) return false;
          return true;
        });
        return {
          ...group,
          cities
        };
      })
      .filter((group) => group.cities.length > 0);
  }, [sortedGroups, directOnly, baggageOnly]);
  const focusedGroup = useMemo(
    () => (focusedCountry ? filteredGroups.find((g) => g.regionCode === focusedCountry) || null : null),
    [focusedCountry, filteredGroups]
  );
  const listGroups = focusedGroup ? [focusedGroup] : filteredGroups.slice(0, visibleGroupCount);
  const mapPoints = useMemo(() => {
    const source = focusedGroup ? [focusedGroup] : filteredGroups.slice(0, visibleGroupCount);
    return source.flatMap((g) =>
      g.cities.map((c) => ({
        name: c.name,
        price: c.fromPrice,
        popularity: c.popularity ?? 0,
        lat: c.lat,
        lng: c.lng
      }))
    );
  }, [focusedGroup, filteredGroups, visibleGroupCount]);
  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([String(lang || "en")], { type: "region" });
    } catch {
      return new Intl.DisplayNames(["en"], { type: "region" });
    }
  }, [lang]);
  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const originCityLabel = useMemo(() => {
    const city = String(originCity || "").trim();
    if (city) return city;
    const iata = String(originIata || "").trim().toUpperCase();
    return /^[A-Z]{3}$/.test(iata) ? iata : "";
  }, [originCity, originIata]);
  const parseWhereAmICoordinates = useCallback((raw: unknown) => {
    const text = String(raw || "").trim();
    if (!text.includes(":")) return null;
    const [lonRaw, latRaw] = text.split(":");
    const lat = Number(latRaw);
    const lng = Number(lonRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }, []);

  const openRouteResults = useCallback(
    (cityName: string) => {
      router.push(buildFlightSearchResultsHref(cityName, searchFrom));
    },
    [router, searchFrom]
  );

  function MapCityCard({
    city,
    className = "block min-w-0 cursor-pointer",
    sizes = "(max-width: 640px) 100vw, 25vw",
    style
  }: {
    city: MapCity;
    className?: string;
    sizes?: string;
    style?: CSSProperties;
  }) {
    const [imageSrc, setImageSrc] = useState<string>(city.image || BLANK_CITY_IMAGE);
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
      setImageSrc(city.image || BLANK_CITY_IMAGE);
      setImageLoaded(false);
    }, [city.image]);

    return (
      <Link href={buildFlightSearchResultsHref(city.name, searchFrom)} className={className} style={style}>
        <article className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-black">
          <div className="relative h-44">
            {!imageLoaded ? <div className="absolute inset-0 z-[1] animate-pulse bg-slate-200 dark:bg-white/10" /> : null}
            <Image
              src={imageSrc}
              alt={city.name}
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
          <div className="p-4">
            <div className="truncate text-base text-slate-900 dark:text-white">{city.name}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-white/70">
              <span className="inline-flex items-center gap-2">
                <BiSolidPlaneAlt className="h-4 w-4" />
                {tr("common.from", "from")}{" "}
                <span className="font-semibold text-slate-700 dark:text-white">{formatPriceByCurrency(city.fromPrice)}</span>
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  useEffect(() => {
    function syncVisibleCount() {
      const w = window.innerWidth;
      setIsMobileViewport(w < 768);
      if (w < 768) {
        setVisibleCount(2);
        return;
      }
      setVisibleCount(mapExpanded ? 2 : 4);
    }
    syncVisibleCount();
    window.addEventListener("resize", syncVisibleCount);
    return () => window.removeEventListener("resize", syncVisibleCount);
  }, [mapExpanded]);

  useEffect(() => {
    setStartByCountry((prev) => {
      const next: Record<string, number> = {};
      for (const g of groups) {
        const maxStart = Math.max(0, g.cities.length - visibleCount);
        next[g.country] = Math.min(prev[g.country] ?? 0, maxStart);
      }
      return next;
    });
  }, [visibleCount]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!sortMenuRef.current) return;
      if (!sortMenuRef.current.contains(e.target as Node)) setSortMenuOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    if (!mobileFullMapOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileFullMapOpen]);

  useEffect(() => {
    if (focusedGroup) return;
    if (!isDataLoaded) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((entry) => entry.isIntersecting);
        if (!hit) return;
        setVisibleGroupCount((prev) => Math.min(filteredGroups.length, prev + 10));
      },
      { root: null, rootMargin: "300px 0px", threshold: 0.01 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [focusedGroup, isDataLoaded, filteredGroups.length]);

  useEffect(() => {
    if (!focusedCountry) return;
    const exists = filteredGroups.some((group) => group.regionCode === focusedCountry);
    if (!exists) setFocusedCountry(null);
  }, [focusedCountry, filteredGroups]);

  useEffect(() => {
    const url = new URL(`${env.apiBaseUrl}/api/flights/map-data`);
    const origin = String(searchFromIata || originIata || "")
      .trim()
      .toUpperCase();
    if (/^[A-Z]{3}$/.test(origin)) {
      url.searchParams.set("origin", origin);
    }
    if (currencyCode) {
      url.searchParams.set("currency", String(currencyCode).toLowerCase());
    }
    setIsDataLoaded(false);
    void fetch(url.toString(), { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`map data failed (${res.status})`);
        return (await res.json()) as { countries?: RealMapCountryGroup[] };
      })
      .then((payload) => {
        const apiGroups = Array.isArray(payload?.countries) ? payload.countries : [];
        setGroups(apiGroups);
        setVisibleGroupCount(10);
        setStartByCountry({});
        setFocusedCountry(null);
      })
      .catch(() => {
        setGroups([]);
      })
      .finally(() => {
        setIsDataLoaded(true);
      });
  }, [currencyCode, originIata, searchFromIata]);

  useEffect(() => {
    const url = new URL(`${env.apiBaseUrl}/api/locale/whereami`);
    url.searchParams.set("locale", String(lang || "en"));
    void fetch(url.toString(), { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`whereami failed (${res.status})`);
        return (await res.json()) as {
          cityName?: string | null;
          cityIata?: string | null;
          coordinates?: string | null;
        };
      })
      .then((payload) => {
        const coords = parseWhereAmICoordinates(payload?.coordinates);
        if (!coords) return;
        const name =
          String(payload?.cityName || "").trim() ||
          String(originCityLabel || "").trim() ||
          String(payload?.cityIata || "").trim().toUpperCase() ||
          "Origin";
        setOriginPoint({
          name,
          lat: coords.lat,
          lng: coords.lng
        });
      })
      .catch(() => {
        setOriginPoint(null);
      });
  }, [lang, originCityLabel, parseWhereAmICoordinates]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black">
      <Topbar />
      <section className="sticky top-14 z-40 shrink-0 bg-brand-600 shadow-sm dark:bg-black lg:top-16">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-2">
          <FlightSearch
            stickyEnabled={false}
            forceCompact
            showBottomActions={false}
            initialTo={tr("search.anywhere", "Anywhere")}
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div
            className={[
              "transition-all duration-500 ease-out",
              mapExpanded ? "lg:w-1/3" : "lg:w-2/3"
            ].join(" ")}
          >
            {focusedGroup ? (
              <div>
                <button
                  type="button"
                  onClick={() => setFocusedCountry(null)}
                  className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-transparent px-4 py-2 text-sm font-semibold text-brand-600 ring-1 ring-brand-500 transition hover:bg-brand-50 dark:text-white dark:ring-white/25 dark:hover:bg-white/10"
                >
                  <FiChevronLeft className="h-4 w-4" />
                  {tr("map.allCountries", "All countries")}
                </button>
                <div className="mt-2 flex items-center gap-3">
                  <span className={`fi fi-${focusedGroup.regionCode} h-6 w-6`} />
                  <div className={`text-4xl font-bold text-slate-900 dark:text-white`}>
                    {regionNames.of(focusedGroup.regionCode.toUpperCase()) || focusedGroup.country}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`text-3xl font-bold text-slate-900 dark:text-white`}>
                {tr("search.anywhere", "Anywhere")}
              </div>
            )}
            <div className="z-30 bg-slate-50 pt-5 pb-4 dark:bg-black">
              <div className="flex flex-wrap items-center gap-2">
                <div ref={sortMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setSortMenuOpen((v) => !v)}
                    className="rounded-2xl bg-white px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white/80 dark:ring-white/15"
                    aria-expanded={sortMenuOpen}
                    aria-haspopup="menu"
                  >
                    <span className="flex flex-col items-center leading-none">
                      <LuArrowDownUp className="h-5 w-5" />
                    </span>
                  </button>
                  {sortMenuOpen ? (
                    <div className="absolute left-0 top-[52px] w-[250px] rounded-3xl bg-white p-2 shadow-xl ring-1 ring-slate-200 dark:bg-black dark:ring-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy("popularity");
                          setSortMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-[14px] text-slate-900 hover:bg-slate-50 dark:text-white dark:hover:bg-white/10"
                      >
                        <span className={["h-4 w-4 rounded-full ring-1", sortBy === "popularity" ? "bg-blue-500 ring-blue-500" : "ring-slate-300 dark:ring-white/30"].join(" ")} />
                        {tr("map.sort.popularity", "Popularity")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy("price");
                          setSortMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-[14px] text-slate-900 hover:bg-slate-50 dark:text-white dark:hover:bg-white/10"
                      >
                        <span className={["h-4 w-4 rounded-full ring-1", sortBy === "price" ? "bg-blue-500 ring-blue-500" : "ring-slate-300 dark:ring-white/30"].join(" ")} />
                        {tr("map.sort.price", "Price")}
                      </button>
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setDirectOnly((v) => !v)}
                  className={[
                    "rounded-2xl px-5 py-1.5 ring-1 transition",
                    directOnly
                      ? "bg-brand-600 text-white ring-brand-600 dark:bg-brand-600 dark:text-white dark:ring-brand-500"
                      : "bg-white text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-white dark:ring-white/15"
                  ].join(" ")}
                >
                  {tr("map.filter.directFlights", "Direct flights")}
                </button>
                <button
                  type="button"
                  onClick={() => setBaggageOnly((v) => !v)}
                  className={[
                    "rounded-2xl px-5 py-1.5 ring-1 transition",
                    baggageOnly
                      ? "bg-brand-600 text-white ring-brand-600 dark:bg-brand-600 dark:text-white dark:ring-brand-500"
                      : "bg-white text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-white dark:ring-white/15"
                  ].join(" ")}
                >
                  {tr("map.filter.baggageIncluded", "Baggage included")}
                </button>
              </div>
            </div>

            <div className="relative h-[80px] py-3 mb-3 rounded-3xl w-full md:hidden">
              <Image
                src={isDark ? "/Images/dark-map1.png" : "/Images/light-map1.png"}
                alt={tr("pricemap.title", "Price map")}
                fill
                className="object-cover rounded-3xl"
                sizes="100vw"
              />
              <div className="absolute inset-0 grid place-items-center">
                <button
                  type="button"
                  onClick={() => setMobileFullMapOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/95 px-6 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 shadow-md dark:bg-black/80 dark:text-white dark:ring-white/20"
                >
                  <FiMapPin className="h-5 w-5" />
                  {tr("map.viewMap", "View map")}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {!isDataLoaded ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <section
                    key={`map-skeleton-${i}`}
                    className="rounded-3xl bg-white p-4 ring-1 ring-slate-200 dark:bg-black dark:ring-white/10"
                  >
                    <div className="h-7 w-40 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                      {Array.from({ length: 4 }).map((__, j) => (
                        <article key={`map-skeleton-card-${i}-${j}`} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                          <div className="h-44 animate-pulse bg-slate-200 dark:bg-white/10" />
                          <div className="space-y-2 p-4">
                            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))
              ) : null}
              {isDataLoaded && listGroups.length === 0 ? (
                <section className="rounded-3xl bg-white p-6 text-sm text-slate-600 ring-1 ring-slate-200 dark:bg-black dark:text-white/70 dark:ring-white/10">
                  {tr("results.none", "No offers found.")}
                </section>
              ) : null}
              {isDataLoaded && listGroups.map((group) => (
                (() => {
                  const start = startByCountry[group.country] ?? 0;
                  const showSlider = group.cities.length > visibleCount;
                  const maxStart = Math.max(0, group.cities.length - visibleCount);
                  const canPrev = start > 0;
                  const canNext = start < maxStart;
                  return (
                    <section
                      key={group.country}
                      className="rounded-3xl bg-white p-4 ring-1 ring-slate-200 dark:bg-black dark:ring-white/10"
                    >
                      {!focusedGroup ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`fi fi-${group.regionCode} h-6 w-6`} />
                            <div className={`text-2xl text-slate-900 dark:text-white`}>
                              {regionNames.of(group.regionCode.toUpperCase()) || group.country}
                            </div>
                          </div>
                          {showSlider ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setStartByCountry((prev) => ({
                                    ...prev,
                                    [group.country]: Math.max(0, (prev[group.country] ?? 0) - 1)
                                  }))
                                }
                                disabled={!canPrev}
                                className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/10 dark:text-white/80"
                              >
                                <FiChevronLeft />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setStartByCountry((prev) => ({
                                    ...prev,
                                    [group.country]: Math.min(maxStart, (prev[group.country] ?? 0) + 1)
                                  }))
                                }
                                disabled={!canNext}
                                className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/10 dark:text-white/80"
                              >
                                <FiChevronRight />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {focusedGroup ? (
                        <div className={["mt-4 grid gap-4", mapExpanded ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"].join(" ")}>
                          {group.cities.map((city) => (
                            <MapCityCard
                              key={`${city.destinationIata || city.name}-${city.lat}-${city.lng}`}
                              city={city}
                              className="block min-w-0 cursor-pointer"
                              sizes={mapExpanded ? "(max-width: 640px) 100vw, 50vw" : "(max-width: 640px) 100vw, 25vw"}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 overflow-hidden">
                          <div
                            className="flex transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(-${start * (100 / visibleCount)}%)` }}
                          >
                            {group.cities.map((city) => (
                              <MapCityCard
                                key={`${city.destinationIata || city.name}-${city.lat}-${city.lng}`}
                                city={city}
                                className="block shrink-0 px-2 cursor-pointer"
                                sizes={mapExpanded ? "(max-width: 640px) 100vw, 50vw" : "(max-width: 640px) 100vw, 25vw"}
                                style={{ width: `${100 / visibleCount}%` }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {!focusedGroup && showSlider ? (
                        <div className="mt-4 flex justify-center">
                          <button
                            type="button"
                            onClick={() => setFocusedCountry(group.regionCode)}
                            className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-100 px-10 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white dark:ring-white/15"
                          >
                            <span className={`text-sm font-semibold text-slate-900 dark:text-white`}>
                              {tr("map.allCities", "All cities")}
                            </span>
                            <FiChevronRight className="ml-4 h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
                    </section>
                  );
                })()
              ))}
              {isDataLoaded && !focusedGroup && visibleGroupCount < filteredGroups.length ? (
                <div ref={loadMoreRef} className="h-16">
                  <div className="mx-auto mt-2 h-8 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
                </div>
              ) : null}
            </div>
          </div>

          <aside
            className={[
              "overflow-visible transition-all duration-500 ease-out hidden md:block",
              mapExpanded ? "lg:w-2/3" : "lg:w-1/3"
            ].join(" ")}
          >
            <div className="sticky top-[170px] h-[calc(100vh-190px)] min-h-[560px]">
              <div
                className={[
                  "relative h-full w-full overflow-hidden rounded-3xl ring-1 ring-slate-200 bg-white dark:bg-black dark:ring-white/10",
                  "transition-[transform,box-shadow] duration-500 ease-out",
                  mapExpanded ? "scale-[1.005] shadow-lg" : "scale-100 shadow-none"
                ].join(" ")}
              >
                <div className="absolute left-4 top-4 z-[1200]">
                  <button
                    type="button"
                    onClick={() => setMapExpanded((v) => !v)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-900 ring-1 ring-slate-300 shadow-md transition hover:bg-slate-50"
                    aria-label={mapExpanded ? tr("map.closeMap", "Close map") : tr("map.openMap", "Open full map")}
                    title={mapExpanded ? tr("map.closeMap", "Close map") : tr("map.openMap", "Open full map")}
                  >
                    {mapExpanded ? <FiMinimize2 className="h-4 w-4" /> : <FiMaximize2 className="h-4 w-4" />}
                  </button>
                </div>

                <div className="relative h-full w-full">
                  <LeafletMap
                    points={mapPoints}
                    refreshKey={`${mapExpanded ? "expanded" : "collapsed"}-${focusedCountry ?? "all"}`}
                    fromLabel={tr("common.from", "from")}
                    currencyCode={currencyCode}
                    originPoint={originPoint}
                    includeOriginInBounds={!focusedGroup}
                    onMarkerClick={(p) => openRouteResults(p.name)}
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>
        
      </section>
      {isMobileViewport && mobileFullMapOpen ? (
        <div className="fixed inset-0 z-[95] bg-slate-100 dark:bg-black md:hidden">
          <div className="relative h-full w-full">
            <LeafletMap
              points={mapPoints}
              refreshKey={`mobile-full-${focusedCountry ?? "all"}`}
              fromLabel={tr("common.from", "from")}
              currencyCode={currencyCode}
              originPoint={originPoint}
              includeOriginInBounds={!focusedGroup}
              onMarkerClick={(p) => openRouteResults(p.name)}
            />
            <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[1400] flex justify-center px-4">
              <button
                type="button"
                onClick={() => setMobileFullMapOpen(false)}
                className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-md font-semibold text-slate-900 ring-1 ring-slate-200 shadow-md dark:bg-black/85 dark:text-white dark:ring-white/20"
              >
                <FiChevronLeft className="h-5 w-5" />
                {tr("map.backToList", "Back to list")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

