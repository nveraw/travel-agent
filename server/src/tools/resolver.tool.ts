import { HumanMessage, SystemMessage, tool } from "langchain";
import { getModel } from "../lib/model.js";
import {
  resolverParamSchema,
  ResolverResult,
  resolverResultSchema,
} from "../schema/resolver.schema.js";

const resolveQueryPrompt = `You are a travel destination resolver.
Your job is to narrow down the best destination candidates based on the user's intent.

RULES:
- Return 1 destination candidates max — never brute force all countries
- Use your knowledge of seasons, climate, festivals, and travel trends to pick the best matches
- If the user is vague (e.g. "somewhere warm"), pick the top 3-4 best matches
- If the user mentions only a country, set city to the most iconic/popular city based on climate, seasons and festivals for that country
- If the user mentions a specific city, use that city exactly and set the country
- If the user is vague (e.g. "somewhere warm"), pick the top best matches
- If the query is too vague to even pick candidates, set needsMoreInfo to true and briefly respond to user in a friendly way and ask a clarifying question
- Always prefer quality over quantity — 2 great picks beat 4 mediocre ones
`;

export const resolveQueryTool = tool(
  async (userQuery: string, config): Promise<ResolverResult> => {
    const agent = getModel(resolverResultSchema);
    console.log("resolveQuery...", userQuery);

    let historyContext = "";
    if (config?.configurable?.user_pref) {
      const prefs = config?.configurable?.user_pref || "unknown";
      historyContext = prefs?.value
        ? `\nUser prefs: ${JSON.stringify(prefs.value)}`
        : "";
    }

    const result = await agent.invoke(
      [
        new SystemMessage(resolveQueryPrompt + historyContext),
        new HumanMessage(userQuery),
      ],
      config,
    );
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
