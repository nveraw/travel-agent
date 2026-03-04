import "dotenv/config";
import { ChatMistralAI } from "@langchain/mistralai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatMistralAI({
  apiKey: process.env.MISTRAL_API_KEY!,
  model: "mistral-large-latest", // or "mistral-small-latest", "open-mistral-7b"
  streaming: true,
  // maxTokens: 2000,
});

const itineraryPrompt = PromptTemplate.fromTemplate(`
You are an expert travel consultant. Using the world data below, create a personalized travel recommendation and detailed itinerary.

USER REQUEST: {userQuery}

WORLD DATA (use this to inform your suggestions):
{worldData}

INSTRUCTIONS:
- If user specified a destination, use it. Otherwise pick the best one from the data.
- If user specified travel dates/months, use them. Otherwise recommend the best time based on weather + festivals.
- Factor in weather suitability (e.g. don't suggest beaches in rainy season, suggest snow spots in winter).
- Highlight any festivals happening during the suggested travel period.
- Create a day-by-day itinerary using the popular spots.
- Be conversational, enthusiastic, and specific.

FORMAT YOUR RESPONSE AS:

## ✈️ Your Travel Recommendation

**Best time to visit:** [dates/months]

[Opening paragraph explaining why this destination + timing is perfect]

## 🌤️ Weather During Your Visit
[Weather details for the recommended period]

## 🎉 Festivals & Events
[Any festivals happening, or mention it's a quieter period if none]

## 📍 Must-Visit Spots
[List the top spots with brief descriptions]

## 🗓️ Day-by-Day Itinerary
[Detailed daily plan, 5-7 days]

## 💡 Travel Tips
[3-4 practical tips]
`);

export async function streamItinerary(
  userQuery: string,
  worldData: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const chain = itineraryPrompt.pipe(model).pipe(new StringOutputParser());

  const stream = await chain.stream({ userQuery, worldData, signal });

  for await (const chunk of stream) {
    if (signal?.aborted) break;
    onChunk(chunk);
  }
}