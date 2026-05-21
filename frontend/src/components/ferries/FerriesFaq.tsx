"use client";

import { FaqAccordion } from "@/components/FaqAccordion";
import { FERRIES_FAQ_ITEMS } from "@/lib/ferriesFaqItems";

export function FerriesFaq() {
  return <FaqAccordion titleKey="ferries.faq.title" items={FERRIES_FAQ_ITEMS} />;
}
