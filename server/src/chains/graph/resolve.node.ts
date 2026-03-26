import { type GraphNode } from "@langchain/langgraph";
import { AIMessage, ToolMessage } from "langchain";
import { resolverResultSchema } from "../../schema/resolver.schema.js";
import { resolveQueryTool } from "../../tools/resolver.tool.js";
import { AgentState } from "./graph.schema.js";

export const resolveNode: GraphNode<typeof AgentState> = async (
  state,
  config,
) => {
  try {
    console.log("resolveNode...", state.messages.at(-1)?.content);
    const result = await resolveQueryTool.invoke(
      state.messages.at(-1)?.content,
      config,
    );
    console.log("resolveNode", "result", result);
    const parsed = resolverResultSchema.parse(result);
    const message =
      parsed.needsMoreInfo && parsed.clarifyingQuestion.length
        ? new AIMessage({
            content: parsed.clarifyingQuestion,
            additional_kwargs: { clarify: true },
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
