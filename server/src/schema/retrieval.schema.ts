import * as z from "zod";

const monthSchema = z.object({
  condition: z.enum(["sunny", "rainy", "snowy", "cloudy", "stormy"]),
  tempCelsius: z.number(),
  humidity: z.enum(["low", "medium", "high"]),
});
const locationSchema = z.object({
  name: z
    .string()
    .describe("UNIQUE official place name, building name, street name, etc"),
  latitude: z.number(),
  longitude: z.number(),
  city: z.string(),
  country: z.string(),
});
export const fakeDataSchema = z.object({
  destination: z
    .string()
    .describe(
      "resolved destination name (infer if vague, pick a great one if none given)",
    ),
  weatherByMonth: z
    .object({
      January: monthSchema,
      February: monthSchema,
      March: monthSchema,
      April: monthSchema,
      May: monthSchema,
      June: monthSchema,
      July: monthSchema,
      August: monthSchema,
      September: monthSchema,
      October: monthSchema,
      November: monthSchema,
      December: monthSchema,
    })
    .partial()
    .describe(""),
  popularSpots: z
    .array(
      z.object({
        name: z.string(),
        location: locationSchema,
        type: z.enum([
          "beach",
          "mountain",
          "temple",
          "museum",
          "city",
          "desert",
        ]),
        bestSeason: z.enum([
          "spring",
          "summer",
          "autumn",
          "winter",
          "all-year",
        ]),
      }),
    )
    .max(3),
  popularFoods: z
    .array(
      z.object({
        name: z.string().describe("Famous local dish name"),
        description: z.string().describe("Short description of the dish"),
        bestPlaceToTry: z.object({
          name: z.string().describe("Restaurant or area name"),
          location: locationSchema,
        }),
        priceRange: z.enum(["$", "$$", "$$$", "$$$$"]),
      }),
    )
    .max(3),
  recommendedHotels: z
    .array(
      z.object({
        name: z.string(),
        starRating: z.number().min(1).max(5),
        location: locationSchema,
        pricePerNightUSD: z.number(),
        amenities: z.array(
          z.enum([
            "wifi",
            "pool",
            "spa",
            "gym",
            "restaurant",
            "bar",
            "parking",
            "airport shuttle",
          ]),
        ),
      }),
    )
    .max(2),
  ongoingFestivals: z
    .array(
      z.object({
        name: z.string(),
        location: locationSchema,
        month: z.enum([
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ]),
        durationDays: z.number(),
        description: z.string(),
        type: z.enum([
          "cultural",
          "music",
          "religious",
          "food",
          "art",
          "national",
        ]),
      }),
    )
    .max(3),
  travelTips: z.array(z.string()).max(2),
});
export type FakeDataResult = z.infer<typeof fakeDataSchema>;
