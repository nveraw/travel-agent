import { useCallback, useRef, useState } from "react";
import type { Stage } from "../../shared/stage";
import "./App.css";
import Loading from "./components/Loading";
import TravelForm from "./components/TravelForm";
import TravelItinerary from "./components/TravelItinerary";

function App() {
  const [conversations, setConversations] = useState<Record<string, string>>(
    {},
  );
  const [loadingStage, setLoadingStage] = useState<Stage | null>(null);

  const sessionId = useRef(crypto.randomUUID());
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStop = () => {
    abortControllerRef.current?.abort();
    // console.log("stop");
    setLoadingStage(null);
  };

  const streamTravel = useCallback(async (message: string) => {
    abortControllerRef.current = new AbortController();

    // console.log("streamTravel", message);

    if (!message) return;
    let chat = "";
    setConversations((c) => ({ ...c, [message]: "" }));
    // console.log("calling api");

    setLoadingStage("start");

    try {
      const BASE_URL = import.meta.env.PROD
        ? "https://travel-agent-server-nveraw.vercel.app"
        : "http://localhost:3001";

      const response = await fetch(`${BASE_URL}/api/travel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId.current,
        },
        body: JSON.stringify({ message }),
        signal: abortControllerRef.current.signal,
      });
      // console.log("response", response);
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        if (abortControllerRef.current?.signal.aborted) {
          // console.log("Aborted");
          break;
        }

        // value: array of numbers
        const { done, value } = await reader.read();
        if (done) break;
        // console.log("done", done);

        // decode: data:{} \n data:{}
        const buffer = decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // console.log("lines", lines);

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            // remove data:, parse {}
            const { type, data } = JSON.parse(line.slice(6));
            // console.log("type", type, "data", data);

            switch (type) {
              case "status":
                setLoadingStage(data);
                break;
              case "chunk":
                chat += data;
                setConversations((c) => ({ ...c, [message]: chat }));
                break;
              case "error":
                console.error("api error: ", data);
                break;

              default:
                break;
            }
          } catch {
            // malformed SSE line, skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.log(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setLoadingStage(null);
    }
  }, []);

  return (
    <main className="flex flex-col w-full h-full p-8">
      <TravelItinerary conversations={conversations}>
        {!!loadingStage && (
          <Loading
            stage={loadingStage === "generate" ? "search" : loadingStage}
          />
        )}
      </TravelItinerary>
      <TravelForm
        className={Object.keys(conversations).length ? "" : "flex-1"}
        isLoading={!!loadingStage}
        onSend={streamTravel}
        onStop={handleStop}
      />
    </main>
  );
}

export default App;
