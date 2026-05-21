import { AirportCarRentalOptions } from "@/components/cars/AirportCarRentalOptions";
import { CarAffordableReasons } from "@/components/cars/CarAffordableReasons";
import { CarRentalDuration } from "@/components/cars/CarRentalDuration";
import { CarsFaq } from "@/components/cars/CarsFaq";
import { CarsHeader } from "@/components/CarsHeader";
import { PopularRentalCars } from "@/components/PopularRentalCars";
import { SiteFooter } from "@/components/SiteFooter";

export default function CarsPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black">
      <CarsHeader />

      <section className="bg-slate-50 dark:bg-black">
        <div className="mx-auto w-full max-w-[1220px] px-4 py-10">
          <div className="mt-0 md:-mt-28">
            <PopularRentalCars />
          </div>

          <div className="mt-8">
            <CarAffordableReasons />
          </div>

          <div className="mt-8">
            <AirportCarRentalOptions />
          </div>

          <div className="mt-8">
            <CarRentalDuration />
          </div>

          <div className="mt-8">
            <CarsFaq />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
