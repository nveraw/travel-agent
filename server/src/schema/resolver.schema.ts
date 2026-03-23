import * as z from "zod";

export const resolverResultSchema = z.object({
  candidates: z
    .array(
      z.object({
        country: z.string().describe("Country name"),
        city: z.string().describe("Specific city if mentioned or inferred"),
        reason: z
          .string()
          .describe("Why this destination suits the user's intent"),
        bestMonths: z
          .array(
            z.enum([
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ]),
          )
          .describe("Best months to visit for this intent"),
        highlights: z
          .array(z.string())
          .describe("3-5 key highlights that match user intent"),
      }),
    )
    .min(0)
    .max(1) // preferably 4
    .describe("Top destination candidates based on user intent"),
  needsMoreInfo: z
    .boolean()
    .describe("True if user query is too vague to resolve candidates"),
  clarifyingQuestion: z
    .string()
    .describe(
      "If needsMoreInfo is true, ask a friendly clarifying question. If needsMoreInfo is false, set this to empty string.",
    ),
});
export const resolverParamSchema = z
  .string()
  .describe(
    "User's travel query, e.g. 'I want a warm beach vacation in December'",
  );
export type ResolverResult = z.infer<typeof resolverResultSchema>;
