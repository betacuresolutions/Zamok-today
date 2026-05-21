"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiRepeat } from "react-icons/fi";
import { BusDepartureDatePicker } from "@/components/date/BusDepartureDatePicker";
import { MobileDateRangePicker } from "@/components/date/MobileDateRangePicker";
import { BusLocationField } from "@/components/buses/BusLocationField";
import { BusSearchBottomBar } from "@/components/search/BusSearchBottomBar";
import {
  MobileSearchCard,
  MobileSearchMetaRow,
  MobileSearchSubmitButton,
  MobileRouteFields,
  mobileSearchBottomBarClass
} from "@/components/search/MobileSearchBar";
import {
  busesSearchGridClass,
  searchBarMaxWidthClass,
  searchBtnClass
} from "@/components/search/searchFieldStyles";
import { useI18n, useT } from "@/i18n/I18nProvider";
import { formatBusDepartureDisplay } from "@/lib/dateRange";
import {
  buildBusSearchResultsHref,
  defaultBusDepartYmd,
  type BusSearchForm
} from "@/lib/busSearch";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setBusLastQuery, setBusPreferences, setBusSearchForm } from "@/store/busesSlice";
import { toast } from "@/lib/toast";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export function BusSearch({
  usePersistedSearchForm = true,
  forceCompact = false,
  showBottomActions = true,
  showFindHotelsToggle = true,
  initialForm
}: {
  usePersistedSearchForm?: boolean;
  forceCompact?: boolean;
  showBottomActions?: boolean;
  showFindHotelsToggle?: boolean;
  initialForm?: Partial<BusSearchForm>;
}) {
  const t = useT();
  const { lang } = useI18n();
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const dispatch = useAppDispatch();
  const router = useRouter();
  const persisted = useAppSelector((s) => s.buses.searchForm);
  const preferences = useAppSelector((s) => s.buses.preferences);
  const preferInitial = Boolean(initialForm && Object.keys(initialForm).length > 0);

  const [form, setForm] = useState<BusSearchForm>(() => {
    const defaults: BusSearchForm = {
      from: "",
      to: "",
      departDate: defaultBusDepartYmd(),
      findHotelsAtDestination: false
    };
    if (preferInitial && initialForm) {
      return { ...defaults, ...initialForm, departDate: initialForm.departDate || defaults.departDate };
    }
    if (usePersistedSearchForm) {
      return {
        ...defaults,
        ...persisted,
        departDate: persisted.departDate || defaults.departDate
      };
    }
    return defaults;
  });

  const [openBookingInNewTab, setOpenBookingInNewTab] = useState(preferences.openBookingInNewTab);
  const [openPanel, setOpenPanel] = useState<"dates" | null>(null);
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

  function patchForm(patch: Partial<BusSearchForm>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function persistForm() {
    dispatch(setBusSearchForm(form));
    dispatch(setBusPreferences({ openBookingInNewTab }));
  }

  function updateOpenBookingInNewTab(checked: boolean) {
    setOpenBookingInNewTab(checked);
    dispatch(setBusPreferences({ openBookingInNewTab: checked }));
  }

  function onSearch() {
    const from = form.from.trim();
    const to = form.to.trim();
    if (!from) {
      toast.error(tr("search.buses.fromRequired", "Enter a departure city"));
      return;
    }
    if (!to) {
      toast.error(tr("search.buses.toRequired", "Enter a destination"));
      return;
    }
    if (!form.departDate) {
      toast.error(tr("search.buses.departDateRequired", "Select a departure date"));
      return;
    }
    const query = { ...form, from, to };
    persistForm();
    dispatch(setBusLastQuery(query));
    const href = buildBusSearchResultsHref(query);
    if (openBookingInNewTab) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(href);
  }

  function swapLocations() {
    setForm((f) => ({ ...f, from: f.to, to: f.from }));
  }

  const locationPlaceholder = tr(
    "search.buses.locationPlaceholder",
    "City or bus terminal"
  );
  const canSwap = Boolean(form.from.trim() && form.to.trim());
  const mobileDepartLabel = form.departDate
    ? formatBusDepartureDisplay(form.departDate, lang)
    : t("search.departure");

  const bottomBar = showBottomActions ? (
    <BusSearchBottomBar
      findHotelsAtDestination={form.findHotelsAtDestination}
      onFindHotelsAtDestinationChange={(checked) => patchForm({ findHotelsAtDestination: checked })}
      openBookingInNewTab={openBookingInNewTab}
      onOpenBookingInNewTabChange={updateOpenBookingInNewTab}
      showFindHotelsToggle={showFindHotelsToggle}
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
            fromValue={form.from}
            onFromChange={(from) => patchForm({ from })}
            toValue={form.to}
            onToChange={(to) => patchForm({ to })}
            fromPlaceholder={t("search.from")}
            toPlaceholder={t("search.to")}
            canSwap={canSwap}
            onSwap={swapLocations}
            swapAriaLabel={tr("search.buses.swapLocations", "Swap from and to")}
          />
          <MobileSearchMetaRow
            dateLabel={mobileDepartLabel}
            onDateClick={() => {
              setOpenPanel(null);
              setMobileDatesOpen(true);
            }}
            showClearDates={Boolean(form.departDate)}
            onClearDates={() => patchForm({ departDate: "" })}
            clearDatesAriaLabel={tr("search.buses.clearDate", "Clear departure date")}
          />
          {mounted && isMobileViewport && mobileDatesOpen ? (
            <MobileDateRangePicker
              departDate={form.departDate}
              returnDate=""
              initialField="depart"
              departOnly
              onChange={({ departDate }) => patchForm({ departDate })}
              onClose={() => setMobileDatesOpen(false)}
              departureLabel={t("search.departure")}
              returnLabel={t("search.return")}
            />
          ) : null}
        </MobileSearchCard>

        <MobileSearchSubmitButton onClick={onSearch}>{t("search.buses.search")}</MobileSearchSubmitButton>

        {bottomBar ? <div className={mobileSearchBottomBarClass}>{bottomBar}</div> : null}

        {/* Desktop */}
        <div className={busesSearchGridClass}>
          <BusLocationField
            label={t("search.from")}
            value={form.from}
            onChange={(from) => patchForm({ from })}
            placeholder={locationPlaceholder}
          />
          <div className="relative h-[4.75rem]">
            <BusLocationField
              className="h-full"
              label={t("search.to")}
              value={form.to}
              onChange={(to) => patchForm({ to })}
              placeholder={locationPlaceholder}
            />
            {canSwap ? (
              <button
                type="button"
                onClick={swapLocations}
                className="absolute -left-5 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-blue-600 shadow-lg ring-1 ring-blue-100 transition hover:bg-blue-50 dark:bg-zinc-950 dark:text-blue-400 dark:ring-white/10"
                aria-label={tr("search.buses.swapLocations", "Swap from and to")}
              >
                <FiRepeat className="h-5 w-5" />
              </button>
            ) : null}
          </div>
          <BusDepartureDatePicker
            label={t("search.departure")}
            value={form.departDate}
            onChange={(departDate) => patchForm({ departDate })}
            todayLabel={t("search.buses.today")}
            tomorrowLabel={t("search.buses.tomorrow")}
            open={openPanel === "dates"}
            onOpenChange={(o) => setOpenPanel(o ? "dates" : null)}
          />
          <button type="button" onClick={onSearch} className={cn(searchBtnClass, "whitespace-nowrap px-6")}>
            {t("search.buses.search")}
          </button>
        </div>

        {bottomBar ? <div className="mt-3 hidden md:block">{bottomBar}</div> : null}
      </div>
    </div>
  );
}
