export type PopularInternationalHotelDestination = {
  id: string;
  nameKey: string;
  image: string;
  searchDestination: string;
  /** 1 = wide top row, 2 = narrower bottom row */
  row: 1 | 2;
};

export const POPULAR_INTERNATIONAL_HOTEL_DESTINATIONS: ReadonlyArray<PopularInternationalHotelDestination> =
  [
    {
      id: "cyprus",
      nameKey: "popularHotelsInternational.dest.cyprus",
      image:
        "https://s3.eu-central-1.amazonaws.com/static.obilet.com/images/hotel/home/popular-foreign/popular-foreign-kibris.jpg",
      searchDestination: "Northern Cyprus",
      row: 1
    },
    {
      id: "dubai",
      nameKey: "popularHotelsInternational.dest.dubai",
      image:
        "https://s3.eu-central-1.amazonaws.com/static.obilet.com/images/hotel/home/popular-foreign/popular-foreign-dubai.jpg",
      searchDestination: "Dubai",
      row: 1
    },
    {
      id: "belgrade",
      nameKey: "popularHotelsInternational.dest.belgrade",
      image:
        "https://s3.eu-central-1.amazonaws.com/static.obilet.com/images/hotel/home/popular-foreign/popular-foreign-belgrad.jpg",
      searchDestination: "Belgrade",
      row: 2
    },
    {
      id: "amsterdam",
      nameKey: "popularHotelsInternational.dest.amsterdam",
      image:
        "https://s3.eu-central-1.amazonaws.com/static.obilet.com/images/hotel/home/popular-foreign/popular-foreign-amsterdam.jpg",
      searchDestination: "Amsterdam",
      row: 2
    },
    {
      id: "sharm",
      nameKey: "popularHotelsInternational.dest.sharmElSheikh",
      image:
        "https://s3.eu-central-1.amazonaws.com/static.obilet.com/images/hotel/home/popular-foreign/popular-foreign-sarm_el_seyh.jpg",
      searchDestination: "Sharm El Sheikh",
      row: 2
    }
  ] as const;
