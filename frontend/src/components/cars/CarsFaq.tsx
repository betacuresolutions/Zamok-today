"use client";

import { FaqAccordion } from "@/components/FaqAccordion";
import { CARS_FAQ_ITEMS } from "@/lib/carsFaqItems";

export function CarsFaq() {
  return <FaqAccordion titleKey="cars.faq.title" items={CARS_FAQ_ITEMS} />;
}
