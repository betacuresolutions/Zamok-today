import { FerriesFaq } from "@/components/ferries/FerriesFaq";
import { FerryRoutesVideo } from "@/components/ferries/FerryRoutesVideo";
import { FerryTicketsPromo } from "@/components/ferries/FerryTicketsPromo";
import { FerriesHeader } from "@/components/FerriesHeader";
import { PopularFerryCities } from "@/components/PopularFerryCities";
import { SiteFooter } from "@/components/SiteFooter";

export default function FerriesPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black">
      <FerriesHeader />

      <section className="bg-slate-50 dark:bg-black">
        <div className="mx-auto w-full max-w-[1220px] px-4 py-10">
          <div className="mt-0 md:-mt-28">
            <PopularFerryCities />
          </div>

          <div className="mt-8">
            <FerryTicketsPromo />
          </div>

          <div className="mt-8">
            <FerryRoutesVideo />
          </div>

          <div className="mt-8">
            <FerriesFaq />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
