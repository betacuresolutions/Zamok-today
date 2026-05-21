export type CheapFlightGuideTip = {
  id: string;
  titleKey: string;
  textKey: string;
};

export const CHEAP_FLIGHT_TICKETS_TIPS: ReadonlyArray<CheapFlightGuideTip> = [
  {
    id: "best-days",
    titleKey: "flights.cheapGuide.tip1.title",
    textKey: "flights.cheapGuide.tip1.text"
  },
  {
    id: "best-time",
    titleKey: "flights.cheapGuide.tip2.title",
    textKey: "flights.cheapGuide.tip2.text"
  },
  {
    id: "flexible-dates",
    titleKey: "flights.cheapGuide.tip3.title",
    textKey: "flights.cheapGuide.tip3.text"
  },
  {
    id: "compare-prices",
    titleKey: "flights.cheapGuide.tip4.title",
    textKey: "flights.cheapGuide.tip4.text"
  }
] as const;
