import { Request, Response, Router } from "express";
import { supabase } from "../lib/supabase.js";
import { TravelDataResult } from "../schema/retrieval.schema.js";

const router = Router();

router.get("/data", async (req: Request, res: Response) => {
  try {
    const { destination } = req.query;
    if (!destination) {
      res.status(400).json({ error: "destination is required" });
      return;
    }
    console.log("selecting data...", destination);

    const { data } = await supabase
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
      .ilike("name", destination.toString())
      .single();
    console.log("selecting data", data);

    if (!data) {
      res.status(404).json({ error: "Destination not found" });
      return;
    }

    res.json({
      destination: data.destination,

      weatherByMonth: Object.fromEntries(
        data.weather.map((w) => [
          w.month,
          {
            condition: w.condition,
            tempCelsius: w.tempCelsius,
            humidity: w.humidity,
          },
        ]),
      ),

      popularSpots: data.popularSpots.slice(0, 3),

      popularFoods: data.popularFoods.slice(0, 3).map((food) => ({
        name: food.name,
        description: food.description,
        priceRange: food.priceRange,
        bestPlaceToTry: food.bestPlaceToTry.map((r) => ({
          name: r.name,
          location: r.location,
        }))[0],
      })),

      recommendedHotels: data.recommendedHotels.slice(0, 2).map((hotel) => ({
        name: hotel.name,
        starRating: hotel.starRating,
        location: hotel.location,
        pricePerNightUSD: hotel.pricePerNightUSD,
        amenities: hotel.amenities.map((a) => a.amenity),
      })),

      ongoingFestivals: data.ongoingFestivals.slice(0, 3),

      travelTips: data.travelTips.map((t) => t.tip).slice(0, 2),
    });
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
    const { data }: { data: TravelDataResult } = req.body;
    console.log("saveData...", data);

    const destinationId = await insertSelect("destinations", {
      name: data.destination,
    });

    for (const spot of data.popularSpots) {
      const locationId = await insertSelect("locations", spot.location);
      supabase.from("spots").insert({
        destination_id: destinationId,
        name: spot.name,
        location_id: locationId,
        type: spot.type,
        best_season: spot.bestSeason,
      });
    }

    for (const food of data.popularFoods) {
      const locationId = await insertSelect(
        "locations",
        food.bestPlaceToTry.location,
      );
      const restaurantId = await insertSelect("restaurants", {
        name: food.bestPlaceToTry.name,
        location_id: locationId,
      });
      supabase.from("foods").insert({
        destination_id: destinationId,
        name: food.name,
        description: food.description,
        price_range: food.priceRange,
        restaurant_id: restaurantId,
      });
    }

    for (const hotel of data.recommendedHotels) {
      const locationId = await insertSelect("locations", hotel.location);
      const hotelId = await insertSelect("hotels", {
        destination_id: destinationId,
        name: hotel.name,
        star_rating: hotel.starRating,
        location_id: locationId,
        price_per_night_usd: hotel.pricePerNightUSD,
      });
      for (const amenity of hotel.amenities) {
        supabase.from("hotel_amanities").insert({
          hotel_id: hotelId,
          amenity,
        });
      }
    }

    for (const festival of data.ongoingFestivals) {
      const locationId = await insertSelect("locations", festival.location);
      supabase.from("festivals").insert({
        destination_id: destinationId,
        name: festival.name,
        location_id: locationId,
        month: festival.month,
        duration_day: festival.durationDays,
        description: festival.description,
        type: festival.type,
      });
    }

    for (const [month, weather] of Object.entries(data.weatherByMonth)) {
      supabase.from("weather").insert({
        destination_id: destinationId,
        month,
        condition: weather.condition,
        temp_celcius: weather.tempCelsius,
        humidity: weather.humidity,
      });
    }

    for (const tip of data.travelTips) {
      supabase.from("travel_tips").insert({
        destination_id: destinationId,
        tip,
      });
    }
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("POST /data error:", err);
    res.status(500).json({ error: "Failed to save destination data" });
  }
});

export default router;
