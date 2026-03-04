import { ChatMistralAI } from "@langchain/mistralai";
import "dotenv/config";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
// import { generateFakeData } from "./fakeData";

const model = new ChatMistralAI({
  apiKey: process.env.MISTRAL_API_KEY!,
  model: "mistral-small-latest", // or "mistral-large-latest"
});

const sessionHistories = new Map<string, (HumanMessage | AIMessage | SystemMessage)[]>();

const itineraryPrompt = `
You are an expert travel consultant. Using ONLY the world data provided, create a personalized, detailed, conversational itinerary.

STRICT RULES:
- Do NOT invent restaurants, hotels, or attractions outside WORLD DATA.
- All meals must come from the popularFoods list.
- All attractions must come from popularSpots.
- All festivals must come from ongoingFestivals.
- Hotels must come from recommendedHotels.
- Suggest the best date based data from worldData such as weather and festivals

MEALS REQUIREMENT:
- Each day must include Breakfast, Lunch, and Dinner.
- Meals must use dishes or restaurants from popularFoods.
- If a popular spot is large (e.g., theme park, beach district, cultural complex),
  you may assume meals are consumed inside that location without adding extra travel.
- Distribute foods logically across the trip (avoid repeating the same dish daily).

ACTIVITY BALANCE:
- If user specifies activity preference → prioritize it.
- If no preference → create a balanced mix:
  - cultural experiences
  - leisure time
  - food experiences
  - light adventure (if destination allows)

HOTEL LOGIC:
- If user specifies budget → recommend the matching tier only.
- If no budget specified → briefly suggest both budget and luxury options.
- Assume hotel from WORLD DATA as accommodation base for itinerary.

COST ESTIMATION:
- Provide a realistic total estimated cost at the end.
- Use the pricing logic from WORLD DATA.
- Show two totals if both budget and luxury were suggested.

Make the response feel natural, human, and exciting — not robotic.
`

export async function streamItinerary(
  userQuery: string,
  worldData: string,
  sessionId: string,
  onChunk: (chunk: any) => void,
  signal?: AbortSignal
): Promise<void> {
  if (!sessionHistories.has(sessionId)) {
    console.log(sessionId, sessionHistories)
    if (sessionHistories.size >= 2) {
      const oldestKey = sessionHistories.keys().next().value;
      if (oldestKey) sessionHistories.delete(oldestKey);
    }
    sessionHistories.set(sessionId, [
      new SystemMessage(itineraryPrompt)
    ]);
  }

  const chatHistory = sessionHistories.get(sessionId)!;
  chatHistory.push(new HumanMessage(`
WORLD DATA (use this to inform your suggestions):
${worldData}

USER QUERY:
${userQuery}
`));
  // console.log('chatHistory', chatHistory)

  const stream = await model.stream(chatHistory, {signal});

  let fullResponse = "";
  for await (const chunk of stream) {
    if (signal?.aborted) break;
    if (chunk?.content) {
      fullResponse += chunk.content;
      onChunk(chunk.content);
    }
  }
  chatHistory.push(new AIMessage(fullResponse));
  sessionHistories.set(sessionId, chatHistory);
}