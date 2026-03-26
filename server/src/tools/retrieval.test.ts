import { fakeModel } from "@langchain/core/testing";
import { ToolMessage } from "langchain";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockResolvedData, mockTravelData } from "../mock.js";
import { travelDataSchema } from "../schema/retrieval.schema.js";
import { generateDataTool, searchTravelTool } from "./retrieval.tool.js";

vi.mock("node-fetch"); // Global fetch mock

const mockModelResolvedQuery = vi.fn();
// comment the following to test with a real model
vi.mock("../lib/model", () => {
  const baseFake = fakeModel().structuredResponse(mockTravelData);
  const structuredModel = baseFake.withStructuredOutput(travelDataSchema);
  return {
    getModel: vi.fn(() => structuredModel),
  };
});

describe("searchTravelTool API call", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("calls API with correct destination", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResolvedData),
    } as any);

    global.fetch = mockFetch;

    const result = await searchTravelTool.invoke(
      mockResolvedData.candidates[0].city,
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/internal/data?destination=Bali",
      expect.objectContaining({ method: "GET" }),
    );

    expect(result).toBe(JSON.stringify(mockResolvedData));
  });

  test("returns NO_DATA on API error", async () => {
    mockModelResolvedQuery.mockReturnValue({
      ...mockResolvedData,
      candidates: [
        {
          ...mockResolvedData.candidates[0],
          country: "Planet",
          city: "Mars",
        },
      ],
    });
    const mockResponse = { error: "No data" };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue(mockResponse),
    } as any);

    global.fetch = mockFetch;

    const result = await searchTravelTool.invoke(mockModelResolvedQuery());

    expect(result).toBe("NO_DATA");
  });

  test("returns NO_DATA when fetch throws a network error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const result = await searchTravelTool.invoke(mockModelResolvedQuery());
    expect(result).toBe("NO_DATA");
  });

  test("returns NO_DATA when json() resolves to null", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(null),
    } as any);

    const result = await searchTravelTool.invoke(mockModelResolvedQuery());
    expect(result).toBe("NO_DATA");
  });
});

describe("generateDataTool AI call", () => {
  test("generate data tool return data", async () => {
    mockModelResolvedQuery.mockReturnValue({
      ...mockResolvedData,
      candidates: [
        {
          ...mockResolvedData.candidates[0],
          country: "France",
          city: "Paris",
        },
      ],
    });
    const result = await generateDataTool.invoke(mockModelResolvedQuery());
    const obj = ToolMessage.isInstance(result) ? result : JSON.parse(result);
    expect(obj).toEqual(expect.schemaMatching(travelDataSchema));
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/internal/data",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(obj),
      }),
    );
  });

  test("has all required field", async () => {
    const result = await generateDataTool.invoke(mockModelResolvedQuery());
    const parsed = JSON.parse(result as string);
    const popularSpotTypes = [
      "beach",
      "mountain",
      "temple",
      "museum",
      "city",
      "desert",
    ];
    const priceRanges = ["$", "$$", "$$$", "$$$$"];

    // TODO: split into multiple testcases? will increase cost if tested with a real model
    expect(parsed.destination.length).toBeGreaterThan(0);
    expect(Object.keys(parsed.weatherByMonth).length).toBeGreaterThan(0);
    expect(parsed.popularSpots.length).toBeLessThanOrEqual(3);
    expect(parsed.popularFoods.length).toBeLessThanOrEqual(3);
    expect(parsed.recommendedHotels.length).toBeLessThanOrEqual(2);
    expect(parsed.ongoingFestivals.length).toBeLessThanOrEqual(3);
    expect(parsed.travelTips.length).toBeLessThanOrEqual(2);

    parsed.popularSpots.forEach((spot: any) => {
      expect(popularSpotTypes).toContain(spot.type);
    });
    parsed.recommendedHotels.forEach((hotel: any) => {
      expect(hotel.starRating).toBeGreaterThanOrEqual(1);
      expect(hotel.starRating).toBeLessThanOrEqual(5);
    });
    parsed.popularFoods.forEach((food: any) => {
      expect(priceRanges).toContain(food.priceRange);
    });
  });
});
