import { MessagesValue, StateSchema } from "@langchain/langgraph";
import { resolverResultSchema } from "../../schema/resolver.schema.js";
import { travelDataSchema } from "../../schema/retrieval.schema.js";

export const AgentState = new StateSchema({
  messages: MessagesValue,
  resolvedQuery: resolverResultSchema.optional(),
  travelData: travelDataSchema.optional(),
});
