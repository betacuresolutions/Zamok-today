export type HotelAffordableReason = {
  id: string;
  icon: string;
  textKey: string;
};

export const HOTEL_AFFORDABLE_REASONS: ReadonlyArray<HotelAffordableReason> = [
  {
    id: "choice",
    icon: "https://s3.eu-central-1.amazonaws.com/static.obilet.com/images/hotel/home/reason-1.svg",
    textKey: "hotels.reasons.choice"
  },
  {
    id: "discounts",
    icon: "https://s3.eu-central-1.amazonaws.com/static.obilet.com/images/hotel/home/reason-2.svg",
    textKey: "hotels.reasons.discounts"
  },
  {
    id: "support",
    icon: "https://s3.eu-central-1.amazonaws.com/static.obilet.com/images/hotel/home/reason-3.svg",
    textKey: "hotels.reasons.support"
  }
] as const;
