import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockResolvedClarifyData, mockResolvedData } from "../mock";
import { resolverResultSchema } from "../schema/resolver.schema";
import { resolveQueryTool } from "./resolver.tool";

const mockModelInvoke = vi.fn().mockReturnValue({
  ...mockResolvedData,
  candidates: [
    {
      ...mockResolvedData.candidates[0],
      country: "France",
      city: "Paris",
    },
  ],
});
vi.mock("../lib/model", () => ({
  getModel: vi.fn().mockReturnValue({
    invoke: vi.fn(() => mockModelInvoke()),
  }),
}));

describe("resolveQueryTool", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("return country from city query", async () => {
    const result = await resolveQueryTool.invoke("Trip to Paris");

    expect(result.needsMoreInfo).toEqual(false);
    expect(result.candidates[0].country).toEqual("France");
    expect(result.candidates[0].city).toEqual("Paris");
  });

  test("return city from country query", async () => {
    mockModelInvoke.mockReturnValue({
      ...mockResolvedData,
      candidates: [
        {
          ...mockResolvedData.candidates[0],
          country: "Japan",
          city: "Tokyo",
        },
      ],
    });
    const result = await resolveQueryTool.invoke("Trip to Japan");

    expect(result.needsMoreInfo).toEqual(false);
    expect(result.candidates[0].country).toEqual("Japan");
    expect(result.candidates[0].city.length).toBeGreaterThan(0);
  });

  test("return all required fields", async () => {
    const result = await resolveQueryTool.invoke("Trip to Paris");

    expect(Array.isArray(result.candidates)).toBe(true);
    expect(result.candidates.length).toBeGreaterThan(0);
    const candidate = result.candidates[0];

    expect(result).toEqual(expect.schemaMatching(resolverResultSchema));
    expect(candidate.country).toBeTruthy();
    expect(candidate.city).toBeTruthy();
    expect(candidate.reason).toBeTruthy();
    expect(Array.isArray(candidate.bestMonths)).toBe(true);
    expect(candidate.bestMonths.length).toBeGreaterThan(0);
    expect(Array.isArray(candidate.highlights)).toBe(true);
    expect(candidate.highlights.length).toBeGreaterThan(0);
  });

  test("return country from vague query", async () => {
    const result = await resolveQueryTool.invoke("Summer Trip in Asia");

    expect(result.candidates[0].country.length).toBeGreaterThan(0);
  });

  test("return clarification from query", async () => {
    mockModelInvoke.mockReturnValue(mockResolvedClarifyData);
    const result = await resolveQueryTool.invoke("Hello");

    expect(result.candidates.length).toBeLessThanOrEqual(1);
    expect(result.needsMoreInfo).toEqual(true);
    expect(result.clarifyingQuestion.length).toBeGreaterThan(0);
    expect(result).toEqual(expect.schemaMatching(resolverResultSchema));
  });
});
