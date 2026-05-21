"use client";

import { useT } from "@/i18n/I18nProvider";

export function FerryRoutesVideo() {
  const t = useT();

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-black dark:ring-white/10">
      <video
        className="block h-auto w-full bg-slate-100 dark:bg-zinc-950"
        src="/Europe-map-video-osabus.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={t("ferries.routesVideo.label")}
      />
    </section>
  );
}
