import {
  ConditionalEdgeRouter,
  END,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { generateNode } from "./generate.node.js";
import { AgentState } from "./graph.schema.js";
import { itineraryNode } from "./itinerary.node.js";
import { resolveNode } from "./resolve.node.js";
import { searchNode } from "./search.node.js";

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

export { graph };
