import { InMemoryStore } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { AIMessage, HumanMessage } from "langchain";
import { graph } from "./graph/graph.js";

const checkpointer = new MemorySaver();
const store = new InMemoryStore();

export const planTravel = async (
  userQuery: string,
  threadId: string,
  onChunk: (chunk: any) => void,
  signal?: AbortSignal,
): Promise<void> => {
  const app = graph.compile({ checkpointer, store });
  const userPrefs = await store.get(["users", threadId], "travel_prefs");
  console.log("planTravel...", { userQuery, threadId });
  try {
    const stream = await app.stream(
      { messages: [new HumanMessage(userQuery)] },
      {
        streamMode: "messages",
        signal,
        configurable: { thread_id: threadId, user_pref: userPrefs },
      },
    );

    for await (const [chunk, metadata] of stream as any) {
      if (
        metadata?.langgraph_node === "itinerary" &&
        AIMessage.isInstance(chunk)
      ) {
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
