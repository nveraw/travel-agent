import { useCallback, useRef, useState } from "react";
import "./App.css";
import TravelForm from "./components/TravelForm";
import TravelItinerary from "./components/TravelItinerary";

function App() {
  const [conversations, setConversations] = useState<Record<string, string>>(
    {},
  );
  const [loadingMsg, setLoadingMsg] = useState("");

  const sessionId = useRef(crypto.randomUUID());
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStop = () => {
    abortControllerRef.current?.abort();
    // console.log("stop");
    setLoadingMsg("");
  };

  const streamTravel = useCallback(async (message: string) => {
    abortControllerRef.current = new AbortController();

    // console.log("streamTravel", message);

    if (!message) return;
    let chat = "";
    setConversations((c) => ({ ...c, [message]: "" }));
    // console.log("calling api");

    setLoadingMsg(
      "Designing your next unforgettable trip…",
    );

    try {
      const response = await fetch("http://localhost:3001/api/travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId: sessionId.current }),
        signal: abortControllerRef.current.signal,
      });
      // console.log("response", response);
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        if (abortControllerRef.current?.signal.aborted) {
          // console.log("Loop stopped");
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

            if (type === "status") {
              setLoadingMsg(data);
            } else if (type === "chunk") {
              chat += data;
              setConversations((c) => ({ ...c, [message]: chat }));
            } else {
              setLoadingMsg("");
              if (type === "error") {
                console.error("api error: ", data);
              }
            }
          } catch {
            // malformed SSE line, skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // console.log("Cancelled");
        setLoadingMsg("");
      } else {
        // console.log(err instanceof Error ? err.message : "Unknown error");
        setLoadingMsg("");
      }
    } finally {
      setLoadingMsg("");
    }
  }, []);

  return (
    <main className="flex flex-col w-full h-full">
      <TravelItinerary conversations={conversations} loadingMsg={loadingMsg} />
      <TravelForm
        className={Object.keys(conversations).length ? "" : "flex-1"}
        isLoading={loadingMsg.length > 0}
        onSend={streamTravel}
        onStop={handleStop}
      />
    </main>
  );
}

export default App;
