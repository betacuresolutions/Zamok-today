"use client";

import { BusSearch } from "@/components/BusSearch";
import { Topbar } from "@/components/Topbar";
import { HeroTitle } from "@/components/hero/HeroTitle";

export function BusesHeader() {
  return (
    <>
      <Topbar />

      <section className="overflow-visible bg-brand-600 dark:bg-black">
        <div className="mx-auto w-full max-w-[1440px] overflow-visible px-4 py-1 md:py-20">
          <div className="mt-3 mb-4 text-center text-white md:mt-12 md:mb-8">
            <HeroTitle titleKey="hero.buses.title" />
          </div>
          <BusSearch usePersistedSearchForm={false} />
        </div>
      </section>
      <section className="h-3 bg-brand-600 dark:bg-black md:h-[80px]" />
    </>
  );
}
