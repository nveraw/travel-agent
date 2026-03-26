import { Request, Response, Router } from "express";
import { supabase } from "../lib/supabase.js";
import {
  HotelAmenity,
  SupabaseDataResult,
  TravelDataResult,
} from "../schema/retrieval.schema.js";

const router = Router();

router.get("/data", async (req: Request, res: Response) => {
  try {
    const { destination } = req.query;
    if (!destination) {
      res.status(400).json({ error: "destination is required" });
      return;
    }
    console.log("selecting data...", destination);

    const { data: rawData } = await supabase
      .from("destinations")
      .select(
        `
    destination:name,

    weather(
      month,
      condition,
      tempCelsius:temp_celsius,
      humidity
    ),

    popularSpots:spots(
      name,
      type,
      bestSeason:best_season,
      location:locations (
        name,
        latitude,
        longitude,
        city,
        country
      )
    ),

    popularFoods:foods(
      name,
      description,
      priceRange:price_range,
      bestPlaceToTry:restaurants (
        name,
        location:locations (
          name,
          latitude,
          longitude,
          city,
          country
        )
      )
    ),

    recommendedHotels:hotels(
      name,
      starRating:star_rating,
      pricePerNightUSD:price_per_night_usd,
      location:locations (
        name,
        latitude,
        longitude,
        city,
        country
      ),
      amenities:hotel_amenities (
        amenity
      )
    ),

    ongoingFestivals:festivals(
      name,
      month,
      durationDays:duration_days,
      description,
      type,
      location:locations (
        name,
        latitude,
        longitude,
        city,
        country
      )
    ),

    travelTips:travel_tips (
      tip
    )
  `,
      )
      .ilike("name", `%${destination.toString()}%`)
      .single();
    console.log("selecting data", JSON.stringify(rawData));

    if (!rawData) {
      res.status(404).json({ error: "Destination not found" });
      return;
    }
    const data = rawData as unknown as SupabaseDataResult;
    const result: TravelDataResult = {
      ...data,
      weatherByMonth: Object.fromEntries(
        data.weather.map((weather) => [
          weather.month,
          {
            condition: weather.condition,
            tempCelsius: weather.tempCelsius,
            humidity: weather.humidity,
          },
        ]),
      ),
      recommendedHotels: data.recommendedHotels.slice(0, 2).map((hotel) => ({
        name: hotel.name,
        starRating: hotel.starRating,
        location: hotel.location,
        pricePerNightUSD: hotel.pricePerNightUSD,
        amenities: hotel.amenities.map(
          (hotelAmenity) => hotelAmenity.amenity as HotelAmenity,
        ),
      })),
      travelTips: data.travelTips.map((t) => t.tip).slice(0, 2),
    };

    res.json(result);
  } catch (err) {
    console.error("GET /data error:", err);
    res.status(500).json({ error: "Failed to retrieve destination data" });
  }
});

const insertSelect = async (
  table: string,
  data: Record<string, unknown>,
): Promise<number> => {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();
  if (error) {
    console.error(error);
    throw new Error(JSON.stringify(error));
  }
  return result.id;
};

router.post("/data", async (req: Request, res: Response) => {
  try {
    const payload: TravelDataResult = req.body; // not { result: ... }

    const { error } = await supabase.from("queue").insert({ payload });

    if (error) {
      console.error("enqueue failed:", error.message);
      res.status(500).json({ error: "Failed to enqueue destination" });
      return;
    }

    res.status(202).json({ ok: true, queued: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to queue job" });
  }
});

export default router;
