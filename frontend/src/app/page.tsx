import { CheapFlightTicketsGuide } from "@/components/flights/CheapFlightTicketsGuide";
import { FlightsFaq } from "@/components/FlightsFaq";
import { Header } from "@/components/Header";
import { PopularDestinations } from "@/components/PopularDestinations";
import { PriceMap } from "@/components/PriceMap";
import { SiteFooter } from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />

      <section className="bg-slate-50 dark:bg-black">
        <div className="mx-auto w-full max-w-[1240px] px-4 py-10">
          <div className="mt-0 md:-mt-28">
            <PopularDestinations />
          </div>

          <div className="mt-8">
            <CheapFlightTicketsGuide />
          </div>

          <div className="mt-8">
            <PriceMap />
          </div>

          <div className="mt-8">
            <FlightsFaq />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

