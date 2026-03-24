import { HumanMessage, SystemMessage, tool } from "langchain";
import { getModel } from "../lib/model";
import {
  ResolverResult,
  resolverResultSchema,
} from "../schema/resolver.schema";
import { TravelDataResult, travelDataSchema } from "../schema/retrieval.schema";

export const searchTravelTool = tool(
  async (resolved: ResolverResult) => {
    try {
      console.log("searchTravel...", resolved);
      const response = await fetch("http://localhost:3001/internal/data", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: resolved.candidates[0].city,
        }),
      });
      if (response.ok) {
        const data: TravelDataResult = await response.json();
        console.log("searchTravel data", data);
        return data ? JSON.stringify(data) : "NO_DATA";
      }
      return "NO_DATA";
    } catch (e) {
      console.error(e);
      return "NO_DATA";
    }
  },
  {
    name: "search_travel",
    description: "Fetch real data from Supabase by destination.",
    schema: resolverResultSchema,
  },
);

const prompt = `You are a world travel knowledge database.

Generate realistic, geographically accurate travel data.
Food must match the destination cuisine.
Hotels should reflect real-world pricing for that country.
Weather must align with climate zones based on the bestMonth in given context.
Festivals should be culturally appropriate.
bestSeason for the Popular spots should also based on the bestMonth in given context.

Be creative but realistic.`;

export const generateDataTool = tool(
  async (resolved: ResolverResult) => {
    const agent = getModel(travelDataSchema, 0.7);
    console.log("generateTravelData...", resolved);
    const result: TravelDataResult = await agent.invoke([
      new SystemMessage(prompt),
      new HumanMessage(
        `infer the location and time: ${JSON.stringify(resolved)}`,
      ),
    ]);
    console.log("generateTravelData result", JSON.stringify(result));
    fetch("http://localhost:3001/internal/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });
    return JSON.stringify(result);
  },
  {
    name: "generate_fake_data",
    description: "AI-generate data when Supabase returns NO_DATA.",
    schema: resolverResultSchema,
  },
);
