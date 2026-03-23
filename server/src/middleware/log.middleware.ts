import { createMiddleware } from "langchain";

export const loggingMiddleware = createMiddleware({
  name: "travelAgentLogger",

  // Before each LLM call: log input + perf start
  beforeModel: async (request) => {
    console.log(
      "🚀 Agent Input",
      request.messages.map((m) => m.content).join("/n"),
    );
    const start = performance.now();
    // request._perfStart = start;
    return { ...request, _perfStart: start };
  },

  // After LLM response: log output + tool calls + duration
  afterModel: async (response) => {
    // const perfStart = response._perfStart;
    console.log("🤖 LLM Output", response);
  },

  // Wrap tool execution: log args + result + errors
  wrapToolCall: async (request, handler) => {
    console.log("🔧 Tool Start", request.tool?.name);

    try {
      const result = await handler(request);
      console.log("✅ Tool Success", {
        tool: request.tool?.name,
        result: result,
      });
      return result;
    } catch (error) {
      console.error("❌ Tool Failed", {
        tool: request.tool?.name,
        error: error,
      });
      throw error;
    }
  },

  // Optional: Final agent completion
  afterAgent: async (finalState) => {
    console.log("🏁 Agent Complete", finalState);
  },
});
