import "dotenv/config";
import { ChatMistralAI } from "@langchain/mistralai";
import { AIMessage, createAgent, HumanMessage, SystemMessage, toolStrategy } from "langchain";
import * as z from "zod";

const sessionHistories = new Map<
  string,
  (HumanMessage | AIMessage | SystemMessage)[]
>();

const model = new ChatMistralAI({
  apiKey: process.env.MISTRAL_API_KEY!,
  model: "mistral-small-latest",
  temperature: 0.3,
});

const resolverSchema = z.object({
  candidates: z.array(z.object({
    country: z.string().describe("Country name"),
    city: z.string().optional().describe("Specific city if mentioned or inferred"),
    reason: z.string().describe("Why this destination suits the user's intent"),
    bestMonths: z.array(z.enum([
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ])).describe("Best months to visit for this intent"),
    highlights: z.array(z.string()).describe("3-5 key highlights that match user intent"),
  })).min(1).max(1).describe("Top destination candidates based on user intent"),
  needsMoreInfo: z.boolean().describe("True if user query is too vague to resolve candidates"),
  clarifyingQuestion: z.string().optional().describe("Question to ask user if needsMoreInfo is true"),
});

export type ResolverResult = z.infer<typeof resolverSchema>;

const agent = createAgent({
  model,
  responseFormat: toolStrategy(resolverSchema),
});

export const resolveQuery = async (
  sessionId: string,
  userQuery: string,
): Promise<ResolverResult> => {
  console.log("resolveQuery...");

  if (!sessionHistories.has(sessionId)) {
    if (sessionHistories.size >= 2) {
      const oldestKey = sessionHistories.keys().next().value;
      if (oldestKey) sessionHistories.delete(oldestKey);
    }
    sessionHistories.set(sessionId, [
      new SystemMessage(`
You are a travel destination resolver. Your job is to narrow down the best destination candidates based on the user's intent.

RULES:
- Return 1 destination candidates max — never brute force all countries
- Use your knowledge of seasons, climate, festivals, and travel trends to pick the best matches
- If the user mentions a specific country or city, return only that
- If the user is vague (e.g. "somewhere warm"), pick the top 3-4 best matches
- If the query is too vague to even pick candidates, set needsMoreInfo to true and briefly responsed to user in a friendly way and ask a clarifying question
- Consider conversation history — if user said "winter trip" before and now says "what about asia", resolve asian winter destinations
- Always prefer quality over quantity — 2 great picks beat 4 mediocre ones
`),
    ]);
  }

  const messages = sessionHistories.get(sessionId)!;
  messages.push(new HumanMessage(userQuery));

  const result = await agent.invoke({ messages });
  return result.structuredResponse;
};