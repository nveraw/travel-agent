import { fakeModel } from "@langchain/core/testing";
import { AIMessage, tool } from "langchain";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockResolvedData, mockTravelData } from "../mock";
import {
  resolverParamSchema,
  resolverResultSchema,
} from "../schema/resolver.schema";
import { planTravel } from "./travel.chain";

vi.mock("../tools/resolver.tool", () => ({
  resolveQueryTool: tool((query) => mockResolvedData, {
    name: "resolve_query",
    schema: resolverParamSchema,
  }),
}));

vi.mock("../tools/retrieval.tool", () => ({
  searchTravelTool: tool((resolved) => mockTravelData, {
    name: "search_travel",
    schema: resolverResultSchema,
  }),
  generateDataTool: tool((resolved) => mockTravelData, {
    name: "search_travel",
    schema: resolverResultSchema,
  }),
}));

vi.mock("../lib/model", () => ({
  getModel: () => fakeModel().respond(new AIMessage("Itinerary ready")),
}));

describe("planTravel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("should response with itenary", async () => {
    let messages = "";
    await planTravel(
      "Trip to Bali",
      "test-thread",
      (chunk: any) => (messages = messages + chunk),
    );
    expect(messages).toBe("Itinerary ready");
  });
});
