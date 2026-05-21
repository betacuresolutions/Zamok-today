"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiMapPin, FiSearch } from "react-icons/fi";
import { HotelDateRangePicker } from "@/components/date/HotelDateRangePicker";
import { MobileDateRangePicker } from "@/components/date/MobileDateRangePicker";
import { HotelsGuestsPicker } from "@/components/HotelsGuestsPicker";
import { HotelSearchBottomBar } from "@/components/search/HotelSearchBottomBar";
import { useI18n, useT } from "@/i18n/I18nProvider";
import { formatHotelStayRangeLabel, parseYmd, toYmd } from "@/lib/dateRange";
import { buildHotelSearchResultsHref, type HotelGuestsState } from "@/lib/hotelSearch";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setHotelLastQuery, setHotelPreferences, setHotelSearchForm } from "@/store/hotelsSlice";
import { toast } from "@/lib/toast";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function addDaysYmd(ymd: string, days: number) {
  const dt = parseYmd(ymd);
  if (!dt) return "";
  dt.setDate(dt.getDate() + days);
  return toYmd(dt);
}

function defaultCheckInYmd() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toYmd(d);
}

const fieldShell =
  "relative flex min-h-[4.5rem] flex-col justify-center overflow-visible rounded-2xl bg-white px-4 py-3 ring-1 ring-black/10 dark:bg-black dark:ring-white/15";

const searchBtnClass =
  "flex w-full min-h-[4.5rem] items-center justify-center rounded-2xl bg-[#ff8021] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#f07310] active:bg-[#e56a0c] ring-1 ring-black/5 dark:ring-white/10";

