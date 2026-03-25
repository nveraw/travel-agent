import { Request, Response, Router } from "express";
import { planTravel } from "../chains/travel.chain";

const router = Router();

router.post("/travel", async (req: Request, res: Response) => {
  const { message } = req.body;
  const threadId = (req.headers["x-session-id"] as string) || "default";

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
    await planTravel(
      message,
      threadId,
      (content) => {
        if (!controller.signal.aborted) sendEvent("chunk", content);
      },
      (status) => sendEvent("status", status),
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
