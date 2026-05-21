"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { searchFlights, setFlightSearchForm } from "@/store/flightsSlice";
import { useT } from "@/i18n/I18nProvider";
import { env } from "@/lib/env";
import { FaBed } from "react-icons/fa6";
import { BiSolidPlaneAlt } from "react-icons/bi";
import { FiCalendar, FiMapPin, FiRepeat, FiSearch, FiShuffle, FiUser, FiX } from "react-icons/fi";
import { TwoMonthDatePicker } from "@/components/date/TwoMonthDatePicker";
import { MobileDateRangePicker } from "@/components/date/MobileDateRangePicker";
import { PassengersPicker } from "@/components/PassengersPicker";
import { SearchOpenBookingToggle } from "@/components/search/SearchOpenBookingToggle";
import { buildFlightSearchResultsHref, SITE_DEFAULT_TO_CITY, SITE_PRIMARY_FROM_CITY } from "@/lib/siteDefaults";

const cabins = [
  { value: "economy", label: "Economy" },
  { value: "premium", label: "Premium economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" }
] as const;

function parseYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatPrettyDate(ymd: string) {
  const dt = parseYmd(ymd);
  if (!dt) return ymd;
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric"
  }).format(dt);
}

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

type PaxState = {
  adults: number;
  children: number;
  infants: number;
  cabin: (typeof cabins)[number]["value"];
};

type LocationSuggestion = {
  id: string;
  type: "city" | "airport" | "country" | "airline";
  name: string;
  iata: string;
  countryCode?: string;
  cityIata?: string;
  cityName?: string;
  countryName?: string;
  cityCount?: number;
};

