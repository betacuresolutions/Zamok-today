"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiRepeat, FiSearch } from "react-icons/fi";
import { CarLocationField } from "@/components/cars/CarLocationField";
import { CarTimeField } from "@/components/cars/CarTimeField";
import { CarDateRangePicker } from "@/components/date/CarDateRangePicker";
import { MobileDateRangePicker } from "@/components/date/MobileDateRangePicker";
import { CarSearchBottomBar } from "@/components/search/CarSearchBottomBar";
import {
  carsSearchGridClass,
  searchBarMaxWidthClass,
  searchBtnClass
} from "@/components/search/searchFieldStyles";
import { useI18n, useT } from "@/i18n/I18nProvider";
import { formatCarDateWithWeekday, parseYmd, toYmd } from "@/lib/dateRange";
import {
  buildCarSearchResultsHref,
  DEFAULT_DRIVER_AGE,
  type CarSearchForm
} from "@/lib/carSearch";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCarLastQuery, setCarPreferences, setCarSearchForm } from "@/store/carsSlice";
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

function defaultPickUpYmd() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toYmd(d);
}

function locationValue(city: string, subtitle: string) {
  return city.trim() || subtitle.trim();
}

export function CarSearch({
  usePersistedSearchForm = true,
  forceCompact = false,
  showBottomActions = true,
  initialForm
}: {
  usePersistedSearchForm?: boolean;
  forceCompact?: boolean;
  showBottomActions?: boolean;
  initialForm?: Partial<CarSearchForm>;
}) {
  const t = useT();
  const { lang } = useI18n();
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const dispatch = useAppDispatch();
  const router = useRouter();
  const persisted = useAppSelector((s) => s.cars.searchForm);
  const preferences = useAppSelector((s) => s.cars.preferences);
  const preferInitial = Boolean(initialForm && Object.keys(initialForm).length > 0);

  const [form, setForm] = useState<CarSearchForm>(() => {
    const pickUpDefault = defaultPickUpYmd();
    const defaults: CarSearchForm = {
      pickUpCity: "",
      pickUpSubtitle: "",
      dropOffCity: "",
      dropOffSubtitle: "",
      pickUpDate: pickUpDefault,
      dropOffDate: addDaysYmd(pickUpDefault, 1),
      pickUpTime: "10:30",
      dropOffTime: "10:30",
      driverAge: DEFAULT_DRIVER_AGE
    };
    if (preferInitial && initialForm) {
      const pickUp = initialForm.pickUpDate || defaults.pickUpDate;
      return {
        ...defaults,
        ...initialForm,
        pickUpDate: pickUp,
        dropOffDate: initialForm.dropOffDate || addDaysYmd(pickUp, 1)
      };
    }
    if (usePersistedSearchForm) {
      const pickUp = persisted.pickUpDate || defaults.pickUpDate;
      return {
        ...defaults,
        ...persisted,
        pickUpDate: pickUp,
        dropOffDate: persisted.dropOffDate || addDaysYmd(pickUp, 1)
      };
    }
    return defaults;
  });

  const [openBookingInNewTab, setOpenBookingInNewTab] = useState(preferences.openBookingInNewTab);
  const [openPanel, setOpenPanel] = useState<"dates" | "pickUpTime" | "dropOffTime" | null>(null);
  const [mobileDatesOpen, setMobileDatesOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    setOpenBookingInNewTab(preferences.openBookingInNewTab);
  }, [preferences.openBookingInNewTab]);

  useEffect(() => {
    function syncViewport() {
      setIsMobileViewport(window.innerWidth < 768);
    }
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (!form.pickUpDate || !form.dropOffDate) return;
    if (parseYmd(form.dropOffDate) && parseYmd(form.pickUpDate) && form.dropOffDate <= form.pickUpDate) {
      setForm((f) => ({ ...f, dropOffDate: addDaysYmd(form.pickUpDate, 1) }));
    }
  }, [form.pickUpDate, form.dropOffDate]);

  function patchForm(patch: Partial<CarSearchForm>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function setPickUpLocation(value: string) {
    patchForm({ pickUpCity: value, pickUpSubtitle: "" });
  }

  function setDropOffLocation(value: string) {
    patchForm({ dropOffCity: value, dropOffSubtitle: "" });
  }

  function persistForm() {
    dispatch(setCarSearchForm(form));
    dispatch(setCarPreferences({ openBookingInNewTab }));
  }

  function updateOpenBookingInNewTab(checked: boolean) {
    setOpenBookingInNewTab(checked);
    dispatch(setCarPreferences({ openBookingInNewTab: checked }));
  }

  function onSearch() {
    const pickUp = locationValue(form.pickUpCity, form.pickUpSubtitle);
    const dropOff = locationValue(form.dropOffCity, form.dropOffSubtitle);
    if (!pickUp) {
      toast.error(tr("search.cars.pickUpRequired", "Enter a pick-up location"));
      return;
    }
    if (!dropOff) {
      toast.error(tr("search.cars.dropOffRequired", "Enter a drop-off location"));
      return;
    }
    if (!form.pickUpDate) {
      toast.error(tr("search.cars.pickUpDateRequired", "Select a pick-up date"));
      return;
    }
    if (!form.dropOffDate) {
      toast.error(tr("search.cars.dropOffDateRequired", "Select a drop-off date"));
      return;
    }
    const query = { ...form, pickUpCity: pickUp, dropOffCity: dropOff, pickUpSubtitle: "", dropOffSubtitle: "" };
    persistForm();
    dispatch(setCarLastQuery(query));
    const href = buildCarSearchResultsHref(query);
    if (openBookingInNewTab) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(href);
  }

  function swapLocations() {
    setForm((f) => ({
      ...f,
      pickUpCity: f.dropOffCity,
      pickUpSubtitle: f.dropOffSubtitle,
      dropOffCity: f.pickUpCity,
      dropOffSubtitle: f.pickUpSubtitle
    }));
  }

  const pickUpDisplay = locationValue(form.pickUpCity, form.pickUpSubtitle);
  const dropOffDisplay = locationValue(form.dropOffCity, form.dropOffSubtitle);
  const mobileDateLabel =
    form.pickUpDate && form.dropOffDate
      ? `${formatCarDateWithWeekday(form.pickUpDate, lang)} – ${formatCarDateWithWeekday(form.dropOffDate, lang)}`
      : t("search.cars.dates");

  const locationPlaceholder = tr("search.cars.locationPlaceholder", "City, airport, or address");

  const bottomBar = showBottomActions ? (
    <CarSearchBottomBar
      driverAge={form.driverAge}
      onDriverAgeChange={(v) => patchForm({ driverAge: v })}
      openBookingInNewTab={openBookingInNewTab}
      onOpenBookingInNewTabChange={updateOpenBookingInNewTab}
    />
  ) : null;

  return (
    <div
      className={cn(
        searchBarMaxWidthClass,
        "flex flex-col justify-center overflow-visible",
        forceCompact ? "gap-3" : "gap-3.5 md:gap-6"
      )}
    >
      <div className="w-full overflow-visible">
        {/* Mobile */}
        <div className="overflow-visible rounded-3xl bg-white text-slate-900 ring-1 ring-black/10 dark:bg-black dark:text-white dark:ring-white/15 md:hidden">
          <div className="relative border-b border-slate-300/90 px-3 py-4 dark:border-white/10">
            <div className="text-xs font-medium text-slate-500">{t("search.cars.pickUpLocation")}</div>
            <input
              value={pickUpDisplay}
              onChange={(e) => setPickUpLocation(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
              placeholder={locationPlaceholder}
            />
          </div>
          <div className="relative border-b border-slate-300/90 px-3 py-4 dark:border-white/10">
            <div className="text-xs font-medium text-slate-500">{t("search.cars.dropOffLocation")}</div>
            <input
              value={dropOffDisplay}
              onChange={(e) => setDropOffLocation(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
              placeholder={locationPlaceholder}
            />
            {pickUpDisplay && dropOffDisplay ? (
              <button
                type="button"
                onClick={swapLocations}
                className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-blue-600 shadow-md ring-1 ring-blue-100 dark:bg-zinc-950 dark:text-blue-400 dark:ring-white/10"
                aria-label={tr("search.cars.swapLocations", "Swap pick-up and drop-off")}
              >
                <FiRepeat className="h-5 w-5" />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpenPanel(null);
              setMobileDatesOpen(true);
            }}
            className="flex w-full border-b border-slate-300/90 px-3 py-4 text-left dark:border-white/10"
          >
            <div className="text-xs font-medium text-slate-500">{t("search.cars.dates")}</div>
            <div className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">{mobileDateLabel}</div>
          </button>
          <div className="grid grid-cols-2 gap-2 border-b border-slate-300/90 p-3 dark:border-white/10">
            <CarTimeField
              label={t("search.cars.pickUpTime")}
              value={form.pickUpTime}
              onChange={(v) => patchForm({ pickUpTime: v })}
              open={openPanel === "pickUpTime"}
              onOpenChange={(o) => setOpenPanel(o ? "pickUpTime" : null)}
            />
            <CarTimeField
              label={t("search.cars.dropOffTime")}
              value={form.dropOffTime}
              onChange={(v) => patchForm({ dropOffTime: v })}
              open={openPanel === "dropOffTime"}
              onOpenChange={(o) => setOpenPanel(o ? "dropOffTime" : null)}
            />
          </div>
          <div className="border-t border-slate-300/90 p-3 dark:border-white/10">
            <button type="button" onClick={onSearch} className={searchBtnClass}>
              <FiSearch className="mr-2 h-5 w-5" aria-hidden />
              {t("search.cars.search")}
            </button>
          </div>
        </div>

        {isMobileViewport && mobileDatesOpen ? (
          <MobileDateRangePicker
            departDate={form.pickUpDate}
            returnDate={form.dropOffDate}
            initialField="depart"
            cycleRangeOnDayClick
            onChange={({ departDate, returnDate }) => patchForm({ pickUpDate: departDate, dropOffDate: returnDate })}
            onClose={() => setMobileDatesOpen(false)}
            departureLabel={t("search.cars.pickUpDate")}
            returnLabel={t("search.cars.dropOffDate")}
          />
        ) : null}

        {bottomBar ? <div className="mt-4 md:hidden">{bottomBar}</div> : null}

        {/* Desktop — full 1440px width */}
        <div className={carsSearchGridClass}>
          <CarLocationField
            label={t("search.cars.pickUpLocation")}
            value={pickUpDisplay}
            onChange={setPickUpLocation}
            placeholder={locationPlaceholder}
          />
          <div className="relative h-[4.75rem]">
            <CarLocationField
              className="h-full"
              label={t("search.cars.dropOffLocation")}
              value={dropOffDisplay}
              onChange={setDropOffLocation}
              placeholder={locationPlaceholder}
            />
            {pickUpDisplay && dropOffDisplay ? (
              <button
                type="button"
                onClick={swapLocations}
                className="absolute -left-5 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-blue-600 shadow-lg ring-1 ring-blue-100 transition hover:bg-blue-50 dark:bg-zinc-950 dark:text-blue-400 dark:ring-white/10"
                aria-label={tr("search.cars.swapLocations", "Swap pick-up and drop-off")}
              >
                <FiRepeat className="h-5 w-5" />
              </button>
            ) : null}
          </div>
          <CarDateRangePicker
            pickUpDate={form.pickUpDate}
            dropOffDate={form.dropOffDate}
            onChange={(pickUpDate, dropOffDate) => patchForm({ pickUpDate, dropOffDate })}
            pickUpLabel={t("search.cars.pickUpDate")}
            dropOffLabel={t("search.cars.dropOffDate")}
            clearLabel={tr("search.cars.clearDates", "Clear dates")}
            open={openPanel === "dates"}
            onOpenChange={(o) => setOpenPanel(o ? "dates" : null)}
          />
          <CarTimeField
            label={t("search.cars.pickUpTime")}
            value={form.pickUpTime}
            onChange={(v) => patchForm({ pickUpTime: v })}
            open={openPanel === "pickUpTime"}
            onOpenChange={(o) => setOpenPanel(o ? "pickUpTime" : null)}
          />
          <CarTimeField
            label={t("search.cars.dropOffTime")}
            value={form.dropOffTime}
            onChange={(v) => patchForm({ dropOffTime: v })}
            open={openPanel === "dropOffTime"}
            onOpenChange={(o) => setOpenPanel(o ? "dropOffTime" : null)}
          />
          <button type="button" onClick={onSearch} className={cn(searchBtnClass, "whitespace-nowrap")}>
            {t("search.cars.search")}
          </button>
        </div>

        {bottomBar ? <div className="mt-3 hidden md:block">{bottomBar}</div> : null}
      </div>
    </div>
  );
}
