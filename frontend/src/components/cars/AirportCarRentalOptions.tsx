"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useT } from "@/i18n/I18nProvider";
import { buildCarSearchResultsHref } from "@/lib/carSearch";
import { AIRPORT_CAR_RENTAL_OPTIONS } from "@/lib/airportCarRentalOptions";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCarSearchForm } from "@/store/carsSlice";

const BLANK_IMAGE = "/Images/blank.webp";

function AirportCard({ airport }: { airport: (typeof AIRPORT_CAR_RENTAL_OPTIONS)[number] }) {
  const t = useT();
  const dispatch = useAppDispatch();
  const searchForm = useAppSelector((s) => s.cars.searchForm);
  const [imageSrc, setImageSrc] = useState(airport.image);
  const label = t(airport.nameKey);
  const href = buildCarSearchResultsHref({
    pickUpCity: airport.pickUpLocation,
    pickUpSubtitle: "",
    dropOffCity: airport.pickUpLocation,
    dropOffSubtitle: "",
    pickUpDate: searchForm.pickUpDate,
    dropOffDate: searchForm.dropOffDate,
    pickUpTime: searchForm.pickUpTime,
    dropOffTime: searchForm.dropOffTime,
    driverAge: searchForm.driverAge
  });

  return (
    <Link
      href={href}
      onClick={() =>
        dispatch(
          setCarSearchForm({
            pickUpCity: airport.pickUpLocation,
            pickUpSubtitle: "",
            dropOffCity: airport.pickUpLocation,
            dropOffSubtitle: ""
          })
        )
      }
      className="group relative block overflow-hidden rounded-2xl outline-none ring-brand-600/0 transition hover:ring-2 focus-visible:ring-2 focus-visible:ring-brand-600"
    >
      <div className="relative aspect-[4/5] w-full sm:aspect-[3/4]">
        <Image
          src={imageSrc}
          alt={label}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          onError={() => {
            if (imageSrc !== BLANK_IMAGE) setImageSrc(BLANK_IMAGE);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="text-center text-base font-bold leading-snug tracking-tight text-white drop-shadow-sm sm:text-lg">
            {label}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function AirportCarRentalOptions() {
  const t = useT();

  return (
    <section className="space-y-5">
      <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">{t("cars.airport.title")}</h2>

      <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-white/70">
        <p>{t("cars.airport.desc1")}</p>
        <p>{t("cars.airport.desc2")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {AIRPORT_CAR_RENTAL_OPTIONS.map((airport) => (
          <AirportCard key={airport.id} airport={airport} />
        ))}
      </div>
    </section>
  );
}
