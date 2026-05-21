export type FerryTicketsReason = {
  id: string;
  icon: string;
  titleKey: string;
  textKey: string;
};

/** Icons extracted from obilet.com ferry page SVG sprite (public/Ferries/reasons/). */
export const FERRY_TICKETS_REASONS: ReadonlyArray<FerryTicketsReason> = [
  {
    id: "visitors",
    icon: "/Ferries/reasons/reason-1.svg",
    titleKey: "ferries.promo.reason1.title",
    textKey: "ferries.promo.reason1.text"
  },
  {
    id: "fast-booking",
    icon: "/Ferries/reasons/reason-2.svg",
    titleKey: "ferries.promo.reason2.title",
    textKey: "ferries.promo.reason2.text"
  },
  {
    id: "secure-payment",
    icon: "/Ferries/reasons/reason-3.svg",
    titleKey: "ferries.promo.reason3.title",
    textKey: "ferries.promo.reason3.text"
  },
  {
    id: "support",
    icon: "/Ferries/reasons/reason-4.svg",
    titleKey: "ferries.promo.reason4.title",
    textKey: "ferries.promo.reason4.text"
  }
] as const;
