"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useT } from "@/i18n/I18nProvider";
import { buildHotelSearchResultsHref } from "@/lib/hotelSearch";
import { POPULAR_INTERNATIONAL_HOTEL_DESTINATIONS } from "@/lib/popularInternationalHotelDestinations";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setHotelSearchForm } from "@/store/hotelsSlice";

const BLANK_IMAGE = "/Images/blank.webp";

function formatBrand(t: (key: string) => string, key: string) {
  const brand = t("common.brand");
  return t(key).replace(/\{\{brand\}\}/g, brand === "common.brand" ? "Zamok Today" : brand);
}

function DestinationTile({
  dest,
  wide
}: {
  dest: (typeof POPULAR_INTERNATIONAL_HOTEL_DESTINATIONS)[number];
  wide: boolean;
}) {
  const t = useT();
  const dispatch = useAppDispatch();
  const searchForm = useAppSelector((s) => s.hotels.searchForm);
  const [imageSrc, setImageSrc] = useState(dest.image);
  const label = t(dest.nameKey);
  const href = buildHotelSearchResultsHref({
    destination: dest.searchDestination,
    checkIn: searchForm.checkIn,
    checkOut: searchForm.checkOut,
    adults: searchForm.guests.adults,
    children: searchForm.guests.children,
    rooms: searchForm.guests.rooms
  });

  return (
    <Link
      href={href}
      onClick={() =>
        dispatch(
          setHotelSearchForm({
            destination: dest.searchDestination
          })
        )
      }
      className={[
        "group relative block overflow-hidden rounded-2xl outline-none ring-brand-600/0 transition hover:ring-2 focus-visible:ring-2 focus-visible:ring-brand-600",
        wide ? "md:col-span-3" : "md:col-span-2"
      ].join(" ")}
    >
      <div className={wide ? "relative aspect-[16/10] w-full sm:aspect-[2/1]" : "relative aspect-[4/5] w-full sm:aspect-square"}>
        <Image
          src={imageSrc}
          alt={label}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes={
            wide
              ? "(min-width: 768px) 50vw, 100vw"
              : "(min-width: 768px) 33vw, 100vw"
          }
          onError={() => {
            if (imageSrc !== BLANK_IMAGE) setImageSrc(BLANK_IMAGE);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4">
          <div className="text-base font-bold tracking-tight text-white drop-shadow-sm sm:text-lg">{label}</div>
        </div>
      </div>
    </Link>
  );
}

export function PopularInternationalHotelDestinations() {
  const t = useT();
  const row1 = POPULAR_INTERNATIONAL_HOTEL_DESTINATIONS.filter((d) => d.row === 1);
  const row2 = POPULAR_INTERNATIONAL_HOTEL_DESTINATIONS.filter((d) => d.row === 2);

  return (
    <section className="space-y-5">
      <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
        {t("popularHotelsInternational.title")}
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-6 md:gap-4">
        {row1.map((dest) => (
          <DestinationTile key={dest.id} dest={dest} wide />
        ))}
        {row2.map((dest) => (
          <DestinationTile key={dest.id} dest={dest} wide={false} />
        ))}
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-white/70">
        <p>{formatBrand(t, "popularHotelsInternational.desc1")}</p>
        <p>{formatBrand(t, "popularHotelsInternational.desc2")}</p>
      </div>
    </section>
  );
}
