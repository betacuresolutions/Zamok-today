import { BusesHeader } from "@/components/BusesHeader";
import { BusesFaq } from "@/components/buses/BusesFaq";
import { CheapBusTicketsEurope } from "@/components/buses/CheapBusTicketsEurope";
import { PopularBusCities } from "@/components/PopularBusCities";
import { SiteFooter } from "@/components/SiteFooter";

export default function BusesPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black">
      <BusesHeader />

      <section className="bg-slate-50 dark:bg-black">
        <div className="mx-auto w-full max-w-[1220px] px-4 py-10">
          <div className="mt-0 md:-mt-28">
            <PopularBusCities />
          </div>

          <div className="mt-8">
            <CheapBusTicketsEurope />
          </div>

          <div className="mt-8">
            <BusesFaq />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
