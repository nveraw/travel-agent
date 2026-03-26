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

const updateUserPrefs = async (
  userQuery: string,
  config: Record<string, any>,
  result: ResolverResult,
) => {
  const { store, thread_id } = config?.configurable || {};
  if (!store || !thread_id) return;
  const userPrefs = await store.get(["users", thread_id], "travel_prefs");
  const newUserPrefs = {
    ...(userPrefs?.value ?? {}),
    lastDestination: result.candidates,
    history: [
      ...(userPrefs?.value?.history ?? []),
      {
        query: userQuery,
        city: result.candidates[0]?.city,
        country: result.candidates[0]?.country,
        bestMonths: result.candidates[0]?.bestMonths,
        timestamp: new Date().toISOString(),
      },
    ].slice(-5),
  };
  console.log("updateUserPrefs...", newUserPrefs);
  await store.put(["users", thread_id], "travel_prefs", newUserPrefs);
};

export const resolveQueryTool = tool(
  async (userQuery: string, config): Promise<ResolverResult> => {
    const agent = getModel(resolverResultSchema);
    console.log("resolveQuery...", userQuery);

    let historyContext = "";
    const { store, thread_id } = config?.configurable || {};
    let userPrefs;
    if (store && thread_id) {
      userPrefs = await store.get(["users", thread_id], "travel_prefs");
      historyContext = userPrefs?.value
        ? `\nUser prefs: ${JSON.stringify(userPrefs.value)}`
        : "";
    }

    const result: ResolverResult = await agent.invoke(
      [
        new SystemMessage(resolveQueryPrompt + historyContext),
        new HumanMessage(userQuery),
      ],
      config,
    );
    updateUserPrefs(userQuery, config, result);
    console.log("resolveQuery result", JSON.stringify(result));
    return result;
  },
  {
    name: "resolve_query",
    description:
      "Extract travel destination from query or ask clarification question.",
    schema: resolverParamSchema,
  },
);
