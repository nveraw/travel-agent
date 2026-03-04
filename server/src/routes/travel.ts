import { Router, Request, Response } from "express";
import { generateFakeData } from "../chains/fakeData";
import { streamItinerary } from "../chains/itinerary";

const router = Router();

router.post("/travel", async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  // Set up SSE headers for streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const sendEvent = (type: string, data: string) => {
    res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
  };

  // Handle client disconnect (AbortController equivalent server-side)
  let aborted = false;
  req.on("close", () => { aborted = true; });

  try {
    // --- CHAIN 1: Generate world data ---
    sendEvent("status", "🌍 Gathering world data...");
    const worldData = await generateFakeData(message);

    sendEvent("status", "🧠 Building your itinerary...");

    // --- CHAIN 2: Stream the itinerary ---
    const abortSignal = { aborted } as AbortSignal;

    await streamItinerary(
      message,
      worldData,
      (chunk) => {
        if (!aborted) sendEvent("chunk", chunk);
      },
      abortSignal
    );

    sendEvent("done", "");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    sendEvent("error", message);
  } finally {
    res.end();
  }
});

export default router;