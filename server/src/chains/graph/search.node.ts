import { type GraphNode } from "@langchain/langgraph";
import { ToolMessage } from "langchain";
import { travelDataSchema } from "../../schema/retrieval.schema.js";
import { searchTravelTool } from "../../tools/retrieval.tool.js";
import { AgentState } from "./graph.schema.js";

export const searchNode: GraphNode<typeof AgentState> = async (
  state,
  config,
) => {
  const noData = {
    messages: [
      new ToolMessage({ content: "NO_DATA found", tool_call_id: "search" }),
    ],
    resolvedQuery: state.resolvedQuery,
    travelData: undefined,
  };
  try {
    const query = state.resolvedQuery;
    if (!query || !query.candidates?.[0]?.city)
      throw new Error("searchNode: missing resolvedQuery");
    console.log("searchNode...", query);
    const result = await searchTravelTool.invoke(
      query.candidates[0].city,
      config,
    );
    console.log("searchNode", "result", result);
    if (result === "NO_DATA") {
      return noData;
    }
    const parsed = travelDataSchema.parse(JSON.parse(result));
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
