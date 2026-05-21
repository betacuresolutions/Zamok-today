"use client";

import { useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { MobileFullScreenSheet } from "@/components/search/MobileFullScreenSheet";
import {
  searchFieldLabelClass,
  searchFieldShell,
  searchFieldValueClass
} from "@/components/search/searchFieldStyles";
import { useT } from "@/i18n/I18nProvider";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

const VISIBLE_ROWS = 5;
const ROW_H_PX = 40;

type Props = {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  className?: string;
  /** When set, only the matching viewport opens the list (mobile + desktop shells). */
  layout?: "mobile" | "desktop";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SearchScrollSelect({
  label,
  value,
  options,
  onChange,
  className,
  layout,
  open: controlledOpen,
  onOpenChange
}: Props) {
  const t = useT();
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mounted, setMounted] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const layoutMatches =
    layout === "mobile" ? isMobileViewport : layout === "desktop" ? !isMobileViewport : true;
  const showOpen = open && layoutMatches;

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

  function setOpen(next: boolean) {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  useEffect(() => {
    if (!showOpen) return;
    const selected = listRef.current?.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`);
    selected?.scrollIntoView({ block: "nearest" });
  }, [showOpen, value]);

  useEffect(() => {
    if (!showOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showOpen]);

  useEffect(() => {
    if (!showOpen || isMobileViewport) return;
    function onPointerDown(e: MouseEvent) {
      const node = e.target as Node;
      if (rootRef.current?.contains(node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showOpen, isMobileViewport]);

  useEffect(() => {
    if (!showOpen || !isMobileViewport) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showOpen, isMobileViewport]);

  const doneButton = (
    <button
      type="button"
      onClick={() => setOpen(false)}
      className="w-full rounded-2xl bg-brand-600 px-4 py-3 text-base font-semibold text-white hover:bg-brand-700"
    >
      {tr("search.hotels.done", "Done")}
    </button>
  );

  const optionList = (listClassName: string, maxHeight?: number) => (
    <ul
      ref={listRef}
      role="listbox"
      aria-label={label}
      className={listClassName}
      style={maxHeight !== undefined ? { maxHeight } : undefined}
    >
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <li key={opt} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={selected}
              data-value={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center px-4 text-left text-sm font-semibold transition",
                maxHeight !== undefined ? "h-10" : "min-h-[3rem] py-3",
                selected
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200"
                  : "text-slate-900 hover:bg-slate-50 dark:text-white dark:hover:bg-white/10"
              )}
            >
              {opt}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div ref={rootRef} className={cn(searchFieldShell, "relative", className)}>
      <button
        type="button"
        className="flex h-full w-full flex-col justify-center text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:ring-offset-2 rounded-xl"
        aria-expanded={showOpen}
        aria-haspopup="listbox"
        onClick={() => setOpen(!open)}
      >
        <span className={cn(searchFieldLabelClass, "whitespace-nowrap")}>{label}</span>
        <span className={cn(searchFieldValueClass, "pointer-events-none flex items-center justify-between gap-1.5")}>
          <span>{value}</span>
          <FiChevronDown
            className={cn("h-4 w-4 shrink-0 text-slate-400 transition dark:text-white/50", showOpen && "rotate-180")}
            aria-hidden
          />
        </span>
      </button>

      {showOpen && !isMobileViewport
        ? optionList(
            cn(
              "absolute left-0 right-0 top-[calc(100%+8px)] z-[75] overflow-y-auto overscroll-contain rounded-2xl bg-white py-1 shadow-2xl ring-1 ring-black/10",
              "dark:bg-zinc-950 dark:ring-white/15",
              "[scrollbar-width:thin] [scrollbar-color:theme(colors.brand.500)_theme(colors.slate.100)]",
              "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-brand-500/85",
              "dark:[scrollbar-color:theme(colors.brand.600)_theme(colors.zinc.800)]"
            ),
            ROW_H_PX * VISIBLE_ROWS
          )
        : null}

      <MobileFullScreenSheet
        open={showOpen && isMobileViewport}
        mounted={mounted}
        title={label}
        onClose={() => setOpen(false)}
        footer={doneButton}
      >
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/10 dark:bg-zinc-950 dark:ring-white/15">
          {optionList("divide-y divide-slate-100 dark:divide-white/10")}
        </div>
      </MobileFullScreenSheet>
    </div>
  );
}
