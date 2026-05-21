"use client";

import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { useT } from "@/i18n/I18nProvider";

export type FaqItem = {
  qKey: string;
  aKey: string;
};

type Props = {
  titleKey: string;
  items: FaqItem[];
  /** Allow multiple panels open at once. Default: single open. */
  allowMultiple?: boolean;
  className?: string;
};

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function formatText(t: (key: string) => string, key: string) {
  const brand = t("common.brand");
  return t(key).replace(/\{\{brand\}\}/g, brand === "common.brand" ? "Zamok Today" : brand);
}

export function FaqAccordion({ titleKey, items, allowMultiple = false, className = "" }: Props) {
  const t = useT();
  const [openIds, setOpenIds] = useState<Set<number>>(() => new Set());

  function toggle(idx: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
        return next;
      }
      if (!allowMultiple) return new Set([idx]);
      next.add(idx);
      return next;
    });
  }

  return (
    <section className={cn("space-y-5", className)}>
      <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
        {formatText(t, titleKey)}
      </h2>

      <div className="space-y-2">
        {items.map((item, idx) => {
          const open = openIds.has(idx);
          return (
            <div
              key={item.qKey}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-black"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5 sm:px-5"
                aria-expanded={open}
                onClick={() => toggle(idx)}
              >
                <span className="text-sm font-semibold leading-snug text-slate-800 dark:text-white">
                  {formatText(t, item.qKey)}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-slate-400 transition-transform duration-300 ease-in-out dark:text-white/50",
                    open && "rotate-180"
                  )}
                  aria-hidden
                >
                  <FiChevronDown className="h-4 w-4" />
                </span>
              </button>

              <div
                className="grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none"
                style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div
                    className={cn(
                      "border-t border-slate-100 px-4 pb-3.5 pt-2 transition-opacity duration-300 ease-in-out motion-reduce:transition-none dark:border-white/10 sm:px-5 sm:pb-4",
                      open ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-white/65">
                      {formatText(t, item.aKey)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
