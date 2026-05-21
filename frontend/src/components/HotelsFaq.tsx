"use client";

import { FaqAccordion } from "@/components/FaqAccordion";
import { HOTELS_FAQ_ITEMS } from "@/lib/hotelsFaqItems";

export function HotelsFaq() {
  return (
    <FaqAccordion titleKey="hotels.faq.title" items={HOTELS_FAQ_ITEMS} />
  );
}
