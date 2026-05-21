"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiRepeat, FiUser } from "react-icons/fi";
import { FerryDateRangePicker } from "@/components/date/FerryDateRangePicker";
import { MobileDateRangePicker } from "@/components/date/MobileDateRangePicker";
import { FerryLocationField } from "@/components/ferries/FerryLocationField";
import { FerryPassengersPicker } from "@/components/ferries/FerryPassengersPicker";
import { FerrySearchBottomBar } from "@/components/search/FerrySearchBottomBar";
import {
  MobileSearchCard,
  MobileSearchMetaRow,
  MobileSearchSecondaryRow,
  MobileSearchSubmitButton,
  MobileRouteFields,
  mobileSearchBottomBarClass
} from "@/components/search/MobileSearchBar";
import {
  ferriesSearchGridClass,
  searchBarMaxWidthClass,
  searchBtnClass
} from "@/components/search/searchFieldStyles";
import { useI18n, useT } from "@/i18n/I18nProvider";
import { formatFerryDateDisplay } from "@/lib/dateRange";
import { defaultFerryPassengers, isValidFerryPassengers, normalizeFerryPassengers } from "@/lib/ferryPassengers";
import {
  addDaysYmd,
  buildFerrySearchResultsHref,
  defaultFerryDepartYmd,
  defaultFerryReturnYmd,
  type FerrySearchForm,
  type FerryTripType
} from "@/lib/ferrySearch";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setFerryLastQuery, setFerryPreferences, setFerrySearchForm } from "@/store/ferriesSlice";
import { toast } from "@/lib/toast";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export function FerrySearch({
  usePersistedSearchForm = true,
  forceCompact = false,
  showBottomActions = true,
  initialForm
}: {
  usePersistedSearchForm?: boolean;
  forceCompact?: boolean;
  showBottomActions?: boolean;
  initialForm?: Partial<FerrySearchForm>;
}) {
  const t = useT();
  const { lang } = useI18n();
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const dispatch = useAppDispatch();
  const router = useRouter();
  const persisted = useAppSelector((s) => s.ferries.searchForm);
  const preferences = useAppSelector((s) => s.ferries.preferences);
  const preferInitial = Boolean(initialForm && Object.keys(initialForm).length > 0);

  const [form, setForm] = useState<FerrySearchForm>(() => {
    const depart = defaultFerryDepartYmd();
    const defaults: FerrySearchForm = {
      tripType: "roundTrip",
      from: "",
      to: "",
      departDate: depart,
      returnDate: defaultFerryReturnYmd(depart),
      passengers: defaultFerryPassengers()
    };
    if (preferInitial && initialForm) {
      return {
        ...defaults,
        ...initialForm,
        departDate: initialForm.departDate || defaults.departDate,
        returnDate: initialForm.returnDate || defaults.returnDate,
        passengers: normalizeFerryPassengers(initialForm.passengers ?? defaults.passengers)
      };
    }
    if (usePersistedSearchForm) {
      return {
        ...defaults,
        ...persisted,
        departDate: persisted.departDate || defaults.departDate,
        returnDate: persisted.returnDate || defaults.returnDate,
        passengers: normalizeFerryPassengers(persisted.passengers)
      };
    }
    return defaults;
  });

  const [openBookingInNewTab, setOpenBookingInNewTab] = useState(preferences.openBookingInNewTab);
  const [openPanel, setOpenPanel] = useState<"dates" | "passengers" | null>(null);
  const [mobileDatesOpen, setMobileDatesOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isRoundTrip = form.tripType === "roundTrip";

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

  function patchForm(patch: Partial<FerrySearchForm>) {
    setForm((f) => {
      const next = { ...f, ...patch };
      if (patch.passengers) {
        next.passengers = normalizeFerryPassengers(patch.passengers);
      }
      if (patch.tripType === "roundTrip" && !next.returnDate && next.departDate) {
        next.returnDate = defaultFerryReturnYmd(next.departDate);
      }
      if (patch.departDate && next.returnDate && next.returnDate <= next.departDate) {
        next.returnDate = addDaysYmd(next.departDate, 1);
      }
      return next;
    });
  }

  function setTripType(tripType: FerryTripType) {
    patchForm({ tripType });
  }

  function persistForm() {
    dispatch(setFerrySearchForm(form));
    dispatch(setFerryPreferences({ openBookingInNewTab }));
  }

  function updateOpenBookingInNewTab(checked: boolean) {
    setOpenBookingInNewTab(checked);
    dispatch(setFerryPreferences({ openBookingInNewTab: checked }));
  }

  function onSearch() {
    const from = form.from.trim();
    const to = form.to.trim();
    if (!from) {
      toast.error(tr("search.ferries.fromRequired", "Enter a departure port"));
      return;
    }
    if (!to) {
      toast.error(tr("search.ferries.toRequired", "Enter a destination port"));
      return;
    }
    if (!form.departDate) {
      toast.error(tr("search.ferries.departDateRequired", "Select a departure date"));
      return;
    }
    if (isRoundTrip && !form.returnDate) {
      toast.error(tr("search.ferries.returnDateRequired", "Select a return date"));
      return;
    }
    if (isRoundTrip && form.returnDate <= form.departDate) {
      toast.error(tr("search.ferries.returnAfterDepart", "Return date must be after departure"));
      return;
    }
    if (!isValidFerryPassengers(form.passengers)) {
      toast.error(tr("search.ferries.passengersInvalid", "Check passenger selection"));
      return;
    }
    const query = { ...form, from, to };
    persistForm();
    dispatch(setFerryLastQuery(query));
    const href = buildFerrySearchResultsHref(query);
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
    "search.ferries.locationPlaceholder",
    "City or ferry port"
  );
  const canSwap = Boolean(form.from.trim() && form.to.trim());
  const mobileDateLabel =
    [form.departDate, form.returnDate]
      .filter(Boolean)
      .map((ymd) => formatFerryDateDisplay(ymd, lang))
      .join(" – ") || t("search.departure");

  const bottomBar = showBottomActions ? (
    <FerrySearchBottomBar
      tripType={form.tripType}
      onTripTypeChange={setTripType}
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
            fromValue={form.from}
            onFromChange={(from) => patchForm({ from })}
            toValue={form.to}
            onToChange={(to) => patchForm({ to })}
            fromPlaceholder={locationPlaceholder}
            toPlaceholder={locationPlaceholder}
            canSwap={canSwap}
            onSwap={swapLocations}
            swapAriaLabel={tr("search.ferries.swapLocations", "Swap from and to")}
          />
          <MobileSearchMetaRow
            dateLabel={mobileDateLabel}
            onDateClick={() => {
              setOpenPanel(null);
              setMobileDatesOpen(true);
            }}
            showClearDates={Boolean(form.departDate || form.returnDate)}
            onClearDates={() => patchForm({ departDate: "", returnDate: "" })}
            clearDatesAriaLabel={tr("search.ferries.clearDates", "Clear dates")}
          />
          <MobileSearchSecondaryRow
            icon={<FiUser className="h-5 w-5 shrink-0 text-slate-500 dark:text-white/70" aria-hidden />}
          >
            <FerryPassengersPicker
              layout="mobile"
              compact
              value={form.passengers}
              onChange={(passengers) => patchForm({ passengers })}
              open={openPanel === "passengers"}
              onOpenChange={(o) => setOpenPanel(o ? "passengers" : null)}
            />
          </MobileSearchSecondaryRow>
          {mounted && isMobileViewport && mobileDatesOpen ? (
            <MobileDateRangePicker
              departDate={form.departDate}
              returnDate={form.returnDate}
              initialField="depart"
              onChange={({ departDate, returnDate }) => patchForm({ departDate, returnDate })}
              onClose={() => setMobileDatesOpen(false)}
              departureLabel={t("search.departure")}
              returnLabel={t("search.return")}
            />
          ) : null}
        </MobileSearchCard>

        <MobileSearchSubmitButton onClick={onSearch}>{t("search.ferries.search")}</MobileSearchSubmitButton>

        {bottomBar ? <div className={mobileSearchBottomBarClass}>{bottomBar}</div> : null}

        {/* Desktop */}
        <div className={ferriesSearchGridClass}>
          <FerryLocationField
            label={t("search.from")}
            value={form.from}
            onChange={(from) => patchForm({ from })}
            placeholder={locationPlaceholder}
          />
          <div className="relative h-[4.75rem]">
            <FerryLocationField
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
                aria-label={tr("search.ferries.swapLocations", "Swap from and to")}
              >
                <FiRepeat className="h-5 w-5" />
              </button>
            ) : null}
          </div>
          <FerryDateRangePicker
            departDate={form.departDate}
            returnDate={form.returnDate}
            onChange={(departDate, returnDate) => patchForm({ departDate, returnDate })}
            departLabel={t("search.departure")}
            returnLabel={t("search.return")}
            clearLabel={tr("search.ferries.clearDates", "Clear dates")}
            open={openPanel === "dates"}
            onOpenChange={(o) => setOpenPanel(o ? "dates" : null)}
          />
          <FerryPassengersPicker
            layout="desktop"
            value={form.passengers}
            onChange={(passengers) => patchForm({ passengers })}
            open={openPanel === "passengers"}
            onOpenChange={(o) => setOpenPanel(o ? "passengers" : null)}
          />
          <button type="button" onClick={onSearch} className={cn(searchBtnClass, "whitespace-nowrap px-6")}>
            {t("search.ferries.search")}
          </button>
        </div>

        {bottomBar ? <div className="mt-3 hidden md:block">{bottomBar}</div> : null}
      </div>
    </div>
  );
}
