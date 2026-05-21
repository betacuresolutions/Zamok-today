export type AirportCarRentalOption = {
  id: string;
  nameKey: string;
  image: string;
  pickUpLocation: string;
};

export const AIRPORT_CAR_RENTAL_OPTIONS: ReadonlyArray<AirportCarRentalOption> = [
  {
    id: "istanbul",
    nameKey: "cars.airport.istanbul",
    image: "/Airport-Car-Rental/istanbul-airport.jpeg",
    pickUpLocation: "Istanbul Airport"
  },
  {
    id: "ankara-esenboga",
    nameKey: "cars.airport.ankaraEsenboga",
    image: "/Airport-Car-Rental/ankara-esenboga-international-airport.jpeg",
    pickUpLocation: "Ankara Esenboga Airport"
  },
  {
    id: "antalya",
    nameKey: "cars.airport.antalya",
    image: "/Airport-Car-Rental/antalya-airport.jpeg",
    pickUpLocation: "Antalya Airport"
  },
  {
    id: "sabiha-gokcen",
    nameKey: "cars.airport.sabihaGokcen",
    image: "/Airport-Car-Rental/sabiha-gokcen-international-airport.jpeg",
    pickUpLocation: "Sabiha Gokcen Airport"
  }
] as const;
