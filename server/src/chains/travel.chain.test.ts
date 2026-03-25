import { fakeModel } from "@langchain/core/testing";
import { AIMessage, tool } from "langchain";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  mockResolvedClarifyData,
  mockResolvedData,
  mockTravelData,
} from "../mock.js";
import { resolverParamSchema } from "../schema/resolver.schema.js";
import { resolveQueryTool } from "../tools/resolver.tool.js";
import { generateDataTool, searchTravelTool } from "../tools/retrieval.tool.js";
import { planTravel } from "./travel.chain.js";

vi.mock("../tools/resolver.tool", () => ({
  resolveQueryTool: tool((query) => mockResolvedData, {
    name: "resolve_query",
    schema: resolverParamSchema,
  }),
}));

vi.mock("../tools/retrieval.tool", () => ({
  searchTravelTool: tool(() => JSON.stringify(mockTravelData), {
    name: "search_travel",
    schema: resolverParamSchema,
  }),
  generateDataTool: tool(() => JSON.stringify(mockTravelData), {
    name: "search_travel",
    schema: resolverParamSchema,
  }),
}));

vi.mock("../lib/model", () => ({
  getModel: () => fakeModel().respond(new AIMessage("Itinerary ready")),
}));

let resolveQuerySpy = vi.fn();
let searchTravelToolSpy = vi.fn();
let generateDataToolSpy = vi.fn();

describe("planTravel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    resolveQuerySpy = vi.spyOn(resolveQueryTool, "invoke");
    searchTravelToolSpy = vi.spyOn(searchTravelTool, "invoke");
    generateDataToolSpy = vi.spyOn(generateDataTool, "invoke");
  });

  test("should response with itenary", async () => {
    const chunks: string[] = [];

    await planTravel("Trip to Bali", "test-thread", (chunk) =>
      chunks.push(chunk),
    );

    expect(chunks.join("")).toContain("Itinerary ready");
    expect(resolveQuerySpy).toHaveBeenCalledWith(
      "Trip to Bali",
      expect.anything(),
    );
    expect(generateDataToolSpy).not.toHaveBeenCalled();
  });

  test("calls generateDataTool when search returns NO_DATA", async () => {
    const chunks: string[] = [];

    searchTravelToolSpy.mockImplementation(async () => "NO_DATA");
    await planTravel("Trip to Mars", "test-thread", (chunk) =>
      chunks.push(chunk),
    );

    expect(chunks.join("")).toContain("Itinerary ready");
    expect(generateDataToolSpy).toHaveBeenCalled();
  });

  test("streams the clarifying question as a chunk", async () => {
    resolveQuerySpy.mockImplementation(async () => mockResolvedClarifyData);
    const chunks: string[] = [];

    await planTravel("Hello", "test-thread", (chunk) => chunks.push(chunk));

    expect(chunks.join("")).toContain("What kind of trip are you thinking of?");
    expect(searchTravelToolSpy).not.toHaveBeenCalled();
    expect(generateDataToolSpy).not.toHaveBeenCalled();
  });

  test("should not call onChunk after signal is aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const onChunk = vi.fn();

    await planTravel(
      "Trip to Bali",
      "thread-abort",
      onChunk,
      controller.signal,
    );

    expect(onChunk).not.toHaveBeenCalled();
  });

  describe("onError", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test("throws an Error when resolveQueryTool throws error", async () => {
      resolveQuerySpy.mockRejectedValue(new Error("resolveQueryTool error"));

      await expect(
        planTravel("Trip to Bali", "thread-resolved-err", () => {}),
      ).rejects.toThrow("resolveQueryTool error");
    });

    test("call generateDataTool when searchTravelTool throws error", async () => {
      const chunks: string[] = [];
      searchTravelToolSpy.mockRejectedValue(
        new Error("searchTravelTool error"),
      );

      await planTravel("Trip to Mars", "thread-search-err", (chunk) =>
        chunks.push(chunk),
      );

      expect(chunks.join("")).toContain("Itinerary ready");
      expect(generateDataToolSpy).toHaveBeenCalled();
    });

    test("throws an Error when generateDataToolSpy throws error", async () => {
      searchTravelToolSpy.mockImplementation(async () => "NO_DATA");
      generateDataToolSpy.mockRejectedValue(new Error("generateData error"));

      await expect(
        planTravel("Trip to Bali", "thread-resolved-err", () => {}),
      ).rejects.toThrow("generateData error");
    });
  });
});
