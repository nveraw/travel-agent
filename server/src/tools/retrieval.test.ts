import { beforeEach, describe, expect, test, vi } from "vitest";
import { fakeData, getResolvedData } from "../mock";
import { fakeDataSchema } from "../schema/retrieval.schema";
import { generateDataTool, searchTravelTool } from "./retrieval.tool";

vi.mock("node-fetch"); // Global fetch mock

const getResolverResult = vi.fn(getResolvedData);

vi.mock("../lib/model", () => ({
  getModel: vi.fn().mockReturnValue({
    invoke: vi.fn(() => fakeData),
  }),
}));

describe("searchTravelTool API call", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("calls API with correct destination", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(getResolvedData()),
    } as any);

    global.fetch = mockFetch;

    const result = await searchTravelTool.invoke(getResolverResult());

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/internal/data",
      expect.objectContaining({
        method: "GET",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: "Bali" }),
      }),
    );

    expect(result).toBe(JSON.stringify(getResolvedData()));
  });

  test("returns NO_DATA on API error", async () => {
    const mockResponse = { error: "No data" };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue(mockResponse),
    } as any);

    global.fetch = mockFetch;

    const result = await searchTravelTool.invoke(
      getResolverResult({
        country: "Planet",
        city: "Mars",
      }),
    );

    expect(result).toBe("NO_DATA");
  });
});

describe("generateDataTool AI call", () => {
  test("generate data tool return data", async () => {
    const result = await generateDataTool.invoke(
      getResolverResult({ country: "France", city: "Paris" }),
    );
    expect(result).toEqual(expect.schemaMatching(fakeDataSchema));
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/internal/data",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      }),
    );
  }, 200_000);
});
