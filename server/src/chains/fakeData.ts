import "dotenv/config";
import { ChatMistralAI } from "@langchain/mistralai";
import {
  AIMessage,
  createAgent,
  HumanMessage,
  SystemMessage,
  toolStrategy,
} from "langchain";
import * as z from "zod";

const sessionHistories = new Map<
  string,
  (HumanMessage | AIMessage | SystemMessage)[]
>();

const model = new ChatMistralAI({
  apiKey: process.env.MISTRAL_API_KEY!,
  model: "open-mistral-7b",
  temperature: 0.9,
});

const Month = z.enum([
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
]);
const locationSchema = z.object({
  name: z.string().describe("Official place name"),
  latitude: z.number(),
  longitude: z.number(),
  city: z.string(),
  country: z.string(),
});
const fakeDataSchema = z.object({
  destination: z
    .string()
    .describe(
      "resolved destination name (infer if vague, pick a great one if none given)",
    ),
  weatherByMonth: z
    .record(
      Month,
      z.object({
        condition: z.enum(["sunny", "rainy", "snowy", "cloudy", "stormy"]),
        tempCelsius: z.number(),
        humidity: z.enum(["low", "medium", "high"]),
      }),
    )
    .describe(""),
  popularSpots: z.array(
    z.object({
      name: z.string(),
      location: locationSchema,
      type: z.enum(["beach", "mountain", "temple", "museum", "city", "desert"]),
      bestSeason: z.enum(["spring", "summer", "autumn", "winter", "all-year"]),
    }),
  ).max(3),
  popularFoods: z.array(
    z.object({
      name: z.string().describe("Famous local dish name"),
      description: z.string().describe("Short description of the dish"),
      bestPlaceToTry: z.object({
        name: z.string().describe("Restaurant or area name"),
        location: locationSchema,
      }),
      priceRange: z.enum(["$", "$$", "$$$", "$$$$"]),
    }),
  ).max(3),
  recommendedHotels: z.array(
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
  ).max(2),
  ongoingFestivals: z.array(
    z.object({
      name: z.string(),
      location: locationSchema,
      month: Month,
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
  ).max(3),
  travelTips: z.array(z.string()).max(2),
});

const agent = createAgent({
  model,
  responseFormat: toolStrategy(fakeDataSchema),
});

export const generateFakeData = async (
  sessionId: string,
  userQuery: string,
  resolved: string,
) => {
  console.log("generateFakeData...");
  if (!sessionHistories.has(sessionId)) {
    console.log(sessionId, sessionHistories);
    if (sessionHistories.size >= 2) {
      const oldestKey = sessionHistories.keys().next().value;
      if (oldestKey) sessionHistories.delete(oldestKey);
    }
    sessionHistories.set(sessionId, [
      new SystemMessage(`
You are a world travel knowledge database.

Generate realistic, geographically accurate travel data.
Food must match the destination cuisine.
Hotels should reflect real-world pricing for that country.
Weather must align with climate zones based on the bestMonth in given context.
Festivals should be culturally appropriate.
bestSeason for the Popular spots should also based on the bestMonth in given context.

context (infer the location and time):
${resolved}

Be creative but realistic.
`),
    ]);
  }

  const messages = sessionHistories.get(sessionId)!;
  messages.push(new HumanMessage(userQuery));

  const result = await agent.invoke({
    messages,
  });
  return result.structuredResponse;
};
