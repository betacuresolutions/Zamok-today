"use client";

import { useT } from "@/i18n/I18nProvider";

function formatBrand(t: (key: string) => string, key: string) {
  const brand = t("common.brand");
  return t(key).replace(/\{\{brand\}\}/g, brand === "common.brand" ? "Zamok Today" : brand);
}

export function HotelReservationsAbout() {
  const t = useT();

  return (
    <section className="space-y-5">
      <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
        {formatBrand(t, "hotels.about.title")}
      </h2>

      <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-white/70">
        <p>{formatBrand(t, "hotels.about.p1")}</p>
        <p>{formatBrand(t, "hotels.about.p2")}</p>
        <p>{formatBrand(t, "hotels.about.p3")}</p>
      </div>
    </section>
  );
}
