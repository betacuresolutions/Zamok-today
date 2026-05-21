"use client";

import { useT } from "@/i18n/I18nProvider";

function formatBrand(t: (key: string) => string, key: string) {
  const brand = t("common.brand");
  return t(key).replace(/\{\{brand\}\}/g, brand === "common.brand" ? "Zamok Today" : brand);
}

export function CarRentalDuration() {
  const t = useT();

  return (
    <section className="space-y-8">
      <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
        {t("cars.duration.title")}
      </h2>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            {t("cars.duration.monthly.title")}
          </h3>
          <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-white/70">
            <p>{formatBrand(t, "cars.duration.monthly.p1")}</p>
            <p>{formatBrand(t, "cars.duration.monthly.p2")}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            {t("cars.duration.daily.title")}
          </h3>
          <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-white/70">
            <p>{formatBrand(t, "cars.duration.daily.p1")}</p>
            <p>{formatBrand(t, "cars.duration.daily.p2")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
