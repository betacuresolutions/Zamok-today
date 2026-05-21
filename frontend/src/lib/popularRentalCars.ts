export type PopularRentalCar = {
  id: string;
  nameKey: string;
  categoryKey: string;
  image: string;
  /** Default pick-up city when user selects this vehicle from the carousel. */
  pickUpCity: string;
  /** Indicative daily rate for card display (formatted with user currency). */
  fromPrice: number;
};

export const POPULAR_RENTAL_CARS: ReadonlyArray<PopularRentalCar> = [
  {
    id: "renault-clio",
    nameKey: "popularCars.model.renaultClio",
    categoryKey: "popularCars.category.hatchback",
    image: "/Cars/renault-clio-5-hatchback-5-kapi.png",
    pickUpCity: "Istanbul",
    fromPrice: 42
  },
  {
    id: "audi-a3",
    nameKey: "popularCars.model.audiA3",
    categoryKey: "popularCars.category.hatchback",
    image: "/Cars/audi-a3-hatchback-5-kapi.png",
    pickUpCity: "Ankara",
    fromPrice: 78
  },
  {
    id: "vw-passat",
    nameKey: "popularCars.model.vwPassat",
    categoryKey: "popularCars.category.sedan",
    image: "/Cars/volkswagen-passat-sedan.png",
    pickUpCity: "Izmir",
    fromPrice: 65
  },
  {
    id: "dacia-duster",
    nameKey: "popularCars.model.daciaDuster",
    categoryKey: "popularCars.category.suv",
    image: "/Cars/dacia-duster-suv-jeep.png",
    pickUpCity: "Antalya",
    fromPrice: 58
  },
  {
    id: "dacia-lodgy",
    nameKey: "popularCars.model.daciaLodgy",
    categoryKey: "popularCars.category.stationWagon",
    image: "/Cars/dacia-lodgy-station-wagon.png",
    pickUpCity: "Bursa",
    fromPrice: 52
  },
  {
    id: "mercedes-vito",
    nameKey: "popularCars.model.mercedesVito",
    categoryKey: "popularCars.category.minibus",
    image: "/Cars/mercedes-benz-vito-minibus.png",
    pickUpCity: "Istanbul",
    fromPrice: 95
  },
  {
    id: "vw-caravelle",
    nameKey: "popularCars.model.vwCaravelle",
    categoryKey: "popularCars.category.minibus",
    image: "/Cars/volkswagen-caravelle-minibus.png",
    pickUpCity: "Istanbul",
    fromPrice: 88
  }
] as const;
