"use client";

import { FlightSearch } from "@/components/FlightSearch";
import { Topbar } from "@/components/Topbar";
import { HeroTitle } from "@/components/hero/HeroTitle";

export function Header() {
  return (
    <>
      <Topbar />

      <section className="bg-brand-600 dark:bg-black">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-1 md:py-20">
          <div className="mt-3 mb-4 text-center text-white md:mt-12 md:mb-8">
            <HeroTitle />
          </div>
          <FlightSearch usePersistedSearchForm={false} stickyEnabled={false} />
        </div>
      </section>
      <section className="h-3 bg-brand-600 dark:bg-black md:h-[80px]" />
    </>
  );
}