function slugifyCountryName(value: string): string {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function labelFromSuggestion(item: LocationSuggestion): string {
  if (item.type === "airport") return String(item.name || item.iata || "").trim();
  if (item.type === "city") return String(item.cityName || item.name || item.iata || "").trim();
  if (item.type === "country") return String(item.name || item.countryName || item.iata || "").trim();
  return String(item.name || item.iata || "").trim();
}

function iataFromSuggestion(item: LocationSuggestion): string {
  const raw = item.type === "airport" ? item.iata : item.cityIata || item.iata;
  const code = String(raw || "")
    .trim()
    .toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : "";
}

const locationDropdownScroll =
  "overflow-y-auto overscroll-contain " +
  "[scrollbar-width:thin] [scrollbar-color:theme(colors.red.500)_theme(colors.slate.100)] " +
  "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-brand-500/85 " +
  "dark:[scrollbar-color:theme(colors.red.600)_theme(colors.zinc.800)] " +
  "dark:[&::-webkit-scrollbar-track]:bg-zinc-800 dark:[&::-webkit-scrollbar-thumb]:bg-brand-600/80";

function LocationSuggestions({
  open,
  loading,
  query,
  title,
  items,
  onSelect,
  fullScreen = false
}: {
  open: boolean;
  loading: boolean;
  query: string;
  title?: string;
  items: LocationSuggestion[];
  onSelect: (item: LocationSuggestion) => void;
  fullScreen?: boolean;
}) {
  const t = useT();
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  if (!open) return null;
  const countryGroups = new Map<
    string,
    {
      countryItem?: LocationSuggestion;
      countryName: string;
      countryCode: string;
      cities: Map<string, { key: string; cityItem?: LocationSuggestion; cityName: string; airports: LocationSuggestion[] }>;
      looseAirports: LocationSuggestion[];
    }
  >();
  const airlineItems = items.filter((item) => item.type === "airline");

  for (const item of items) {
    if (item.type === "airline") continue;
    const countryCode = String(item.countryCode || "").toUpperCase();
    const countryName = item.countryName || item.name || countryCode;
    const countryKey = countryCode || countryName;
    if (!countryKey) continue;
    let group = countryGroups.get(countryKey);
    if (!group) {
      group = {
        countryName,
        countryCode,
        cities: new Map(),
        looseAirports: []
      };
      countryGroups.set(countryKey, group);
    }
    if (item.type === "country") {
      group.countryItem = item;
      group.countryName = item.name || countryName;
      group.countryCode = countryCode;
      continue;
    }
    if (item.type === "city") {
      const cityKey = String(item.iata || item.name).toUpperCase();
      const existing = group.cities.get(cityKey);
      group.cities.set(cityKey, {
        key: cityKey,
        cityItem: item,
        cityName: item.name,
        airports: existing?.airports || []
      });
      continue;
    }
    if (item.type === "airport") {
      const cityKey = String(item.cityIata || item.cityName || "").toUpperCase();
      if (!cityKey) {
        group.looseAirports.push(item);
        continue;
      }
      const existing = group.cities.get(cityKey);
      group.cities.set(cityKey, {
        key: cityKey,
        cityItem: existing?.cityItem,
        cityName: existing?.cityName || item.cityName || item.name,
        airports: [...(existing?.airports || []), item]
      });
    }
  }

  const renderSuggestion = (item: LocationSuggestion, level: 0 | 1 | 2 = 0) => {
    const subtitle = (() => {
      if (item.type === "airport" && item.cityName) {
        return `${item.cityName}${item.countryName ? ` · ${item.countryName}` : ""}`;
      }
      if (item.type === "country") {
        return tr("search.checkTicketPrices", "Check ticket prices");
      }
      if (item.type === "airline") {
        return item.countryName || tr("search.airline", "Airline");
      }
      return item.countryName || "";
    })();

    return (
      <button
        key={item.id}
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          onSelect(item);
        }}
        onClick={(e) => {
          // Keyboard activation does not fire pointerdown.
          if (e.detail === 0) onSelect(item);
        }}
        className={cn(
          "flex w-full items-start gap-3 py-3 text-left transition",
          level === 0 ? "px-4" : level === 1 ? "pl-8 pr-4" : "pl-14 pr-4",
          "hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-600",
          "dark:hover:bg-brand-950/25 dark:focus-visible:outline-brand-500"
        )}
      >
        <span className="mt-0.5 shrink-0 text-slate-400 dark:text-white/45">
          {item.type === "country" && /^[A-Z]{2}$/.test(String(item.countryCode || "").toUpperCase()) ? (
            <span className={`fi fi-${String(item.countryCode || "").toLowerCase()} h-[18px] w-[24px] rounded-sm`} aria-hidden />
          ) : item.type === "airport" || item.type === "airline" ? (
            <BiSolidPlaneAlt className={cn(level === 2 ? "h-4 w-4" : "h-[18px] w-[18px]")} aria-hidden />
          ) : (
            <FiMapPin className="h-[18px] w-[18px]" aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1 pr-2">
          <span className={cn("block truncate font-semibold leading-snug text-slate-900 dark:text-white", level === 2 ? "text-xs" : "text-sm")}>
            {item.name}
          </span>
          {subtitle ? (
            <span className="mt-0.5 block truncate text-xs leading-snug text-slate-500 dark:text-white/55">
              {subtitle}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 pt-0.5 text-right font-mono text-sm font-semibold tabular-nums tracking-wide text-slate-400 dark:text-white/50">
          {item.iata}
        </span>
      </button>
    );
  };

  return (
    <div
      className={cn(
        fullScreen
          ? "h-full w-full rounded-3xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:bg-zinc-950 dark:ring-white/10"
          : "absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[min(70vh,520px)] rounded-2xl border border-slate-200/90 bg-white shadow-xl ring-1 ring-black/5 md:left-0 md:right-auto md:min-w-[460px] md:max-w-[560px]",
        "dark:border-white/10 dark:bg-zinc-950 dark:ring-white/10",
        locationDropdownScroll
      )}
    >
      {loading ? (
        <div className="border-b border-slate-100 px-4 py-4 text-sm text-slate-600 dark:border-white/10 dark:text-white/70">
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent dark:border-brand-400" />
            {tr("search.searchingLocations", "Searching locations...")}
          </span>
        </div>
      ) : items.length ? (
        <div>
          {title ? (
            <div className="border-b border-slate-100 px-4 pb-3 pt-4 dark:border-white/10">
              <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{title}</div>
              <div className="mt-1 h-0.5 w-12 rounded-full bg-brand-600 dark:bg-brand-500" />
            </div>
          ) : null}
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {Array.from(countryGroups.values()).map((group) => (
              <div key={group.countryCode || group.countryName}>
                {group.countryItem ? renderSuggestion(group.countryItem, 0) : null}
                {Array.from(group.cities.values()).map((city) => (
                  <div key={`${group.countryCode || group.countryName}-${city.key}`}>
                    {city.cityItem ? renderSuggestion(city.cityItem, group.countryItem ? 1 : 0) : null}
                    {city.airports.map((airport) => renderSuggestion(airport, city.cityItem ? 2 : group.countryItem ? 1 : 0))}
                  </div>
                ))}
                {group.looseAirports.map((airport) => renderSuggestion(airport, group.countryItem ? 1 : 0))}
              </div>
            ))}
            {airlineItems.length ? (
              <div>
                {airlineItems.map((airline) => renderSuggestion(airline, 0))}
              </div>
            ) : null}
          </div>
        </div>
      ) : query.trim().length >= 2 ? (
        <div className="border-t border-slate-100 px-4 py-8 text-center dark:border-white/10">
          <div className="text-base font-semibold text-slate-900 dark:text-white">
            {tr("search.nothingFound", "Nothing found")}
          </div>
          <div className="mt-1 text-sm text-slate-500 dark:text-white/60">
            {tr("search.checkInputTypos", "Please check your input for typos")}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FlightSearchContent({
  from,
  setFrom,
  to,
  setTo,
  onTypeTo,
  departDate,
  setDepartDate,
  returnDate,
  setReturnDate,
  pax,
  setPax,
  tab,
  setTab,
  openBooking,
  setOpenBooking,
  activeDateField,
  setActiveDateField,
  isMobileViewport,
  fromSuggestions,
  toSuggestions,
  isFromSuggestionsLoading,
  isToSuggestionsLoading,
  isFromOriginMode,
  isToDestinationMode,
  activeSuggestField,
  onFromFocus,
  onToFocus,
  onFromFieldBlur,
  onToFieldBlur,
  onCloseSuggestPanel,
  onSelectFromSuggestion,
  onSelectToSuggestion,
  onSwapRoute,
  showRouteSwap,
  onSearch,
  compact = false,
  pickersActive = true,
  showBottomActions = true,
  showTabs = true
}: {
  from: string;
  setFrom: (v: string) => void;
  to: string;
  setTo: (v: string) => void;
  onTypeTo: (v: string) => void;
  departDate: string;
  setDepartDate: (v: string) => void;
  returnDate: string;
  setReturnDate: (v: string) => void;
  pax: PaxState;
  setPax: (v: PaxState) => void;
  tab: "flights" | "hotels";
  setTab: (v: "flights" | "hotels") => void;
  openBooking: boolean;
  setOpenBooking: (v: boolean) => void;
  activeDateField: null | "depart" | "return";
  setActiveDateField: (v: null | "depart" | "return") => void;
  isMobileViewport: boolean;
  fromSuggestions: LocationSuggestion[];
  toSuggestions: LocationSuggestion[];
  isFromSuggestionsLoading: boolean;
  isToSuggestionsLoading: boolean;
  isFromOriginMode: boolean;
  isToDestinationMode: boolean;
  activeSuggestField: null | "from" | "to";
  onFromFocus: () => void;
  onToFocus: () => void;
  onFromFieldBlur: () => void;
  onToFieldBlur: () => void;
  onCloseSuggestPanel: () => void;
  onSelectFromSuggestion: (item: LocationSuggestion) => void;
  onSelectToSuggestion: (item: LocationSuggestion) => void;
  onSwapRoute: () => void;
  showRouteSwap: boolean;
  onSearch: () => void;
  compact?: boolean;
  pickersActive?: boolean;
  showBottomActions?: boolean;
  showTabs?: boolean;
}) {
  const t = useT();
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const prettyDepart = formatPrettyDate(departDate);
  const prettyReturn = returnDate ? formatPrettyDate(returnDate) : "";
  const mobileDateLabel = prettyReturn ? `${prettyDepart} - ${prettyReturn}` : prettyDepart || t("search.departure");
  const showMobileSuggestPanel = isMobileViewport && (activeSuggestField === "from" || activeSuggestField === "to");
  const panelTitle = activeSuggestField === "from" ? t("search.from") : t("search.to");
  const panelValue = activeSuggestField === "from" ? from : to;
  const panelLoading = activeSuggestField === "from" ? isFromSuggestionsLoading : isToSuggestionsLoading;
  const panelItems = activeSuggestField === "from" ? fromSuggestions : toSuggestions;
  const panelSelect = activeSuggestField === "from" ? onSelectFromSuggestion : onSelectToSuggestion;
  const canSwapRoute = showRouteSwap && Boolean(from.trim() && to.trim());
  const panelOnChange = (value: string) => {
    if (activeSuggestField === "from") {
      setFrom(value);
      return;
    }
    onTypeTo(value);
  };

  return (
    <div className={cn("w-full flex flex-col justify-center", compact ? "gap-3" : "gap-3.5 md:gap-8")}>
      <div>
        {showMobileSuggestPanel ? (
          <div className="fixed inset-0 z-[90] flex flex-col bg-slate-100 dark:bg-black">
            <div className="flex h-14 items-center justify-center border-b border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-zinc-950">
              <div className="text-xl font-semibold text-slate-900 dark:text-white">{panelTitle}</div>
              <button
                type="button"
                onClick={onCloseSuggestPanel}
                className="absolute right-4 grid h-10 w-10 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 dark:text-white/70 dark:hover:bg-white/10"
                aria-label="Close search panel"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <div className="mx-auto flex min-h-0 w-full max-w-[720px] flex-1 flex-col p-4">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-zinc-950">
                <FiSearch className="h-5 w-5 text-blue-500" />
                <input
                  value={panelValue}
                  onChange={(e) => panelOnChange(e.target.value)}
                  className="w-full bg-transparent text-lg outline-none placeholder:text-slate-400 dark:placeholder:text-white/35"
                  placeholder={panelTitle}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => panelOnChange("")}
                  className="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 dark:text-white/60 dark:hover:bg-white/10"
                  aria-label="Clear input"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 min-h-0 flex-1">
                <LocationSuggestions
                  open
                  fullScreen
                  loading={panelLoading}
                  query={panelValue}
                  title={
                    activeSuggestField === "from" && isFromOriginMode
                      ? tr("search.nearestAirports", "Nearest airports")
                      : activeSuggestField === "to" && isToDestinationMode && panelValue.trim().length < 2
                        ? undefined
                        : panelValue.trim().length < 2
                          ? tr("search.nearestAirports", "Nearest airports")
                          : undefined
                  }
                  items={panelItems}
                  onSelect={panelSelect}
                />
              </div>
            </div>
          </div>
        ) : null}
        <div className="w-full">
          <div className="overflow-hidden rounded-3xl bg-white text-slate-900 ring-1 ring-black/10 dark:bg-black dark:text-white dark:ring-white/15 md:hidden">
            <div className="flex items-center gap-5 w-full px-3">
              <FiSearch className="h-5 w-5 text-slate-900 dark:text-white/80" />
              <div className="relative flex w-full flex-col">
                <div className="relative py-4 text-[14px] font-semibold leading-none border-b border-slate-300/90 dark:border-white/10">
                  <input
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    onFocus={onFromFocus}
                    onBlur={onFromFieldBlur}
                    className="w-full bg-transparent text-[14px] outline-none placeholder:text-slate-400 dark:placeholder:text-white/35"
                    placeholder={t("search.from")}
                  />
                  <LocationSuggestions
                    open={activeSuggestField === "from"}
                    loading={isFromSuggestionsLoading}
                    query={from}
                    title={isFromOriginMode ? tr("search.nearestAirports", "Nearest airports") : from.trim().length < 2 ? tr("search.nearestAirports", "Nearest airports") : undefined}
                    items={fromSuggestions}
                    onSelect={onSelectFromSuggestion}
                  />
                </div>
                {canSwapRoute ? (
                  <button
                    type="button"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      onSwapRoute();
                    }}
                    onClick={(event) => event.preventDefault()}
                    className="absolute right-1 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-blue-600 shadow-md ring-1 ring-blue-100 transition hover:bg-blue-50 hover:text-blue-700 dark:bg-zinc-950 dark:text-blue-400 dark:ring-white/10 dark:hover:bg-white/10"
                    aria-label="Swap origin and destination"
                  >
                    <FiRepeat className="h-5 w-5" />
                  </button>
                ) : null}
                <div className="relative flex items-center gap-3 border-t border-slate-300/90 py-3 dark:border-white/10">
                  <input
                    value={to}
                    onChange={(e) => onTypeTo(e.target.value)}
                    onFocus={onToFocus}
                    onBlur={onToFieldBlur}
                    className="w-full bg-transparent text-[14px] outline-none placeholder:text-slate-400 dark:placeholder:text-white/35"
                    placeholder={t("search.to")}
                  />
                  <LocationSuggestions
                    open={activeSuggestField === "to"}
                    loading={isToSuggestionsLoading}
                    query={to}
                    title={isToDestinationMode && to.trim().length < 2 ? undefined : to.trim().length < 2 ? tr("search.nearestAirports", "Nearest airports") : undefined}
                    items={toSuggestions}
                    onSelect={onSelectToSuggestion}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-300/90 dark:border-white/10">
              <div className="flex min-w-0 items-center px-3 py-3.5">
                <button
                  type="button"
                  onClick={() => setActiveDateField(activeDateField === "depart" ? null : "depart")}
                  className="flex min-w-0 items-center gap-3 text-left"
                >
                  <FiCalendar className="h-5 w-5 text-slate-500 dark:text-white/70" />
                  <span className="truncate text-[14px]">{mobileDateLabel}</span>
                </button>
                {departDate || returnDate ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDepartDate("");
                      setReturnDate("");
                      setActiveDateField(null);
                    }}
                    className="ml-2 grid h-8 w-8 shrink-0 place-items-center rounded-md text-blue-600 transition hover:bg-slate-100 dark:text-blue-400 dark:hover:bg-white/10"
                    aria-label="Clear dates"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                ) : null}
              </div>
              <div className="border-l border-slate-300/90 py-1 w-[200px] overflow-hidden dark:border-white/10">
                <div className="flex items-center gap-3 px-4">
                  <FiUser className="h-5 w-5 text-slate-500 dark:text-white/70" />
                  <div className="min-w-0 flex-1">
                    <PassengersPicker value={pax} onChange={setPax} />
                  </div>
                </div>
              </div>
            </div>
            {isMobileViewport && pickersActive && (activeDateField === "depart" || activeDateField === "return") ? (
              <MobileDateRangePicker
                departDate={departDate}
                returnDate={returnDate}
                initialField={activeDateField === "return" ? "return" : "depart"}
                onChange={({ departDate: nextDepart, returnDate: nextReturn }) => {
                  setDepartDate(nextDepart);
                  setReturnDate(nextReturn);
                }}
                onClose={() => setActiveDateField(null)}
                departureLabel={t("search.departure")}
                returnLabel={t("search.return")}
              />
            ) : null}
          </div>

          <div className="hidden w-full grid-cols-1 gap-2 overflow-visible md:grid md:grid-cols-6">
            <div className="relative rounded-2xl bg-white px-4 py-3 ring-1 ring-black/10 dark:bg-black dark:ring-white/15">
              <div className="text-xs text-slate-500">{t("search.from")}</div>
              <input
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                onFocus={onFromFocus}
                onBlur={onFromFieldBlur}
                className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Los Angeles"
              />
              <LocationSuggestions
                open={activeSuggestField === "from"}
                loading={isFromSuggestionsLoading}
                query={from}
                title={isFromOriginMode ? tr("search.nearestAirports", "Nearest airports") : from.trim().length < 2 ? tr("search.nearestAirports", "Nearest airports") : undefined}
                items={fromSuggestions}
                onSelect={onSelectFromSuggestion}
              />
              {canSwapRoute ? (
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    onSwapRoute();
                  }}
                  onClick={(event) => event.preventDefault()}
                  className="absolute -right-5 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-blue-600 shadow-lg ring-1 ring-blue-100 transition hover:bg-blue-50 hover:text-blue-700 dark:bg-zinc-950 dark:text-blue-400 dark:ring-white/10 dark:hover:bg-white/10"
                  aria-label="Swap origin and destination"
                >
                  <FiRepeat className="h-5 w-5" />
                </button>
              ) : null}
            </div>
            <div className="relative rounded-2xl bg-white px-4 py-3 ring-1 ring-black/10 dark:bg-black dark:ring-white/15">
              <div className="text-xs text-slate-500">{t("search.to")}</div>
              <input
                value={to}
                onChange={(e) => onTypeTo(e.target.value)}
                onFocus={onToFocus}
                onBlur={onToFieldBlur}
                className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Where to?"
              />
              <LocationSuggestions
                open={activeSuggestField === "to"}
                loading={isToSuggestionsLoading}
                query={to}
                title={isToDestinationMode && to.trim().length < 2 ? undefined : to.trim().length < 2 ? tr("search.nearestAirports", "Nearest airports") : undefined}
                items={toSuggestions}
                onSelect={onSelectToSuggestion}
              />
            </div>
            <div className="relative rounded-2xl bg-white px-4 py-3 ring-1 ring-black/10 dark:bg-black dark:ring-white/15">
              <div className="text-xs text-slate-500">{t("search.departure")}</div>
              <button
                type="button"
                onClick={() => setActiveDateField(activeDateField === "depart" ? null : "depart")}
                className="mt-1 h-5 w-full text-left bg-transparent text-sm leading-5 outline-none pr-8 text-slate-900 dark:text-white"
              >
                {prettyDepart}
              </button>
              {departDate ? (
                <button
                  type="button"
                  onClick={() => {
                    setDepartDate("");
                    setReturnDate("");
                    setActiveDateField(null);
                  }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 dark:text-white/70 dark:hover:bg-white/10"
                  aria-label="Clear departure date"
                >
                  <FiX className="h-5 w-5" />
                </button>
              ) : (
                <FiCalendar className="pointer-events-none absolute right-4 top-1/2 text-slate-500" />
              )}
              {!isMobileViewport && pickersActive && activeDateField === "depart" ? (
                <TwoMonthDatePicker
                  value={departDate}
                  rangeStartYmd={departDate}
                  rangeEndYmd={returnDate || undefined}
                  onChange={(ymd) => setDepartDate(ymd)}
                  onClose={() => setActiveDateField(null)}
                />
              ) : null}
            </div>
            <div className="relative rounded-2xl bg-white px-4 py-3 ring-1 ring-black/10 dark:bg-black dark:ring-white/15">
              <div className="text-xs text-slate-500">{t("search.return")}</div>
              <button
                type="button"
                onClick={() => setActiveDateField(activeDateField === "return" ? null : "return")}
                className="mt-1 h-5 w-full text-left bg-transparent text-sm leading-5 outline-none pr-8 text-slate-900 dark:text-white"
              >
                {prettyReturn}
              </button>
              {returnDate ? (
                <button
                  type="button"
                  onClick={() => {
                    setReturnDate("");
                    setActiveDateField(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 dark:text-white/70 dark:hover:bg-white/10"
                  aria-label="Clear return date"
                >
                  <FiX className="h-5 w-5" />
                </button>
              ) : (
                <FiCalendar className="pointer-events-none absolute right-4 top-1/2 text-slate-500" />
              )}
              {!isMobileViewport && pickersActive && activeDateField === "return" ? (
                <TwoMonthDatePicker
                  value={returnDate || undefined}
                  minYmd={departDate}
                  rangeStartYmd={departDate}
                  rangeEndYmd={returnDate || undefined}
                  onChange={(ymd) => setReturnDate(ymd)}
                  onClose={() => setActiveDateField(null)}
                />
              ) : null}
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-black/10 dark:bg-black dark:ring-white/15">
              <PassengersPicker value={pax} onChange={setPax} />
            </div>
            <button
              onClick={() => {
                if (tab !== "flights") return;
                onSearch();
              }}
              className="w-full rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition ring-1 ring-black/10 md:rounded-2xl md:px-5 md:py-3"
              disabled={tab !== "flights"}
              type="button"
            >
              {t("search.searchFlights")}
            </button>
          </div>

          <button
            onClick={() => {
              if (tab !== "flights") return;
              onSearch();
            }}
            className="mt-2.5 w-full rounded-2xl bg-orange-500 px-5 py-3 text-[16px] font-semibold text-white hover:bg-orange-600 transition ring-1 ring-black/10 md:hidden"
            disabled={tab !== "flights"}
            type="button"
          >
            {t("search.searchFlights")}
          </button>
        </div>

        {showBottomActions ? (
          <>
          <div className="mt-14 grid grid-cols-2 gap-3 md:hidden">
            <Link
              href="/map"
              className="inline-flex flex-col items-center justify-center gap-2 rounded-3xl bg-white px-4 py-3 text-[12px] font-semibold text-slate-900 ring-1 ring-black/10 dark:bg-black dark:text-white dark:ring-white/15"
            >
              <span className="grid h-11 w-11 -mt-12 place-items-center rounded-full bg-green-100 ring-1 ring-green-200">
                <FiMapPin className="h-6 w-6 text-green-600" />
              </span>
              {t("search.anywhere")}
            </Link>
            <a
              href="#"
              className="inline-flex flex-col items-center justify-center gap-2 rounded-3xl bg-white px-4 py-4 text-[12px] font-semibold text-slate-900 ring-1 ring-black/10 dark:bg-black dark:text-white dark:ring-white/15"
            >
              <span className="grid h-11 w-11 -mt-12 place-items-center rounded-full bg-blue-100 ring-1 ring-blue-200">
                <FiShuffle className="h-6 w-6 text-blue-600" />
              </span>
              {t("search.multiCity")}
            </a>
          </div>

          <div className="mt-2 hidden flex-col gap-2 px-0 py-2 text-xs md:flex md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-white/90 ring-1 ring-white/20 hover:bg-white/20 hover:text-white transition"
            >
              <FiShuffle className="h-4 w-4" />
              {t("search.multiCity")}
            </a>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-white/90 ring-1 ring-white/20 hover:bg-white/20 hover:text-white transition"
            >
              <FiMapPin className="h-4 w-4" />
              {t("search.anywhere")}
            </Link>
          </div>

          <SearchOpenBookingToggle checked={openBooking} onChange={setOpenBooking} />
          </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function FlightSearch({
  stickyEnabled = false,
  forceCompact = false,
  showBottomActions = true,
  initialFrom = SITE_PRIMARY_FROM_CITY,
  initialTo = SITE_DEFAULT_TO_CITY,
  usePersistedSearchForm = true
}: {
  stickyEnabled?: boolean;
  forceCompact?: boolean;
  showBottomActions?: boolean;
  initialFrom?: string;
  initialTo?: string;
  usePersistedSearchForm?: boolean;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const showRouteSwap = pathname !== "/" && !pathname.startsWith("/destinations");
  const originCityName = useAppSelector((s) => s.locale.originCityName);
  const localeOriginIata = useAppSelector((s) => s.locale.originIata);
  const localeCountry = useAppSelector((s) => s.locale.country);
  const currencyCode = useAppSelector((s) => s.locale.currency);
  const persistedSearchForm = useAppSelector((s) => s.flights.searchForm);
  const preferInitialRouteValues =
    initialFrom !== SITE_PRIMARY_FROM_CITY || initialTo !== SITE_DEFAULT_TO_CITY;

  const [from, setFrom] = useState(
    preferInitialRouteValues ? initialFrom : usePersistedSearchForm ? persistedSearchForm.from || initialFrom : initialFrom
  );
  const [to, setTo] = useState(
    preferInitialRouteValues ? initialTo : usePersistedSearchForm ? persistedSearchForm.to || initialTo : initialTo
  );
  const [departDate, setDepartDate] = useState(usePersistedSearchForm ? persistedSearchForm.departDate || "" : "");
  const [returnDate, setReturnDate] = useState(usePersistedSearchForm ? persistedSearchForm.returnDate || "" : "");
  const [pax, setPax] = useState<PaxState>({
    adults: persistedSearchForm.adults,
    children: persistedSearchForm.children,
    infants: persistedSearchForm.infants,
    cabin: persistedSearchForm.cabin
  });
  const [tab, setTab] = useState<"flights" | "hotels">("flights");
  const [openBooking, setOpenBooking] = useState(true);
  const [activeDateField, setActiveDateField] = useState<null | "depart" | "return">(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [reservedHeight, setReservedHeight] = useState(0);
  const [activeSuggestField, setActiveSuggestField] = useState<null | "from" | "to">(null);
  const [fromSuggestions, setFromSuggestions] = useState<LocationSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<LocationSuggestion[]>([]);
  const [isFromSuggestionsLoading, setIsFromSuggestionsLoading] = useState(false);
  const [isToSuggestionsLoading, setIsToSuggestionsLoading] = useState(false);
  const [isFromOriginMode, setIsFromOriginMode] = useState(false);
  const [isToDestinationMode, setIsToDestinationMode] = useState(false);
  const [selectedFromIata, setSelectedFromIata] = useState("");
  const [isFromDirty, setIsFromDirty] = useState(false);
  const [isToDirty, setIsToDirty] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const stickySentinelRef = useRef<HTMLDivElement | null>(null);
  const fromBlurTimerRef = useRef<number | null>(null);
  const toBlurTimerRef = useRef<number | null>(null);
  const suppressFromBlurUntilRef = useRef(0);
  const suppressToBlurUntilRef = useRef(0);
  const fromSuggestionPickedRef = useRef(false);
  const toSuggestionPickedRef = useRef(false);
  const fromBeforePickerRef = useRef(from);
  const toBeforePickerRef = useRef(to);

  useEffect(() => {
    return () => {
      if (fromBlurTimerRef.current) clearTimeout(fromBlurTimerRef.current);
      if (toBlurTimerRef.current) clearTimeout(toBlurTimerRef.current);
    };
  }, []);

  useEffect(() => {
    function syncViewport() {
      setIsMobileViewport(window.innerWidth < 768);
    }
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (!stickyEnabled || isMobileViewport) {
      setStickyVisible(false);
      return;
    }

    const node = stickySentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setStickyVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-64px 0px 0px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [stickyEnabled, isMobileViewport]);

  useEffect(() => {
    if (!returnDate) return;
    if (returnDate < departDate) setReturnDate("");
  }, [departDate, returnDate]);

  useEffect(() => {
    const city = String(originCityName || "").trim();
    if (!city) return;
    if (isFromDirty) return;
    const shouldAutofillFromLocation =
      !preferInitialRouteValues && from.trim().toLowerCase() === SITE_PRIMARY_FROM_CITY.toLowerCase();
    if (!shouldAutofillFromLocation) return;
    setFrom(city);
  }, [from, isFromDirty, originCityName, preferInitialRouteValues]);

  useEffect(() => {
    if (!usePersistedSearchForm) return;
    if (isFromDirty) return;
    const reduxFrom = String(persistedSearchForm.from || "").trim();
    if (!reduxFrom) return;
    const localFrom = String(from || "").trim();
    const isLocalDefault = localFrom.toLowerCase() === SITE_PRIMARY_FROM_CITY.toLowerCase();
    // Sync async Redux updates (e.g. location bootstrap) into visible input,
    // but avoid overriding user-entered values (including intentional empty while editing).
    if (!localFrom || isLocalDefault) {
      setFrom(reduxFrom);
    }
  }, [from, isFromDirty, persistedSearchForm.from, usePersistedSearchForm]);

  useEffect(() => {
    if (!usePersistedSearchForm) return;
    if (isFromDirty) return;
    const reduxFromIata = String(persistedSearchForm.fromIata || "")
      .trim()
      .toUpperCase();
    if (/^[A-Z]{3}$/.test(reduxFromIata)) {
      setSelectedFromIata(reduxFromIata);
    }
  }, [isFromDirty, persistedSearchForm.fromIata, usePersistedSearchForm]);

  useEffect(() => {
    if (!usePersistedSearchForm) return;
    const reduxTo = String(persistedSearchForm.to || "").trim();
    if (!reduxTo) return;
    if (isToDirty) return;
    const localTo = String(to || "").trim();
    const isLocalDefault = localTo.toLowerCase() === SITE_DEFAULT_TO_CITY.toLowerCase();
    // Sync async Redux updates (e.g. localStorage hydration/destination page set)
    // into visible input, but avoid overriding user-entered values.
    if (!localTo || isLocalDefault) {
      setTo(reduxTo);
    }
  }, [isToDirty, persistedSearchForm.to, to, usePersistedSearchForm]);

  useEffect(() => {
    const q = from.trim();
    const isOriginMode = isFromOriginMode || q.length < 2;
    const seed = isOriginMode ? String(originCityName || selectedFromIata || localeOriginIata || from || "").trim() : q;
    if (activeSuggestField !== "from" || seed.length < 2) {
      setFromSuggestions([]);
      setIsFromSuggestionsLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsFromSuggestionsLoading(true);
      void fetch(`${env.apiBaseUrl}/api/flights/locations?query=${encodeURIComponent(seed)}&limit=100`, {
        cache: "no-store",
        signal: controller.signal
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`locations failed (${res.status})`);
          return (await res.json()) as { locations?: LocationSuggestion[] };
        })
        .then((payload) => {
          if (controller.signal.aborted) return;
          setFromSuggestions(Array.isArray(payload?.locations) ? payload.locations : []);
          setIsFromSuggestionsLoading(false);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setFromSuggestions([]);
          setIsFromSuggestionsLoading(false);
        });
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [activeSuggestField, from, isFromOriginMode, localeOriginIata, originCityName, selectedFromIata]);

  useEffect(() => {
    const q = to.trim();
    if (activeSuggestField === "to" && isToDestinationMode && q.length < 2) {
      const originCountry = String(localeCountry || "TR")
        .trim()
        .toUpperCase();
      if (!/^[A-Z]{2}$/.test(originCountry)) {
        setToSuggestions([]);
        setIsToSuggestionsLoading(false);
        return;
      }
      const controller = new AbortController();
      const timer = window.setTimeout(() => {
        setIsToSuggestionsLoading(true);
        const url = new URL(`${env.apiBaseUrl}/api/flights/popular-destinations`);
        url.searchParams.set("originCountry", originCountry);
        const originIata = String(selectedFromIata || localeOriginIata || "")
          .trim()
          .toUpperCase();
        if (/^[A-Z]{3}$/.test(originIata)) url.searchParams.set("originIata", originIata);
        if (currencyCode) url.searchParams.set("currency", String(currencyCode).toLowerCase());
        void fetch(url.toString(), { cache: "no-store", signal: controller.signal })
          .then(async (res) => {
            if (!res.ok) throw new Error(`popular destinations failed (${res.status})`);
            return (await res.json()) as {
              destinations?: Array<{ countryCode: string; destinationIata?: string }>;
            };
          })
          .then((payload) => {
            if (controller.signal.aborted) return;
            const names = new Intl.DisplayNames(["en"], { type: "region" });
            const mapped = (Array.isArray(payload.destinations) ? payload.destinations : [])
              .map((item) => {
                const countryCode = String(item.countryCode || "")
                  .trim()
                  .toUpperCase();
                if (!/^[A-Z]{2}$/.test(countryCode)) return null;
                const name = names.of(countryCode) || countryCode;
                return {
                  id: `destination-country:${countryCode}`,
                  type: "country" as const,
                  name,
                  iata: countryCode,
                  countryCode,
                  countryName: name
                } satisfies LocationSuggestion;
              })
              .filter(Boolean) as LocationSuggestion[];
            setToSuggestions(mapped.slice(0, 6));
            setIsToSuggestionsLoading(false);
          })
          .catch(() => {
            if (controller.signal.aborted) return;
            setToSuggestions([]);
            setIsToSuggestionsLoading(false);
          });
      }, 180);
      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    }
    const isOriginMode = q.length < 2;
    const seed = isOriginMode ? String(from || originCityName || "").trim() : q;
    if (activeSuggestField !== "to" || seed.length < 2) {
      setToSuggestions([]);
      setIsToSuggestionsLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsToSuggestionsLoading(true);
      void fetch(`${env.apiBaseUrl}/api/flights/locations?query=${encodeURIComponent(seed)}&limit=100`, {
        cache: "no-store",
        signal: controller.signal
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`locations failed (${res.status})`);
          return (await res.json()) as { locations?: LocationSuggestion[] };
        })
        .then((payload) => {
          if (controller.signal.aborted) return;
          setToSuggestions(Array.isArray(payload?.locations) ? payload.locations : []);
          setIsToSuggestionsLoading(false);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setToSuggestions([]);
          setIsToSuggestionsLoading(false);
        });
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [activeSuggestField, currencyCode, from, isToDestinationMode, localeCountry, localeOriginIata, originCityName, selectedFromIata, to]);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const measure = () => {
      const next = Math.ceil(el.getBoundingClientRect().height);
      setReservedHeight((prev) => (prev !== next ? next : prev));
    };

    measure();

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [stickyVisible, isMobileViewport, forceCompact, showBottomActions]);

  function onSearch() {
    const normalizedFrom = String(from || "").trim().toLowerCase();
    const normalizedOriginCity = String(originCityName || "").trim().toLowerCase();
    const originResolvedIata =
      normalizedFrom && normalizedFrom === normalizedOriginCity && /^[A-Z]{3}$/.test(String(localeOriginIata || "").toUpperCase())
        ? String(localeOriginIata).toUpperCase()
        : "";
    const resolvedFromIata = /^[A-Z]{3}$/.test(String(selectedFromIata || "").toUpperCase())
      ? String(selectedFromIata).toUpperCase()
      : originResolvedIata;
    dispatch(
      setFlightSearchForm({
        from,
        fromIata: resolvedFromIata,
        to,
        departDate,
        returnDate,
        adults: pax.adults,
        children: pax.children,
        infants: pax.infants,
        cabin: pax.cabin
      })
    );
    const passengers = pax.adults + pax.children + pax.infants;
    void dispatch(
      searchFlights({
        from: from.trim(),
        to: to.trim(),
        departDate,
        returnDate: returnDate || undefined,
        passengers,
        cabin: pax.cabin
      })
    );
  }

  const handleSwapRoute = () => {
    const nextFrom = String(to || "").trim();
    const nextTo = String(from || "").trim();
    if (!nextFrom || !nextTo) return;
    if (fromBlurTimerRef.current) {
      clearTimeout(fromBlurTimerRef.current);
      fromBlurTimerRef.current = null;
    }
    if (toBlurTimerRef.current) {
      clearTimeout(toBlurTimerRef.current);
      toBlurTimerRef.current = null;
    }
    const nextFromIata =
      nextFrom.toLowerCase() === String(originCityName || "").trim().toLowerCase() &&
      /^[A-Z]{3}$/.test(String(localeOriginIata || "").toUpperCase())
        ? String(localeOriginIata).toUpperCase()
        : "";
    setFrom(nextFrom);
    setTo(nextTo);
    setSelectedFromIata(nextFromIata);
    fromBeforePickerRef.current = nextFrom;
    toBeforePickerRef.current = nextTo;
    fromSuggestionPickedRef.current = false;
    toSuggestionPickedRef.current = false;
    setIsFromDirty(false);
    setIsToDirty(false);
    setIsFromOriginMode(false);
    setIsToDestinationMode(false);
    setActiveSuggestField(null);
    dispatch(
      setFlightSearchForm({
        from: nextFrom,
        fromIata: nextFromIata,
        to: nextTo
      })
    );
    if (pathname === "/search/flights") {
      router.replace(buildFlightSearchResultsHref(nextTo, nextFrom));
    }
  };

  const isPinnedCompact = stickyEnabled && stickyVisible;
  const compactMode = forceCompact || isPinnedCompact;
  const mobilePinned = isPinnedCompact && isMobileViewport;
  const handleFromFieldBlur = () => {
    if (Date.now() < suppressFromBlurUntilRef.current) return;
    if (fromBlurTimerRef.current) clearTimeout(fromBlurTimerRef.current);
    fromBlurTimerRef.current = window.setTimeout(() => {
      fromBlurTimerRef.current = null;
      setActiveSuggestField((cur) => (cur === "from" ? null : cur));
      if (fromSuggestionPickedRef.current) {
        fromSuggestionPickedRef.current = false;
        setIsFromDirty(false);
        return;
      }
      setFrom(fromBeforePickerRef.current);
      setIsFromDirty(false);
    }, 180);
  };

  const handleToFieldBlur = () => {
    if (Date.now() < suppressToBlurUntilRef.current) return;
    if (toBlurTimerRef.current) clearTimeout(toBlurTimerRef.current);
    toBlurTimerRef.current = window.setTimeout(() => {
      toBlurTimerRef.current = null;
      setActiveSuggestField((cur) => (cur === "to" ? null : cur));
      if (toSuggestionPickedRef.current) {
        toSuggestionPickedRef.current = false;
        setIsToDirty(false);
        return;
      }
      setTo(toBeforePickerRef.current);
      setIsToDirty(false);
    }, 180);
  };

  const handleFromChange = (value: string) => {
    setIsFromDirty(true);
    setActiveSuggestField("from");
    setIsFromOriginMode(false);
    setFrom(value);
    setSelectedFromIata("");
  };

  const handleFromSuggestionSelect = (item: LocationSuggestion) => {
    if (fromBlurTimerRef.current) {
      clearTimeout(fromBlurTimerRef.current);
      fromBlurTimerRef.current = null;
    }
    fromSuggestionPickedRef.current = true;
    const nextFrom = labelFromSuggestion(item);
    const resolvedFromIata = iataFromSuggestion(item);
    setFrom(nextFrom);
    setSelectedFromIata(resolvedFromIata);
    setIsFromDirty(false);
    setIsFromOriginMode(false);
    dispatch(
      setFlightSearchForm({
        from: nextFrom,
        fromIata: resolvedFromIata
      })
    );
    setActiveSuggestField(null);
  };

  const handleToSuggestionSelect = (item: LocationSuggestion) => {
    if (toBlurTimerRef.current) {
      clearTimeout(toBlurTimerRef.current);
      toBlurTimerRef.current = null;
    }
    toSuggestionPickedRef.current = true;
    const nextTo = labelFromSuggestion(item);
    setTo(nextTo);
    setIsToDirty(false);
    setIsToDestinationMode(false);
    dispatch(
      setFlightSearchForm({
        to: nextTo
      })
    );
    setActiveSuggestField(null);
    if (item.type === "country") {
      const regionCode = String(item.countryCode || "")
        .trim()
        .toLowerCase();
      const slug = slugifyCountryName(nextTo);
      if (slug && /^[a-z]{2}$/.test(regionCode)) {
        router.push(`/destinations/${slug}?rc=${regionCode}`);
        return;
      }
    }
    if (nextTo) {
      const nextFrom = String(from || "").trim();
      router.push(buildFlightSearchResultsHref(nextTo, nextFrom));
    }
  };

  const handleToType = (value: string) => {
    setIsToDirty(true);
    setActiveSuggestField("to");
    setIsToDestinationMode(false);
    setTo(value);
  };

  const handleCloseSuggestPanel = () => {
    // Force close should always resolve state immediately,
    // even if transient blur suppression window is active.
    suppressFromBlurUntilRef.current = 0;
    suppressToBlurUntilRef.current = 0;
    if (activeSuggestField === "from") {
      if (fromBlurTimerRef.current) clearTimeout(fromBlurTimerRef.current);
      handleFromFieldBlur();
    }
    if (activeSuggestField === "to") {
      if (toBlurTimerRef.current) clearTimeout(toBlurTimerRef.current);
      handleToFieldBlur();
    }
  };

  const handleFromFieldFocus = () => {
    // Opening full-screen picker blurs the source input instantly.
    // Ignore this transient blur so panel stays open.
    fromBeforePickerRef.current = from;
    setIsFromOriginMode(true);
    suppressFromBlurUntilRef.current = Date.now() + 350;
    setActiveSuggestField("from");
  };

  const handleToFieldFocus = () => {
    toBeforePickerRef.current = to;
    setIsToDestinationMode(true);
    suppressToBlurUntilRef.current = Date.now() + 350;
    setActiveSuggestField("to");
  };

  return (
    <>
      <div style={{ height: isPinnedCompact ? `${reservedHeight}px` : undefined }}>
        <div
          ref={contentRef}
          className={cn(
            isPinnedCompact
              ? "fixed left-0 right-0 top-14 z-40 bg-brand-600/95 shadow-sm backdrop-blur dark:bg-black/95 lg:top-16"
              : "relative"
          )}
        >
          <div className={cn(isPinnedCompact ? "mx-auto w-full max-w-[1440px] px-4" : "")}>
            <FlightSearchContent
            from={from}
            setFrom={handleFromChange}
            to={to}
            setTo={setTo}
            onTypeTo={handleToType}
            departDate={departDate}
            setDepartDate={setDepartDate}
            returnDate={returnDate}
            setReturnDate={setReturnDate}
            pax={pax}
            setPax={setPax}
            tab={tab}
            setTab={setTab}
            openBooking={openBooking}
            setOpenBooking={setOpenBooking}
            activeDateField={activeDateField}
            setActiveDateField={setActiveDateField}
            isMobileViewport={isMobileViewport}
            fromSuggestions={fromSuggestions}
            toSuggestions={toSuggestions}
            isFromSuggestionsLoading={isFromSuggestionsLoading}
            isToSuggestionsLoading={isToSuggestionsLoading}
            isFromOriginMode={isFromOriginMode}
            isToDestinationMode={isToDestinationMode}
            activeSuggestField={activeSuggestField}
            onFromFocus={handleFromFieldFocus}
            onToFocus={handleToFieldFocus}
            onFromFieldBlur={handleFromFieldBlur}
            onToFieldBlur={handleToFieldBlur}
            onCloseSuggestPanel={handleCloseSuggestPanel}
            onSelectFromSuggestion={handleFromSuggestionSelect}
            onSelectToSuggestion={handleToSuggestionSelect}
            onSwapRoute={handleSwapRoute}
            showRouteSwap={showRouteSwap}
            onSearch={onSearch}
            compact={compactMode}
            pickersActive
            showBottomActions={showBottomActions && !mobilePinned}
            showTabs={!compactMode && !mobilePinned}
            />
          </div>
        </div>
      </div>
      {stickyEnabled ? <div ref={stickySentinelRef} className="h-px w-full" aria-hidden /> : null}
    </>
  );
}

