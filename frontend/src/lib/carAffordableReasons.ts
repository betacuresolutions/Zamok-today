export type CarAffordableReason = {
  id: string;
  icon: string;
  textKey: string;
};

export const CAR_AFFORDABLE_REASONS: ReadonlyArray<CarAffordableReason> = [
  {
    id: "companies",
    icon: "https://s3.eu-central-1.amazonaws.com/static.obilet.com/RentACar/Home/reason-1.svg",
    textKey: "cars.reasons.companies"
  },
  {
    id: "discounts",
    icon: "https://s3.eu-central-1.amazonaws.com/static.obilet.com/RentACar/Home/reason-2.svg",
    textKey: "cars.reasons.discounts"
  },
  {
    id: "support",
    icon: "https://s3.eu-central-1.amazonaws.com/static.obilet.com/RentACar/Home/reason-3.svg",
    textKey: "cars.reasons.support"
  }
] as const;
