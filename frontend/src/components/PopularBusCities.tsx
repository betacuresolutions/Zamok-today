"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useT } from "@/i18n/I18nProvider";
import { FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import { MdDirectionsBus } from "react-icons/md";
import { buildBusSearchResultsHref } from "@/lib/busSearch";
import { busCityImageFromIata, POPULAR_BUS_CITIES } from "@/lib/popularBusCities";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setBusSearchForm } from "@/store/busesSlice";

const BLANK_IMAGE = "/Images/blank.webp";

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

export function PopularBusCities() {
  const t = useT();
  const dispatch = useAppDispatch();
  const currencyCode = useAppSelector((s) => s.locale.currency);
  const searchForm = useAppSelector((s) => s.buses.searchForm);
  const [start, setStart] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [allOpen, setAllOpen] = useState(false);

  useEffect(() => {
    function updateVisibleCount() {
      const w = window.innerWidth;
      if (w >= 1024) setVisibleCount(4);
      else if (w >= 640) setVisibleCount(2);
      else setVisibleCount(1);
    }
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  const maxStart = Math.max(0, POPULAR_BUS_CITIES.length - visibleCount);

  useEffect(() => {
    if (start > maxStart) setStart(maxStart);
  }, [maxStart, start]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setAllOpen(false);
    }
    if (allOpen) {
      document.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [allOpen]);

  function BusCityCard({ city }: { city: (typeof POPULAR_BUS_CITIES)[number] }) {
    const imageUrl = busCityImageFromIata(city.iata);
    const [imageSrc, setImageSrc] = useState(imageUrl || BLANK_IMAGE);
    const label = t(city.nameKey);
    const formattedPrice = formatPriceByCurrency(city.fromPrice, currencyCode);
    const href = buildBusSearchResultsHref({
      from: searchForm.from,
      to: city.searchDestination,
      departDate: searchForm.departDate,
      findHotelsAtDestination: searchForm.findHotelsAtDestination
    });

    useEffect(() => {
      setImageSrc(imageUrl || BLANK_IMAGE);
    }, [imageUrl]);

    const cardContent = (
      <article className="group h-full overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-black">
        <div className="relative h-44">
          <Image
            src={imageSrc}
            alt={`${label} (${city.iata})`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            onError={() => {
              if (imageSrc !== BLANK_IMAGE) setImageSrc(BLANK_IMAGE);
            }}
          />
          <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 dark:bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_55%)]" />
        </div>
        <div className="p-4">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">{label}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-white/70">
            <span className="inline-flex items-center gap-2">
              <MdDirectionsBus className="h-4 w-4 shrink-0 text-slate-600 dark:text-white/80" aria-hidden />
              {t("common.from")}{" "}
              <span className="font-semibold text-slate-700 dark:text-white">{formattedPrice}</span>
            </span>
          </div>
        </div>
      </article>
    );

    return (
      <Link
        href={href}
        onClick={() =>
          dispatch(
            setBusSearchForm({
              to: city.searchDestination
            })
          )
        }
        className="block h-full rounded-2xl outline-none ring-brand-600/0 transition hover:ring-2 focus-visible:ring-2 focus-visible:ring-brand-600"
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <>
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-black dark:ring-white/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-3xl font-semibold text-slate-900 dark:text-white">
              {t("popularBuses.title")}
            </div>
            <div className="mt-1 text-sm text-slate-500 dark:text-white/70">{t("popularBuses.subtitle")}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStart((s) => Math.max(0, s - 1))}
              disabled={start === 0}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:text-white/80 dark:hover:bg-white/5"
              aria-label="Previous"
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setStart((s) => Math.min(maxStart, s + 1))}
              disabled={start >= maxStart}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:text-white/80 dark:hover:bg-white/5"
              aria-label="Next"
            >
              <FiChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${start * (100 / visibleCount)}%)` }}
          >
            {POPULAR_BUS_CITIES.map((city) => (
              <div
                key={city.id}
                className="shrink-0 px-2"
                style={{ width: `${100 / visibleCount}%` }}
              >
                <BusCityCard city={city} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setAllOpen(true)}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-100 px-6 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
          >
            {t("popularBuses.all")}
          </button>
        </div>
      </section>

      {allOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-0 md:p-4"
          onClick={() => setAllOpen(false)}
        >
          <div
            className="flex h-full w-full max-h-[100dvh] flex-col overflow-hidden rounded-none bg-white p-4 shadow-2xl dark:bg-black md:max-h-[88dvh] md:max-w-[1100px] md:rounded-3xl md:p-6 md:ring-1 md:ring-slate-200 md:dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-20 mb-4 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 pb-3 backdrop-blur dark:border-white/10 dark:bg-black/95">
              <div className="text-3xl font-semibold text-slate-900 dark:text-white">
                {t("popularBuses.title")}
              </div>
              <button
                type="button"
                onClick={() => setAllOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/15 dark:text-white/80 dark:hover:bg-white/5"
                aria-label={t("nav.menu.close")}
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-4 pb-2 sm:grid-cols-2 lg:grid-cols-3">
                {POPULAR_BUS_CITIES.map((city) => (
                  <BusCityCard key={`modal-${city.id}`} city={city} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
