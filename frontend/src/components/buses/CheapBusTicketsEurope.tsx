"use client";

import { useT } from "@/i18n/I18nProvider";
import { CHEAP_BUS_TICKETS_EUROPE_REASONS } from "@/lib/cheapBusTicketsEurope";

function formatBrand(t: (key: string) => string, key: string) {
  const brand = t("common.brand");
  const resolvedBrand = brand === "common.brand" ? "Zamok Today" : brand;
  const raw = t(key);
  return raw.replace(/\{\{brand\}\}/g, resolvedBrand).replace(/obilet/gi, resolvedBrand);
}

export function CheapBusTicketsEurope() {
  const t = useT();

  return (
    <section className="space-y-6">
      <h2 className="text-center text-3xl font-semibold tracking-tight">
        <span className="text-slate-800 dark:text-white">{t("buses.europe.titleMain")}</span>
        {t("buses.europe.titleAccent") ? (
          <span className="text-slate-500 dark:text-white/55"> {t("buses.europe.titleAccent")}</span>
        ) : null}
      </h2>

      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-black dark:ring-white/10 sm:p-6 md:p-8">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {CHEAP_BUS_TICKETS_EUROPE_REASONS.map((reason) => (
            <li
              key={reason.id}
              className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="mb-4 grid h-[120px] w-[120px] place-items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reason.icon}
                  alt=""
                  width={120}
                  height={120}
                  className="h-[120px] w-[120px] object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">{t(reason.titleKey)}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-white/70">
                {formatBrand(t, reason.textKey)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
