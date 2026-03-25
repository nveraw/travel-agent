import { type GraphNode } from "@langchain/langgraph";
import { ToolMessage } from "langchain";
import { travelDataSchema } from "../../schema/retrieval.schema.js";
import { generateDataTool } from "../../tools/retrieval.tool.js";
import { AgentState } from "./graph.schema.js";

export const generateNode: GraphNode<typeof AgentState> = async (
  state,
  config,
) => {
  try {
    const query = state.resolvedQuery;
    if (!query || !query.candidates?.[0]?.city)
      throw new Error("generateNode: missing resolvedQuery");
    console.log("generateNode...", query);
    const result = await generateDataTool.invoke(query, config);
    console.log("generateNode", "result", result);
    const parsed = travelDataSchema.parse(JSON.parse(result));
    return {
      messages: [
        new ToolMessage({
          content: result,
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
