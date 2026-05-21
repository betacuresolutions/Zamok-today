"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BiSolidPlaneAlt } from "react-icons/bi";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { LuCalendarOff } from "react-icons/lu";
import { DestinationTicketCard } from "@/components/DestinationTicketCard";
import { FlightSearch } from "@/components/FlightSearch";
import { SiteFooter } from "@/components/SiteFooter";
import { Topbar } from "@/components/Topbar";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppSelector } from "@/store/hooks";
import { env } from "@/lib/env";
import { toast } from "@/lib/toast";
import { SITE_DEFAULT_TO_CITY, SITE_PRIMARY_FROM_CITY } from "@/lib/siteDefaults";
import type { FlightOffer } from "@/lib/types";

const visibleTickets = 2;

export function FlightRouteSearchClient() {
  const searchParams = useSearchParams();
  const persistedSearchForm = useAppSelector((s) => s.flights.searchForm);
  const lastQuery = useAppSelector((s) => s.flights.lastQuery);
  const { t } = useI18n();
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };

  const fromCity =
    searchParams.get("from")?.trim() ||
    lastQuery?.from?.trim() ||
    persistedSearchForm.from.trim() ||
    SITE_PRIMARY_FROM_CITY;
  const toCity =
    searchParams.get("to")?.trim() ||
    lastQuery?.to?.trim() ||
    persistedSearchForm.to.trim() ||
    SITE_DEFAULT_TO_CITY;

  const currencyCode = useAppSelector((s) => s.locale.currency);
  const [offers, setOffers] = useState<FlightOffer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const tickets = useMemo(() => {
    return offers.map((offer, idx) => {
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
        currencyCode: String(offer.price.currency || currencyCode || "USD").toUpperCase(),
        toCity,
        dateLabel,
        timeRange,
        durationMeta: `${hours}h ${mins}m · ${totalStops === 0 ? "direct" : `${totalStops} stop${totalStops > 1 ? "s" : ""}`}`,
        layoverText: totalStops > 0 ? `${totalStops} stop${totalStops > 1 ? "s" : ""}` : undefined
      };
    });
  }, [currencyCode, offers, toCity]);
  const resultCurrencyCode = useMemo(
    () => String(offers[0]?.price?.currency || currencyCode || "USD").toUpperCase(),
    [offers, currencyCode]
  );
  const [ticketStart, setTicketStart] = useState(0);
  const [activeNav, setActiveNav] = useState<"cheapest" | "noDirect">("cheapest");
  const cheapestRef = useRef<HTMLElement | null>(null);
  const noDirectRef = useRef<HTMLElement | null>(null);

  const maxTicketStart = Math.max(0, tickets.length - visibleTickets);
  const showTicketSlider = tickets.length > visibleTickets;

  useEffect(() => {
    setTicketStart(0);
  }, [fromCity, toCity]);

  useEffect(() => {
    const from = fromCity.trim();
    const to = toCity.trim();
    if (!from || !to) {
      setOffers([]);
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    void fetch(`${env.apiBaseUrl}/api/flights/search?currency=${encodeURIComponent(String(currencyCode || "USD"))}`, {
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
        if (!res.ok) throw new Error(`search failed (${res.status})`);
        return (await res.json()) as { offers?: FlightOffer[] };
      })
      .then((payload) => {
        setOffers(Array.isArray(payload?.offers) ? payload.offers : []);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setOffers([]);
        toast.error(err instanceof Error ? err.message : t("toast.error.generic"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [currencyCode, fromCity, toCity]);

  useEffect(() => {
    if (ticketStart > maxTicketStart) setTicketStart(maxTicketStart);
  }, [maxTicketStart, ticketStart]);

  function scrollToSection(which: "cheapest" | "noDirect") {
    setActiveNav(which);
    const el = which === "cheapest" ? cheapestRef.current : noDirectRef.current;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="flex min-h-dvh flex-col bg-slate-50 dark:bg-black">
      <Topbar />
      <section className="sticky top-14 z-40 shrink-0 bg-brand-600 shadow-sm dark:bg-black lg:top-16">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-2">
          <FlightSearch
            key={`${fromCity}-${toCity}`}
            stickyEnabled={false}
            forceCompact
            showBottomActions={false}
            initialFrom={fromCity}
            initialTo={toCity}
          />
        </div>
      </section>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col gap-6 px-4 py-8 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:sticky lg:top-[152px] lg:w-[260px]">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-black dark:ring-white/10">
            <p className={`text-lg font-bold leading-snug text-slate-900 dark:text-white`}>
              {fromCity} – {toCity}
            </p>
            <nav className="mt-5 space-y-1" aria-label={tr("searchRoute.navAria", "Route sections")}>
              <button
                type="button"
                onClick={() => scrollToSection("cheapest")}
                className={[
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition",
                  activeNav === "cheapest"
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200"
                    : "text-slate-700 hover:bg-slate-50 dark:text-white/85 dark:hover:bg-white/10"
                ].join(" ")}
              >
                <span
                  className={[
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full text-white",
                    activeNav === "cheapest" ? "bg-brand-600" : "bg-slate-300 dark:bg-white/20"
                  ].join(" ")}
                >
                  <BiSolidPlaneAlt className="h-4 w-4" />
                </span>
                {tr("searchRoute.cheapestNav", "Cheapest tickets")}
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("noDirect")}
                className={[
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition",
                  activeNav === "noDirect"
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200"
                    : "text-slate-700 hover:bg-slate-50 dark:text-white/85 dark:hover:bg-white/10"
                ].join(" ")}
              >
                <span
                  className={[
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full text-white",
                    activeNav === "noDirect" ? "bg-brand-600" : "bg-slate-300 dark:bg-white/20"
                  ].join(" ")}
                >
                  <LuCalendarOff className="h-4 w-4" />
                </span>
                {tr("searchRoute.noDirectNav", "No direct flights")}
              </button>
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
          <section
            ref={cheapestRef}
            id="route-cheapest"
            className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-black dark:ring-white/10 md:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className={`text-xl font-bold text-slate-900 dark:text-white md:text-2xl`}>
                {tr("destination.cheapestTitle", "Cheapest tickets")}
              </h2>
              {showTicketSlider ? (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTicketStart((s) => Math.max(0, s - 1))}
                    disabled={ticketStart === 0}
                    className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:text-white/80 dark:hover:bg-white/10"
                    aria-label={tr("destination.ticketsPrev", "Previous tickets")}
                  >
                    <FiChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketStart((s) => Math.min(maxTicketStart, s + 1))}
                    disabled={ticketStart >= maxTicketStart}
                    className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:text-white/80 dark:hover:bg-white/10"
                    aria-label={tr("destination.ticketsNext", "Next tickets")}
                  >
                    <FiChevronRight className="h-5 w-5" />
                  </button>
                </div>
              ) : null}
            </div>

            <div className="pb-1 pt-1">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Array.from({ length: visibleTickets }).map((_, idx) => (
                    <div key={`ticket-skeleton-${idx}`} className="h-[180px] animate-pulse rounded-3xl bg-slate-200 dark:bg-white/10" />
                  ))}
                </div>
              ) : null}
              {!isLoading ? (
                tickets.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                    {tr("searchRoute.noCheapestTickets", "No cheapest tickets found for this route right now.")}
                  </div>
                ) : showTicketSlider ? (
                  <div className="overflow-hidden">
                    <div
                      className="flex transition-transform duration-500 ease-out"
                      style={{ transform: `translateX(-${ticketStart * (100 / visibleTickets)}%)` }}
                    >
                      {tickets.map((ticket) => (
                        <div key={ticket.id} className="shrink-0 px-1.5 sm:px-2" style={{ width: `${100 / visibleTickets}%` }}>
                          <DestinationTicketCard
                            ticket={ticket}
                            fromCity={fromCity}
                            currencyCode={resultCurrencyCode}
                            directLabel={tr("destination.ticketDirect", "Direct")}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {tickets.map((ticket) => (
                      <DestinationTicketCard
                        key={ticket.id}
                        ticket={ticket}
                        fromCity={fromCity}
                        currencyCode={resultCurrencyCode}
                        directLabel={tr("destination.ticketDirect", "Direct")}
                      />
                    ))}
                  </div>
                )
              ) : null}
            </div>
          </section>

          <section
            ref={noDirectRef}
            id="route-no-direct"
            className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-black dark:ring-white/10 md:p-6"
          >
            <h2 className={`mb-3 text-xl font-bold text-slate-900 dark:text-white md:text-2xl`}>
              {tr("searchRoute.noDirectNav", "No direct flights")}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-white/65">
              {tr(
                "searchRoute.noDirectBody",
                "Try searching for tickets with layovers or changing the departure airport."
              )}
            </p>
          </section>
        </div>
      </div>
      </div>

      <SiteFooter />
    </main>
  );
}
