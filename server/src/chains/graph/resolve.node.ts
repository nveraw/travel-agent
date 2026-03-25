import { type GraphNode } from "@langchain/langgraph";
import { AIMessage, HumanMessage, ToolMessage } from "langchain";
import { resolverResultSchema } from "../../schema/resolver.schema.js";
import { resolveQueryTool } from "../../tools/resolver.tool.js";
import { AgentState } from "./graph.schema.js";

export const resolveNode: GraphNode<typeof AgentState> = async (
  state,
  config,
) => {
  try {
    const fullMessage: string = state.messages
      .map((msg) =>
        HumanMessage.isInstance(msg) ? (msg.content as string) : "",
      )
      .filter((msg) => !!msg)
      .join("\n");
    console.log("resolveNode...", fullMessage);
    const result = await resolveQueryTool.invoke(fullMessage, config);
    console.log("resolveNode", "result", result);
    const parsed = resolverResultSchema.parse(result);
    const message =
      parsed.needsMoreInfo && parsed.clarifyingQuestion.length
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
