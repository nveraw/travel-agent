import "dotenv/config";
import { ChatMistralAI } from "@langchain/mistralai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatMistralAI({
  apiKey: process.env.MISTRAL_API_KEY!,
  model: "mistral-large-latest", // or "mistral-small-latest", "open-mistral-7b"
  temperature: 0.9,
});

const fakeDataPrompt = PromptTemplate.fromTemplate(`
You are a world knowledge database. Generate realistic travel data for the following request.
User travel query: {userQuery}

Return a JSON object (no markdown, raw JSON only) with this exact structure:
{{
  "destination": "resolved destination name (infer if vague, pick a great one if none given)",
  "suggestedMonths": ["month1", "month2"],
  "weatherByMonth": {{
    "January": {{ "condition": "sunny/rainy/snowy/etc", "tempCelsius": 25, "humidity": "low/medium/high" }},
    "February": {{ ... }},
    ... all 12 months
  }},
  "popularSpots": [
    {{ "name": "spot name", "type": "beach/mountain/temple/museum/etc", "bestSeason": "summer/winter/all-year" }},
    {{ "name": "...", "type": "...", "bestSeason": "..." }},
    {{ "name": "...", "type": "...", "bestSeason": "..." }},
    {{ "name": "...", "type": "...", "bestSeason": "..." }},
    {{ "name": "...", "type": "...", "bestSeason": "..." }}
  ],
  "ongoingFestivals": [
    {{ "name": "festival name", "month": "December", "duration": "3 days", "description": "brief description" }},
    {{ "name": "...", "month": "...", "duration": "...", "description": "..." }},
    {{ "name": "...", "month": "...", "duration": "...", "description": "..." }}
  ],
  "travelTips": ["tip1", "tip2", "tip3"]
}}

Be creative and realistic. Generate data that makes sense for the actual destination.
`);

export async function generateFakeData(userQuery: string): Promise<string> {
  const chain = fakeDataPrompt.pipe(model).pipe(new StringOutputParser());
  const result = await chain.invoke({ userQuery });
  return result;
}