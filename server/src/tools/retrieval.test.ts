import { ToolMessage } from "langchain";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockResolvedData, mockTravelData } from "../mock";
import { travelDataSchema } from "../schema/retrieval.schema";
import { generateDataTool, searchTravelTool } from "./retrieval.tool";

vi.mock("node-fetch"); // Global fetch mock

const mockModelResolvedQuery = vi.fn();
vi.mock("../lib/model", () => ({
  getModel: vi.fn().mockReturnValue({
    invoke: vi.fn(() => mockTravelData),
  }),
}));

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

    const result = await searchTravelTool.invoke(mockResolvedData);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/internal/data",
      expect.objectContaining({
        method: "GET",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: "Bali" }),
      }),
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
        body: result,
      }),
    );
  });
});
