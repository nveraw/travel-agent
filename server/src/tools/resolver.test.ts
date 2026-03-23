import { beforeEach, describe, expect, test, vi } from "vitest";
import { resolverResultSchema } from "../schema/resolver.schema";
import { resolveQueryTool } from "./resolver.tool";

const mockModelInvoke = vi.fn();
vi.mock("../lib/model", () => ({
  getModel: vi.fn().mockReturnValue({
    invoke: vi.fn(() => mockModelInvoke()),
  }),
}));

describe("resolveQueryTool", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockModelInvoke.mockReturnValue({
      candidates: [
        {
          country: "France",
          city: "Paris",
          reason: "",
          bestMonths: [],
          highlights: [],
        },
      ],
      needsMoreInfo: false,
      clarifyingQuestion: "",
    });
  });

  test("resolver tool return country from query", async () => {
    const result = await resolveQueryTool.invoke("Trip to Paris");
    expect(result.candidates[0].country).toEqual("France");
  });

  test("resolver tool return country from vague query", async () => {
    const result = await resolveQueryTool.invoke("Summer Trip in Asia");
    expect(result.candidates[0].country.length).toBeGreaterThan(0);
    expect(result).toEqual(expect.schemaMatching(resolverResultSchema));
  });

  test("resolver tool return clarification from query", async () => {
    mockModelInvoke.mockReturnValue({
      candidates: [],
      needsMoreInfo: true,
      clarifyingQuestion: "What kind of trip are you thinking of?",
    });
    const result = await resolveQueryTool.invoke("Hello");
    expect(result.needsMoreInfo).toEqual(true);
    expect(result.clarifyingQuestion.length).toBeGreaterThan(0);
    expect(result).toEqual(expect.schemaMatching(resolverResultSchema));
  });
});
