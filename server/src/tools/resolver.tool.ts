import { HumanMessage, SystemMessage, tool } from "langchain";
import { getModel } from "../lib/model";
import {
  resolverParamSchema,
  ResolverResult,
  resolverResultSchema,
} from "../schema/resolver.schema";

const itineraryPrompt = `You are a travel destination resolver.
Your job is to narrow down the best destination candidates based on the user's intent.

RULES:
- Return 1 destination candidates max — never brute force all countries
- Use your knowledge of seasons, climate, festivals, and travel trends to pick the best matches
- If the user mentions a specific country or city, return only that
- If the user is vague (e.g. "somewhere warm"), pick the top best matches
- If the query is too vague to even pick candidates, set needsMoreInfo to true and briefly respond to user in a friendly way and ask a clarifying question
- Always prefer quality over quantity — 2 great picks beat 4 mediocre ones
`;

// - If the user is vague (e.g. "somewhere warm"), pick the top 3-4 best matches
// - Consider conversation history — if user said "winter trip" before and now says "what about asia", resolve asian winter destinations

export const resolveQueryTool = tool(
  async (userQuery: string): Promise<ResolverResult> => {
    const agent = getModel(resolverResultSchema);
    console.log("resolveQuery...", userQuery);

    const result = await agent.invoke([
      new SystemMessage(itineraryPrompt),
      new HumanMessage(userQuery),
    ]);
    console.log("resolveQuery result", JSON.stringify(result));
    return result as ResolverResult;
  },
  {
    name: "resolve_query",
    description:
      "Extract travel destination from query or ask clarification question.",
    schema: resolverParamSchema,
  },
);
