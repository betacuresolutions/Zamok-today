"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiChevronDown, FiPhone, FiSearch, FiX } from "react-icons/fi";
import styles from "@/components/auth/AuthShell.module.css";
import { formatDialCode } from "@/lib/phone";
import { buildPhoneCountryList, type PhoneCountryOption } from "@/lib/phoneCountries";
import { useT } from "@/i18n/I18nProvider";
import { useAppSelector } from "@/store/hooks";

function FlagIcon({ region, className }: { region: string; className?: string }) {
  return (
    <span
      className={[`fi fi-${region.toLowerCase()}`, className].filter(Boolean).join(" ")}
      aria-hidden
    />
  );
}

type PanelCoords = { top: number; left: number; width: number; maxHeight: number };

function computeDialPanelCoords(trigger: HTMLElement): PanelCoords {
  const rect = trigger.getBoundingClientRect();
  const gap = 6;
  const viewportPadding = 12;
  const panelWidth = Math.max(rect.width, 280);
  const preferredHeight = 300;
  const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
  const spaceAbove = rect.top - gap - viewportPadding;
  const openAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
  const maxHeight = Math.min(preferredHeight, Math.max(160, openAbove ? spaceAbove : spaceBelow));
  const top = openAbove ? rect.top - gap - maxHeight : rect.bottom + gap;
  const maxLeft = window.innerWidth - panelWidth - viewportPadding;

  return {
    top: Math.max(viewportPadding, top),
    left: Math.max(viewportPadding, Math.min(rect.left, maxLeft)),
    width: panelWidth,
    maxHeight
  };
}

export function PhoneNumberField({
  id,
  country,
  national,
  onCountryChange,
  onNationalChange,
  disabled
}: {
  id: string;
  country: string;
  national: string;
  onCountryChange: (iso2: string) => void;
  onNationalChange: (value: string) => void;
  disabled?: boolean;
}) {
  const t = useT();
  const localeCountry = useAppSelector((s) => s.locale.country);
  const language = useAppSelector((s) => s.locale.language);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<PanelCoords | null>(null);

  const localeTag = String(language || "en").split("-")[0] || "en";
  const countries = useMemo(() => buildPhoneCountryList(localeTag), [localeTag]);

  useEffect(() => {
    if (country) return;
    const code = String(localeCountry || "TR")
      .trim()
      .toUpperCase();
    if (/^[A-Z]{2}$/.test(code)) onCountryChange(code);
  }, [country, localeCountry, onCountryChange]);

  const selected = useMemo(() => {
    const code = String(country || "")
      .trim()
      .toUpperCase();
    return countries.find((c) => c.code === code) ?? null;
  }, [countries, country]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q.replace(/^\+/, ""))
    );
  }, [countries, query]);

  const updateCoords = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    setCoords(computeDialPanelCoords(el));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  function toggleDialPanel() {
    if (disabled) return;
    if (open) {
      setOpen(false);
      setCoords(null);
      setQuery("");
      return;
    }
    const el = triggerRef.current;
    if (!el) return;
    setCoords(computeDialPanelCoords(el));
    setOpen(true);
  }

  useLayoutEffect(() => {
    if (!open) return;
    updateCoords();
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    const onLayout = () => updateCoords();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointerDown(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  function pick(c: PhoneCountryOption) {
    onCountryChange(c.code);
    setOpen(false);
    setCoords(null);
    setQuery("");
  }

  const dialLabel = selected ? formatDialCode(selected.code) : "+";

  const panel = open && coords ? (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={t("auth.countryCodeLabel")}
      className={styles.phoneDialPanel}
      style={{
        top: coords.top,
        left: coords.left,
        width: coords.width,
        maxHeight: coords.maxHeight
      }}
    >
      <div className={styles.phoneDialPanelHeader}>
        <span>{t("auth.countryCodeLabel")}</span>
        <button type="button" onClick={() => setOpen(false)} aria-label={t("wallet.close")}>
          <FiX className="h-4 w-4" />
        </button>
      </div>
      <div className={styles.phoneDialSearch}>
        <FiSearch className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("locale.searchPlaceholder")}
          autoFocus
        />
      </div>
      <ul role="listbox" className={styles.phoneDialList}>
        {filtered.length === 0 ? (
          <li className={styles.phoneDialEmpty}>{t("wallet.countryNoResults")}</li>
        ) : (
          filtered.map((c) => (
            <li key={c.code} role="option" aria-selected={c.code === country}>
              <button type="button" onClick={() => pick(c)}>
                <FlagIcon region={c.code} className={styles.phoneDialFlagIcon} />
                <span className={styles.phoneDialName}>{c.name}</span>
                <span className={styles.phoneDialCode}>+{c.dialCode}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  ) : null;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {t("auth.phoneLabel")}
      </label>
      <div className={styles.phoneRow}>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          className={styles.dialButton}
          onClick={toggleDialPanel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={t("auth.countryCodeLabel")}
        >
          {selected ? <FlagIcon region={selected.code} className={styles.dialFlagIcon} /> : null}
          <span className={styles.dialCodeText}>{dialLabel}</span>
          <FiChevronDown className={styles.dialChevron} aria-hidden />
        </button>
        <div className={styles.phoneNationalWrap}>
          <FiPhone className={styles.inputIcon} aria-hidden />
          <input
            id={id}
            type="tel"
            inputMode="tel"
            value={national}
            disabled={disabled}
            onChange={(e) => onNationalChange(e.target.value.replace(/[^\d\s\-().]/g, ""))}
            placeholder={t("auth.phoneNationalPlaceholder")}
            autoComplete="tel-national"
            className={styles.input}
          />
        </div>
      </div>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
