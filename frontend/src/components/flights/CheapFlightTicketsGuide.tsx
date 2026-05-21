"use client";

import { useT } from "@/i18n/I18nProvider";
import { CHEAP_FLIGHT_TICKETS_TIPS } from "@/lib/cheapFlightTicketsGuide";

function formatBrand(t: (key: string) => string, key: string) {
  const brand = t("common.brand");
  return t(key).replace(/\{\{brand\}\}/g, brand === "common.brand" ? "Zamok Today" : brand);
}

export function CheapFlightTicketsGuide() {
  const t = useT();

  return (
    <section className="rounded-3xl bg-slate-100 p-6 ring-1 ring-slate-200/80 dark:bg-white/5 dark:ring-white/10 sm:p-8">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">
        {t("flights.cheapGuide.title")}
      </h2>

      <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-white/70">
        {formatBrand(t, "flights.cheapGuide.intro")}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-x-8 md:gap-y-6">
        {CHEAP_FLIGHT_TICKETS_TIPS.map((tip) => (
          <div key={tip.id} className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t(tip.titleKey)}
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-white/70">
              {formatBrand(t, tip.textKey)}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm leading-relaxed text-slate-600 dark:text-white/70">
        {formatBrand(t, "flights.cheapGuide.outro")}
      </p>
    </section>
  );
}
