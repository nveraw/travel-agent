import * as z from "zod";

export const contextSchema = z.object({
  userId: z.string().describe("Unique user ID"),
});
