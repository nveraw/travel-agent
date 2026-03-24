import {
  ConditionalEdgeRouter,
  END,
  type GraphNode,
  MessagesValue,
  START,
  StateGraph,
  StateSchema,
} from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import {
  AIMessage,
  createAgent,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "langchain";
import { getModel } from "../lib/model.js";
import { loggingMiddleware } from "../middleware/log.middleware.js";
import { resolverResultSchema } from "../schema/resolver.schema.js";
import { travelDataSchema } from "../schema/retrieval.schema.js";
import { resolveQueryTool } from "../tools/resolver.tool.js";
import { generateDataTool, searchTravelTool } from "../tools/retrieval.tool.js";

const itineraryPrompt = `You are an expert travel consultant.
Using ONLY the data provided, create a personalized, detailed, conversational itinerary.

Travel agent flow: 1) Resolve destination/clarify. 2) searchTravel to fetch real data. 3) generate_travel_data if missing. 4) Build itinerary.
Use memory for follow-ups like "shorter trip".

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

Make the response feel natural, human, friendly and exciting — not robotic, use emoji to look friendly.
`;

const checkpointer = new MemorySaver(); // Short-term memory per thread

const agent = createAgent({
  model: getModel(),
  tools: [resolveQueryTool, searchTravelTool, generateDataTool],
  checkpointer, // Enables memory
  middleware: [loggingMiddleware],
  systemPrompt: itineraryPrompt,
});

const AgentState = new StateSchema({
  messages: MessagesValue,
  resolvedQuery: resolverResultSchema.optional(),
  travelData: travelDataSchema.optional(),
});

const resolveNode: GraphNode<typeof AgentState> = async (state, config) => {
  try {
    const { signal } = config;
    console.log("resolveNode...", state.messages.at(-1)?.content);
    const result = await resolveQueryTool.invoke(
      state.messages.at(-1)?.content,
      {
        signal,
      },
    );
    console.log("resolveNode", "result", result);
    const parsed = resolverResultSchema.parse(result);
    const message =
      parsed.needsMoreInfo && parsed.clarifyingQuestion
        ? new AIMessage({
            content: parsed.clarifyingQuestion,
          })
        : new ToolMessage({
            content: JSON.stringify(result),
            tool_call_id: "resolve",
          });

    return {
      messages: [message],
      resolvedQuery: parsed,
    };
  } catch (err) {
    console.error("resolveNode error:", err);
    throw err;
  }
};

const searchNode: GraphNode<typeof AgentState> = async (state, config) => {
  const noData = {
    messages: [
      new ToolMessage({ content: "NO_DATA found", tool_call_id: "search" }),
    ],
    resolvedQuery: state.resolvedQuery,
    travelData: undefined,
  };
  try {
    const { signal } = config;
    const query = state.resolvedQuery;
    if (!query || !query.candidates?.[0]?.city)
      throw new Error("searchNode: missing resolvedQuery");
    console.log("searchNode...", query);
    const result = await searchTravelTool.invoke(query, { signal });
    console.log("searchNode", "result", result);
    if (result === "NO_DATA") {
      return noData;
    }
    const parsed = travelDataSchema.parse(result);
    return {
      messages: [
        new ToolMessage({
          content: JSON.stringify(result),
          tool_call_id: "search",
        }),
      ],
      resolvedQuery: state.resolvedQuery,
      travelData: parsed,
    };
  } catch (err) {
    console.error("searchNode error:", err);
    return noData;
    // do not throw error, run generateNode
    // throw err;
  }
};

const generateNode: GraphNode<typeof AgentState> = async (state, config) => {
  try {
    const { signal } = config;
    const query = state.resolvedQuery;
    if (!query || !query.candidates?.[0]?.city)
      throw new Error("generateNode: missing resolvedQuery");
    console.log("generateNode...", query);
    const result = await generateDataTool.invoke(query, { signal });
    console.log("generateNode", "result", result);
    const parsed = travelDataSchema.parse(result);
    return {
      messages: [
        new ToolMessage({
          content: JSON.stringify(result),
          tool_call_id: "generate",
        }),
      ],
      resolvedQuery: state.resolvedQuery,
      travelData: parsed,
    };
  } catch (err) {
    console.error("generateNode error:", err);
    throw err;
  }
};

const itineraryNode: GraphNode<typeof AgentState> = async (state, config) => {
  try {
    const { signal } = config;
    console.log("itineraryNode...");
    const messages = [new SystemMessage(itineraryPrompt), ...state.messages];
    const result = await getModel().invoke(messages, { signal }); // No tools needed
    console.log("itineraryNode", "result", result);
    return { messages: [result] };
  } catch (err) {
    console.error("itineraryNode error:", err);
    throw err;
  }
};

const routeAfterResolve: ConditionalEdgeRouter<typeof AgentState> = (state) => {
  const next = state.resolvedQuery?.needsMoreInfo ? "end" : "search";
  console.log("routeAfterResolve", next);
  return next;
};

const routeAfterSearch: ConditionalEdgeRouter<typeof AgentState> = (state) => {
  const next = state.travelData ? "itinerary" : "generate";
  console.log("routeAfterResolve", next);
  return next;
};

const graph = new StateGraph(AgentState)
  .addNode("resolve", resolveNode)
  .addNode("search", searchNode)
  .addNode("generate", generateNode)
  .addNode("itinerary", itineraryNode);

graph
  .addEdge(START, "resolve")
  .addConditionalEdges("resolve", routeAfterResolve, {
    end: END,
    search: "search",
  })
  .addConditionalEdges("search", routeAfterSearch, {
    generate: "generate",
    itinerary: "itinerary",
  })
  .addEdge("generate", "itinerary")
  .addEdge("itinerary", END);

const app = graph.compile();

export const planTravel = async (
  userQuery: string,
  threadId: string,
  onChunk: (chunk: any) => void,
  signal?: AbortSignal,
): Promise<void> => {
  console.log("planTravel...", { userQuery, threadId });
  try {
    const stream = await app.stream(
      { messages: [new HumanMessage(userQuery)] },
      { streamMode: "messages", signal, configurable: { thread_id: threadId } },
    );

    for await (const [chunk] of stream as any) {
      if (AIMessage.isInstance(chunk)) {
        if (signal?.aborted) break;
        onChunk(chunk.content);
      } else {
        // uncomment for logging tools response
        // console.log("Node complete:", Object.keys(chunk)[0]);
      }
    }
  } catch (err) {
    if (
      err instanceof Error &&
      (err.name === "AbortError" ||
        err.message === "Abort" ||
        err.name === "DOMException")
    ) {
      console.log("aborted...");
      return;
    }
    console.error("planTravel error", err);
    throw err instanceof Error ? err : new Error("Unknown error");
  }
};
