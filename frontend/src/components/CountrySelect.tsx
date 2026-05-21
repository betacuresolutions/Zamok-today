"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiChevronDown, FiSearch, FiX } from "react-icons/fi";
import { buildCountryList, type CountryOption } from "@/lib/countries";
import { useT } from "@/i18n/I18nProvider";

function FlagIcon({ region }: { region: string }) {
  const code = region.toLowerCase();
  return (
    <span
      className={`fi fi-${code}`}
      aria-hidden
      style={{
        borderRadius: 4,
        boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.08)",
        width: "100%",
        height: "100%"
      }}
    />
  );
}

type PanelCoords = { top: number; left: number; width: number; maxHeight: number };

function computeCountryPanelCoords(trigger: HTMLElement): PanelCoords {
  const rect = trigger.getBoundingClientRect();
  const gap = 6;
  const viewportPadding = 12;
  const panelWidth = Math.max(rect.width, 280);
  const preferredHeight = 320;
  const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
  const spaceAbove = rect.top - gap - viewportPadding;
  const openAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
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

export function CountrySelect({
  id,
  value,
  onChange,
  required,
  disabled,
  className = ""
}: {
  id?: string;
  value: string;
  onChange: (code: string, name: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const t = useT();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<PanelCoords | null>(null);

  const countries = useMemo(() => buildCountryList("en"), []);

  const selected = useMemo(() => {
    const code = String(value || "")
      .trim()
      .toUpperCase();
    return countries.find((c) => c.code === code) ?? null;
  }, [countries, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countries, query]);

  const updateCoords = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    setCoords(computeCountryPanelCoords(el));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  function pick(country: CountryOption) {
    onChange(country.code, country.name);
    setOpen(false);
    setCoords(null);
    setQuery("");
  }

  function toggleOpen() {
    if (disabled) return;
    if (open) {
      setOpen(false);
      setCoords(null);
      setQuery("");
      return;
    }
    const el = triggerRef.current;
    if (!el) return;
    setCoords(computeCountryPanelCoords(el));
    setOpen(true);
  }

  const label = selected?.name || t("wallet.countrySelectPlaceholder");

  const panel = open && coords ? (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={t("wallet.country")}
      className="fixed z-[200] flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-white/15 dark:bg-zinc-950 dark:ring-white/10"
      style={{
        top: coords.top,
        left: coords.left,
        width: coords.width,
        maxHeight: coords.maxHeight
      }}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-3 py-2 dark:border-white/10">
        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{t("wallet.country")}</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="grid h-8 w-8 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/10"
          aria-label={t("wallet.close")}
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>
      <div className="shrink-0 border-b border-zinc-100 p-2 dark:border-white/10">
        <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 dark:bg-white/10">
          <FiSearch className="h-4 w-4 shrink-0 text-zinc-500 dark:text-white/60" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("locale.searchPlaceholder")}
            className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white dark:placeholder:text-white/40"
            autoFocus
          />
        </div>
      </div>
      <ul role="listbox" className="min-h-0 flex-1 overflow-auto p-1" aria-label={t("wallet.country")}>
        {filtered.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {t("wallet.countryNoResults")}
          </li>
        ) : (
          filtered.map((c) => (
            <li key={c.code} role="option" aria-selected={c.code === value}>
              <button
                type="button"
                onClick={() => pick(c)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-white/5"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="h-4 w-6 shrink-0 overflow-hidden rounded-[3px]">
                    <FlagIcon region={c.code} />
                  </span>
                  <span className="truncate text-sm font-medium text-zinc-900 dark:text-white">{c.name}</span>
                </span>
                {c.code === value ? (
                  <FiCheck className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                ) : (
                  <span className="w-4" />
                )}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  ) : null;

  return (
    <>
      <div className={className}>
        <button
          ref={triggerRef}
          id={id}
          type="button"
          disabled={disabled}
          onClick={toggleOpen}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={[
            "flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-left text-sm transition",
            "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/20",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "dark:border-white/12 dark:bg-zinc-900 dark:text-white dark:focus:border-brand-500",
            !selected ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-white"
          ].join(" ")}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            {selected ? (
              <span className="h-4 w-6 shrink-0 overflow-hidden rounded-[3px]">
                <FlagIcon region={selected.code} />
              </span>
            ) : null}
            <span className="truncate font-medium">{label}</span>
          </span>
          <FiChevronDown
            className={["h-4 w-4 shrink-0 text-zinc-400 transition", open ? "rotate-180" : ""].join(" ")}
            aria-hidden
          />
        </button>

        {required ? (
          <input
            tabIndex={-1}
            className="pointer-events-none absolute h-0 w-0 opacity-0"
            value={value}
            required
            onChange={() => {}}
            aria-hidden
          />
        ) : null}
      </div>

      {mounted && panel ? createPortal(panel, document.body) : null}
    </>
  );
}
