"use client";

import { FaqAccordion } from "@/components/FaqAccordion";
import { FLIGHTS_FAQ_ITEMS } from "@/lib/flightsFaqItems";

export function FlightsFaq() {
  return (
    <FaqAccordion titleKey="flights.faq.title" items={FLIGHTS_FAQ_ITEMS} />
  );
}
