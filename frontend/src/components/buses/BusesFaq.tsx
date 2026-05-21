"use client";

import { FaqAccordion } from "@/components/FaqAccordion";
import { BUSES_FAQ_ITEMS } from "@/lib/busesFaqItems";

export function BusesFaq() {
  return <FaqAccordion titleKey="buses.faq.title" items={BUSES_FAQ_ITEMS} />;
}
