"use client";

import { useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import {
  searchFieldLabelClass,
  searchFieldShell,
  searchFieldValueClass
} from "@/components/search/searchFieldStyles";

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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SearchScrollSelect({
  label,
  value,
  options,
  onChange,
  className,
  open: controlledOpen,
  onOpenChange
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  function setOpen(next: boolean) {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  useEffect(() => {
    if (!open) return;
    const selected = listRef.current?.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`);
    selected?.scrollIntoView({ block: "nearest" });
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const node = e.target as Node;
      if (rootRef.current?.contains(node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn(searchFieldShell, "relative", className)}>
      <button
        type="button"
        className="flex h-full w-full flex-col justify-center text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:ring-offset-2 rounded-xl"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(!open)}
      >
        <span className={cn(searchFieldLabelClass, "whitespace-nowrap")}>{label}</span>
        <span className={cn(searchFieldValueClass, "pointer-events-none flex items-center justify-between gap-1.5")}>
          <span>{value}</span>
          <FiChevronDown
            className={cn("h-4 w-4 shrink-0 text-slate-400 transition dark:text-white/50", open && "rotate-180")}
            aria-hidden
          />
        </span>
      </button>

      {open ? (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={label}
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+8px)] z-[75] overflow-y-auto overscroll-contain rounded-2xl bg-white py-1 shadow-2xl ring-1 ring-black/10",
            "dark:bg-zinc-950 dark:ring-white/15",
            "[scrollbar-width:thin] [scrollbar-color:theme(colors.brand.500)_theme(colors.slate.100)]",
            "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-brand-500/85",
            "dark:[scrollbar-color:theme(colors.brand.600)_theme(colors.zinc.800)]"
          )}
          style={{ maxHeight: ROW_H_PX * VISIBLE_ROWS }}
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
                    "flex h-10 w-full items-center px-4 text-left text-sm font-semibold transition",
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
      ) : null}
    </div>
  );
}
