// export const updatePreferences = tool(
//   async (
//     { prefs }: { prefs: string },
//     runtime: ToolRuntime<z.infer<typeof contextSchema>>,
//   ) => {
//     const userId = runtime.context.userId;
//     const existing =
//       (await runtime.store.get(["users", userId], "preferences"))?.value || {};
//     const updated = { ...existing, preferences: prefs }; // e.g., "beach, veg, $2000"
//     await runtime.store.put(["users", userId], "preferences", updated);
//     return `Saved prefs: ${prefs}. Will remember for future trips!`;
//   },
//   {
//     name: "update_preferences",
//     description:
//       "Save user prefs to long-term memory (budget, style, dietary).",
//     schema: z.object({ prefs: z.string() }),
//   },
// );
