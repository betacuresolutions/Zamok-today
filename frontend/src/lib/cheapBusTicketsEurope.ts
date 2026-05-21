export type CheapBusEuropeReason = {
  id: string;
  icon: string;
  titleKey: string;
  textKey: string;
};

/** Icons extracted from obilet.com bus page SVG sprite (public/Buses/reasons/). */
export const CHEAP_BUS_TICKETS_EUROPE_REASONS: ReadonlyArray<CheapBusEuropeReason> = [
  {
    id: "support",
    icon: "/Buses/reasons/reason-1.svg",
    titleKey: "buses.europe.reason1.title",
    textKey: "buses.europe.reason1.text"
  },
  {
    id: "secure-payment",
    icon: "/Buses/reasons/reason-2.svg",
    titleKey: "buses.europe.reason2.title",
    textKey: "buses.europe.reason2.text"
  },
  {
    id: "budget",
    icon: "/Buses/reasons/reason-3.svg",
    titleKey: "buses.europe.reason3.title",
    textKey: "buses.europe.reason3.text"
  },
  {
    id: "carriers",
    icon: "/Buses/reasons/reason-4.svg",
    titleKey: "buses.europe.reason4.title",
    textKey: "buses.europe.reason4.text"
  }
] as const;
