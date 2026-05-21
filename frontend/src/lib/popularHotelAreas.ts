export type PopularHotelArea = {
  id: string;
  nameKey: string;
  image: string;
  searchDestination: string;
  /** Indicative nightly rate for card display (formatted with user currency). */
  fromPrice: number;
};

export const POPULAR_HOTEL_AREAS: ReadonlyArray<PopularHotelArea> = [
  {
    id: "antalya",
    nameKey: "popularHotels.city.antalya",
    image:
      "https://s3.eu-central-1.amazonaws.com/static.obilet.com/images/hotel/home/popular/popular-antalya.jpg",
    searchDestination: "Antalya",
    fromPrice: 89
  },
  {
    id: "bursa",
    nameKey: "popularHotels.city.bursa",
    image:
      "https://s3.eu-central-1.amazonaws.com/static.obilet.com/images/hotel/home/popular/popular-bursa.jpg",
    searchDestination: "Bursa",
    fromPrice: 55
  },
  {
    id: "izmir",
    nameKey: "popularHotels.city.izmir",
    image:
      "https://s3.eu-central-1.amazonaws.com/static.obilet.com/images/hotel/home/popular/popular-izmir.jpg",
    searchDestination: "Izmir",
    fromPrice: 72
  },
  {
    id: "ankara",
    nameKey: "popularHotels.city.ankara",
    image:
      "https://s3.eu-central-1.amazonaws.com/static.obilet.com/images/hotel/home/popular/popular-ankara.jpg",
    searchDestination: "Ankara",
    fromPrice: 64
  },
  {
    id: "istanbul",
    nameKey: "popularHotels.city.istanbul",
    image:
      "https://s3.eu-central-1.amazonaws.com/static.obilet.com/images/hotel/home/popular/popular-istanbul.jpg",
    searchDestination: "Istanbul",
    fromPrice: 120
  }
] as const;