export function HotelSearch({
  usePersistedSearchForm = true,
  forceCompact = false,
  showBottomActions = true,
  initialDestination = "",
  initialCheckIn = "",
  initialCheckOut = "",
  initialGuests
}: {
  usePersistedSearchForm?: boolean;
  forceCompact?: boolean;
  showBottomActions?: boolean;
  initialDestination?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: HotelGuestsState;
}) {
  const t = useT();
  const { lang } = useI18n();
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const dispatch = useAppDispatch();
  const router = useRouter();
  const persisted = useAppSelector((s) => s.hotels.searchForm);
  const preferences = useAppSelector((s) => s.hotels.preferences);
  const preferInitial =
    Boolean(initialDestination.trim()) ||
    Boolean(initialCheckIn) ||
    Boolean(initialCheckOut) ||
    Boolean(initialGuests);

  const [destination, setDestination] = useState(
    preferInitial
      ? initialDestination
      : usePersistedSearchForm
        ? persisted.destination
        : ""
  );
  const [checkIn, setCheckIn] = useState(
    preferInitial
      ? initialCheckIn || defaultCheckInYmd()
      : usePersistedSearchForm
        ? persisted.checkIn || defaultCheckInYmd()
        : defaultCheckInYmd()
  );
  const [checkOut, setCheckOut] = useState(
    preferInitial
      ? initialCheckOut || addDaysYmd(initialCheckIn || defaultCheckInYmd(), 1)
      : usePersistedSearchForm
        ? persisted.checkOut || addDaysYmd(persisted.checkIn || defaultCheckInYmd(), 1)
        : addDaysYmd(defaultCheckInYmd(), 1)
  );
  const [guests, setGuests] = useState<HotelGuestsState>(
    preferInitial
      ? initialGuests || { adults: 2, children: 0, rooms: 1 }
      : usePersistedSearchForm
        ? persisted.guests
        : { adults: 2, children: 0, rooms: 1 }
  );
  const [travelForWork, setTravelForWork] = useState(preferences.travelForWork);
  const [openBookingInNewTab, setOpenBookingInNewTab] = useState(preferences.openBookingInNewTab);
  const [mobileDatesOpen, setMobileDatesOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    setTravelForWork(preferences.travelForWork);
    setOpenBookingInNewTab(preferences.openBookingInNewTab);
  }, [preferences.travelForWork, preferences.openBookingInNewTab]);

  useEffect(() => {
    function syncViewport() {
      setIsMobileViewport(window.innerWidth < 768);
    }
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (!checkIn || !checkOut) return;
    if (parseYmd(checkOut) && parseYmd(checkIn) && checkOut <= checkIn) {
      setCheckOut(addDaysYmd(checkIn, 1));
    }
  }, [checkIn, checkOut]);

  const mobileDateLabel =
    formatHotelStayRangeLabel(checkIn, checkOut, lang) || t("search.hotels.dates");

  function persistPreferences() {
    dispatch(
      setHotelPreferences({
        travelForWork,
        openBookingInNewTab
      })
    );
  }

  function persistForm() {
    dispatch(
      setHotelSearchForm({
        destination,
        checkIn,
        checkOut,
        guests
      })
    );
    persistPreferences();
  }

  function updateTravelForWork(checked: boolean) {
    setTravelForWork(checked);
    dispatch(setHotelPreferences({ travelForWork: checked }));
  }

  function updateOpenBookingInNewTab(checked: boolean) {
    setOpenBookingInNewTab(checked);
    dispatch(setHotelPreferences({ openBookingInNewTab: checked }));
  }

  function onSearch() {
    const dest = destination.trim();
    if (!dest) {
      toast.error(tr("search.hotels.destinationRequired", "Enter a destination or hotel"));
      return;
    }
    if (!checkIn) {
      toast.error(tr("search.hotels.checkInRequired", "Select a check-in date"));
      return;
    }
    if (!checkOut) {
      toast.error(tr("search.hotels.checkOutRequired", "Select a check-out date"));
      return;
    }
    const query = {
      destination: dest,
      checkIn,
      checkOut,
      adults: guests.adults,
      children: guests.children,
      rooms: guests.rooms
    };
    persistForm();
    dispatch(setHotelLastQuery(query));
    const href = buildHotelSearchResultsHref(query);
    if (openBookingInNewTab) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(href);
  }

  const bottomBar = showBottomActions ? (
    <HotelSearchBottomBar
      travelForWork={travelForWork}
      onTravelForWorkChange={updateTravelForWork}
      openBookingInNewTab={openBookingInNewTab}
      onOpenBookingInNewTabChange={updateOpenBookingInNewTab}
    />
  ) : null;

  const searchButton = (
    <button type="button" onClick={onSearch} className={searchBtnClass}>
      {t("search.hotels.search")}
    </button>
  );

  return (
    <div
      className={cn(
        "mx-auto w-full overflow-visible flex flex-col justify-center",
        forceCompact ? "gap-3" : "gap-3.5 md:gap-6"
      )}
    >
      <div className="w-full overflow-visible">
        <div className="overflow-hidden rounded-3xl bg-white text-slate-900 ring-1 ring-black/10 dark:bg-black dark:text-white dark:ring-white/15 md:hidden">
          <div className="flex items-center gap-3 border-b border-slate-300/90 px-3 py-4 dark:border-white/10">
            <FiSearch className="h-5 w-5 shrink-0 text-slate-900 dark:text-white/80" />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-slate-500">{t("search.to")}</div>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="mt-1 w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400 dark:placeholder:text-white/35"
                placeholder={tr("search.hotels.destinationPlaceholder", "City, hotel, or area")}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileDatesOpen(true)}
            className="flex w-full items-center gap-3 border-b border-slate-300/90 px-3 py-4 text-left dark:border-white/10"
          >
            <div className="min-w-0 flex-1">
              <div className="text-xs text-slate-500">{t("search.hotels.dates")}</div>
              <div className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">{mobileDateLabel}</div>
            </div>
          </button>
          <div className="flex items-center gap-3 px-3 py-4">
            <FiMapPin className="h-5 w-5 shrink-0 text-slate-500" />
            <div className="min-w-0 flex-1">
              <HotelsGuestsPicker value={guests} onChange={setGuests} />
            </div>
          </div>
          <div className="border-t border-slate-300/90 p-3 dark:border-white/10">{searchButton}</div>
        </div>

        {bottomBar ? <div className="mt-4 md:hidden">{bottomBar}</div> : null}

        {isMobileViewport && mobileDatesOpen ? (
          <MobileDateRangePicker
            departDate={checkIn}
            returnDate={checkOut}
            initialField="depart"
            cycleRangeOnDayClick
            onChange={({ departDate: nextIn, returnDate: nextOut }) => {
              setCheckIn(nextIn);
              setCheckOut(nextOut);
            }}
            onClose={() => setMobileDatesOpen(false)}
            departureLabel={t("search.hotels.checkIn")}
            returnLabel={t("search.hotels.checkOut")}
          />
        ) : null}

        <div className="hidden w-full grid-cols-1 gap-2 overflow-visible md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.75fr)_minmax(8.5rem,10.5rem)_minmax(12.5rem,1.55fr)]">
          <div className={fieldShell}>
            <div className="text-xs font-medium text-slate-500 dark:text-white/50">{t("search.to")}</div>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-white/35"
              placeholder={tr("search.hotels.destinationPlaceholder", "City, hotel, or area")}
            />
          </div>
          <HotelDateRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={(from, to) => {
              setCheckIn(from);
              setCheckOut(to);
            }}
            label={t("search.hotels.dates")}
            placeholder={t("search.hotels.datesPlaceholder")}
            clearLabel={tr("search.hotels.clearDates", "Clear dates")}
          />
          <div className={fieldShell}>
            <HotelsGuestsPicker value={guests} onChange={setGuests} />
          </div>
          <button type="button" onClick={onSearch} className={cn(searchBtnClass, "w-full whitespace-nowrap px-8")}>
            {t("search.hotels.search")}
          </button>
        </div>

        {bottomBar ? <div className="mt-3 hidden md:block">{bottomBar}</div> : null}
      </div>
    </div>
  );
}
