"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiRepeat } from "react-icons/fi";
import { CarLocationField } from "@/components/cars/CarLocationField";
import { CarTimeField } from "@/components/cars/CarTimeField";
import { CarDateRangePicker } from "@/components/date/CarDateRangePicker";
import { MobileDateRangePicker } from "@/components/date/MobileDateRangePicker";
import { CarSearchBottomBar } from "@/components/search/CarSearchBottomBar";
import {
  MobileSearchCard,
  MobileSearchMetaRow,
  MobileSearchSubmitButton,
  MobileRouteFields,
  mobileSearchBottomBarClass
} from "@/components/search/MobileSearchBar";
import {
  carsSearchGridClass,
  searchBarMaxWidthClass,
  searchBtnClass
} from "@/components/search/searchFieldStyles";
import { useI18n, useT } from "@/i18n/I18nProvider";
import { addDaysYmd, formatCarDateWithWeekday, parseYmd, toYmd } from "@/lib/dateRange";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setOpenBookingInNewTab(preferences.openBookingInNewTab);
  }, [preferences.openBookingInNewTab]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    function syncViewport() {
      setIsMobileViewport(window.innerWidth < 768);
    }
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, [mounted]);

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
        {/* Mobile — flights-style card */}
        <MobileSearchCard>
          <MobileRouteFields
            fromValue={pickUpDisplay}
            onFromChange={setPickUpLocation}
            toValue={dropOffDisplay}
            onToChange={setDropOffLocation}
            fromPlaceholder={t("search.cars.pickUpLocation")}
            toPlaceholder={t("search.cars.dropOffLocation")}
            canSwap={Boolean(pickUpDisplay && dropOffDisplay)}
            onSwap={swapLocations}
            swapAriaLabel={tr("search.cars.swapLocations", "Swap pick-up and drop-off")}
          />
          <MobileSearchMetaRow
            dateLabel={mobileDateLabel}
            onDateClick={() => {
              setOpenPanel(null);
              setMobileDatesOpen(true);
            }}
            showClearDates={Boolean(form.pickUpDate || form.dropOffDate)}
            onClearDates={() => patchForm({ pickUpDate: "", dropOffDate: "" })}
            clearDatesAriaLabel={tr("search.cars.clearDates", "Clear dates")}
          />
          <div className="grid grid-cols-2 gap-2 border-t border-slate-300/90 px-3 py-3 dark:border-white/10">
            <CarTimeField
              layout="mobile"
              className="!h-auto min-h-0 py-2"
              label={t("search.cars.pickUpTime")}
              value={form.pickUpTime}
              onChange={(v) => patchForm({ pickUpTime: v })}
              open={openPanel === "pickUpTime"}
              onOpenChange={(o) => setOpenPanel(o ? "pickUpTime" : null)}
            />
            <CarTimeField
              layout="mobile"
              className="!h-auto min-h-0 py-2"
              label={t("search.cars.dropOffTime")}
              value={form.dropOffTime}
              onChange={(v) => patchForm({ dropOffTime: v })}
              open={openPanel === "dropOffTime"}
              onOpenChange={(o) => setOpenPanel(o ? "dropOffTime" : null)}
            />
          </div>
          {mounted && isMobileViewport && mobileDatesOpen ? (
            <MobileDateRangePicker
              departDate={form.pickUpDate}
              returnDate={form.dropOffDate}
              initialField="depart"
              onChange={({ departDate, returnDate }) =>
                patchForm({ pickUpDate: departDate, dropOffDate: returnDate })
              }
              onClose={() => setMobileDatesOpen(false)}
              departureLabel={t("search.cars.pickUpDate")}
              returnLabel={t("search.cars.dropOffDate")}
            />
          ) : null}
        </MobileSearchCard>

        <MobileSearchSubmitButton onClick={onSearch}>{t("search.cars.search")}</MobileSearchSubmitButton>

        {bottomBar ? <div className={mobileSearchBottomBarClass}>{bottomBar}</div> : null}

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
            layout="desktop"
            label={t("search.cars.pickUpTime")}
            value={form.pickUpTime}
            onChange={(v) => patchForm({ pickUpTime: v })}
            open={openPanel === "pickUpTime"}
            onOpenChange={(o) => setOpenPanel(o ? "pickUpTime" : null)}
          />
          <CarTimeField
            layout="desktop"
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
