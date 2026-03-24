import { ResolverResult } from "./schema/resolver.schema.js";
import { TravelDataResult } from "./schema/retrieval.schema.js";

export const mockResolvedData: ResolverResult = {
  candidates: [
    {
      country: "Indonesia",
      city: "Bali",
      reason: "Exact match, no further filtering required",
      bestMonths: ["June", "July"],
      highlights: ["Beaches", "Temples", "Cultural Festivals"],
    },
  ],
  needsMoreInfo: false,
  clarifyingQuestion: "",
};

export const mockResolvedClarifyData: ResolverResult = {
  candidates: [],
  needsMoreInfo: true,
  clarifyingQuestion: "What kind of trip are you thinking of?",
};

export const mockTravelData: TravelDataResult = {
  destination: "Paris, France",
  weatherByMonth: {
    January: {
      condition: "snowy",
      tempCelsius: -1,
      humidity: "high",
    },
  },
  popularSpots: [
    {
      name: "Eiffel Tower",
      location: {
        name: "Paris",
        latitude: 48.8566,
        longitude: 2.3522,
        city: "Paris",
        country: "France",
      },
      type: "city",
      bestSeason: "summer",
    },
    {
      name: "Louvre Museum",
      location: {
        name: "Paris",
        latitude: 48.8605,
        longitude: 2.2943,
        city: "Paris",
        country: "France",
      },
      type: "museum",
      bestSeason: "summer",
    },
    {
      name: "Montmartre neighborhood",
      location: {
        name: "Paris",
        latitude: 48.8951,
        longitude: 2.3013,
        city: "Paris",
        country: "France",
      },
      type: "city",
      bestSeason: "summer",
    },
  ],
  popularFoods: [
    {
      name: "Escargot",
      description:
        "Snails cooked in garlic butter, typically served as an appetizer.",
      bestPlaceToTry: {
        name: "Le Comptoir du Relais",
        location: {
          name: "Paris",
          latitude: 48.8566,
          longitude: 2.3522,
          city: "Paris",
          country: "France",
        },
      },
      priceRange: "$$$",
    },
    {
      name: "Coq au Vin",
      description: "Chicken cooked in red wine with mushrooms and bacon.",
      bestPlaceToTry: {
        name: "Le Grand Vefour",
        location: {
          name: "Paris",
          latitude: 48.8605,
          longitude: 2.2943,
          city: "Paris",
          country: "France",
        },
      },
      priceRange: "$$$",
    },
    {
      name: "Crepes",
      description: "Thin pancakes that can be savory or sweet.",
      bestPlaceToTry: {
        name: "Breizh Café",
        location: {
          name: "Paris",
          latitude: 48.8951,
          longitude: 2.3013,
          city: "Paris",
          country: "France",
        },
      },
      priceRange: "$",
    },
  ],
  recommendedHotels: [
    {
      name: "Hotel Plaza Athenee",
      starRating: 5,
      location: {
        name: "Paris",
        latitude: 48.8566,
        longitude: 2.3522,
        city: "Paris",
        country: "France",
      },
      pricePerNightUSD: 550,
      amenities: ["pool", "restaurant", "spa", "bar", "gym"],
    },
    {
      name: "Hotel Le Walt",
      starRating: 3,
      location: {
        name: "Paris",
        latitude: 48.8605,
        longitude: 2.2943,
        city: "Paris",
        country: "France",
      },
      pricePerNightUSD: 120,
      amenities: ["restaurant", "bar"],
    },
  ],
  ongoingFestivals: [
    {
      name: "Bastille Day",
      location: {
        name: "Paris",
        latitude: 48.8566,
        longitude: 2.3522,
        city: "Paris",
        country: "France",
      },
      month: "July",
      durationDays: 5,
      description:
        "Annual military parade to commemorate the Storming of the Bastille.",
      type: "cultural",
    },
    {
      name: "Rock en Seine",
      location: {
        name: "Paris",
        latitude: 48.8566,
        longitude: 2.3522,
        city: "Paris",
        country: "France",
      },
      month: "August",
      durationDays: 3,
      description: "Annual music festival featuring rock and pop bands.",
      type: "music",
    },
  ],
  travelTips: [
    "Learn some basic French phrases to communicate with locals.",
    "Dress modestly when visiting churches or cathedrals.",
  ],
};
