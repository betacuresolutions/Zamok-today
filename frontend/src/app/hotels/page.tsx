import { HotelAffordableReasons } from "@/components/HotelAffordableReasons";
import { HotelReservationsAbout } from "@/components/HotelReservationsAbout";
import { HotelsFaq } from "@/components/HotelsFaq";
import { HotelsHeader } from "@/components/HotelsHeader";
import { PopularHotelAreas } from "@/components/PopularHotelAreas";
import { PopularInternationalHotelDestinations } from "@/components/PopularInternationalHotelDestinations";
import { SiteFooter } from "@/components/SiteFooter";

export default function HotelsPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black">
      <HotelsHeader />

      <section className="bg-slate-50 dark:bg-black">
        <div className="mx-auto w-full max-w-[1220px] px-4 py-10">
          <div className="mt-0 md:-mt-28">
            <PopularHotelAreas />
          </div>

          <div className="mt-8">
            <HotelAffordableReasons />
          </div>

          <div className="mt-8">
            <HotelReservationsAbout />
          </div>

          <div className="mt-8">
            <PopularInternationalHotelDestinations />
          </div>

          <div className="mt-8">
            <HotelsFaq />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
