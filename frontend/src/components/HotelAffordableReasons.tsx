"use client";

import { useT } from "@/i18n/I18nProvider";
import { HOTEL_AFFORDABLE_REASONS } from "@/lib/hotelAffordableReasons";

export function HotelAffordableReasons() {
  const t = useT();

  return (
    <section className="space-y-5">
      <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
        {t("hotels.reasons.title")}
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {HOTEL_AFFORDABLE_REASONS.map((reason) => (
          <article
            key={reason.id}
            className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-black dark:ring-white/10"
          >
            <div className="grid h-[88px] w-[88px] shrink-0 place-items-center rounded-2xl bg-rose-50 dark:bg-rose-950/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={reason.icon}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="text-sm font-medium leading-snug text-slate-700 dark:text-white/85">
              {t(reason.textKey)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
