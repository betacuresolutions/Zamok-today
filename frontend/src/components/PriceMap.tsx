"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useT } from "@/i18n/I18nProvider";
import { BiSolidPlaneAlt } from "react-icons/bi";
import { FiChevronRight, FiInfo, FiX } from "react-icons/fi";
import { useTheme } from "@/theme/ThemeProvider";

export function PriceMap() {
  const t = useT();
  const { resolved } = useTheme();
  const isDark = resolved === "dark";
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const howRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!howItWorksOpen) return;
    howRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [howItWorksOpen]);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-white dark:bg-black p-6 shadow-sm ring-1 ring-slate-200 dark:ring-white/10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-center">
          <div className="flex flex-col gap-3 md:gap-4 h-full justify-between">
            <div>
              <div className={`text-3xl font-semibold text-slate-900 dark:text-white`}>{t("pricemap.title")}</div>
              <div className="mt-1 text-sm text-slate-500 dark:text-white/70">{t("pricemap.subtitle")}</div>
            </div>

            <div className="pt-2">
              <Link
                href="/map"
                className="inline-flex h-12 w-full max-w-[360px] items-center justify-center rounded-2xl bg-slate-100 px-6 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
              >
                {t("pricemap.open")}
              </Link>
            </div>
          </div>

          <Link
            href="/map"
            className="relative block overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200 transition hover:opacity-95 dark:bg-black dark:ring-white/10"
          >
            <div className="relative h-[280px] w-full">
              <Image
                src={isDark ? "/Images/dark-map.png" : "/Images/light-map.png"}
                alt={t("pricemap.title")}
                fill
                priority={false}
                className="object-cover"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

