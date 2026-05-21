"use client";

import { useT } from "@/i18n/I18nProvider";
import { DRIVER_AGE_OPTIONS } from "@/lib/carSearch";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export function CarSearchDriverAgeBar({
  driverAge,
  onDriverAgeChange,
  className
}: {
  driverAge: string;
  onDriverAgeChange: (value: string) => void;
  className?: string;
}) {
  const t = useT();
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2.5 sm:gap-3", className)}>
      <span className="text-sm font-medium text-white/95">{t("search.cars.driverAge")}</span>
      <div className="relative">
        <select
          value={driverAge}
          onChange={(e) => onDriverAgeChange(e.target.value)}
          className="appearance-none rounded-xl border-0 bg-white py-2 pl-3 pr-9 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-black/10 transition hover:ring-black/15 focus:outline-none focus:ring-2 focus:ring-white/80 dark:bg-zinc-950 dark:text-white dark:ring-white/15"
          aria-label={t("search.cars.driverAge")}
        >
          {DRIVER_AGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {tr(opt.labelKey, opt.value)}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/50"
          aria-hidden
        >
          ▾
        </span>
      </div>
    </div>
  );
}
