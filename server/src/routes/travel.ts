import { Router, Request, Response } from "express";
import { generateFakeData } from "../chains/fakeData.js";
import { streamItinerary } from "../chains/itinerary.js";
import { resolveQuery } from "../chains/resolver.js";

const router = Router();

router.post("/travel", async (req: Request, res: Response) => {
  const { message, sessionId } = req.body;

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

  const controller = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) {
      // console.log("client disconnect");
      controller.abort();
    }
  });

  try {
    // --- CHAIN 1: Generate world data ---
    sendEvent("status", "🧠 Resolving destination and timeline...");
    const resolved = await resolveQuery(sessionId, message);
    console.log("resolved", resolved);

    if (resolved.needsMoreInfo) {
      sendEvent("clarify", resolved.clarifyingQuestion ?? "Can you tell me more?");
      res.end();
      return;
    }

    sendEvent("status", "🌍 Gathering world data...");
    const worldData = await generateFakeData(sessionId, message, JSON.stringify(resolved.candidates));
    console.log("worldData", worldData);

    sendEvent("status", "📝 Building your itinerary...");

    // --- CHAIN 2: Stream the itinerary ---
    await streamItinerary(
      message,
      JSON.stringify(worldData),
      sessionId,
      (content) => {
        if (!controller.signal.aborted) sendEvent("chunk", content);
      },
      controller.signal,
    );

    sendEvent("done", "");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("error", err);
    sendEvent("error", message);
  } finally {
    // console.log("end");
    res.end();
  }
});

export default router;
