"use client";

import { useT } from "@/i18n/I18nProvider";

export function CarsPageIntro() {
  const t = useT();
  return (
    <p className="text-center text-sm text-slate-600 dark:text-white/60">{t("cars.intro")}</p>
  );
}
