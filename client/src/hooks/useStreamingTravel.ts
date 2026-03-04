import { useState, useRef, useCallback } from "react";

export interface TravelState {
  status: string;
  worldData: object | null;
  itinerary: string;
  isLoading: boolean;
  error: string | null;
}

export function useStreamingTravel() {
  const [state, setState] = useState<TravelState>({
    status: "",
    worldData: null,
    itinerary: "",
    isLoading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const submit = useCallback(async (message: string) => {
    // Abort any previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setState({ status: "", worldData: null, itinerary: "", isLoading: true, error: null });

    try {
      const response = await fetch("http://localhost:3001/api/travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: abortControllerRef.current.signal,
      });
    console.log('response', response);

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        console.log('done', done, 'value', value);

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const { type, data } = JSON.parse(line.slice(6));

            if (type === "status") {
              setState((prev) => ({ ...prev, status: data }));
            } else if (type === "chunk") {
              setState((prev) => ({ ...prev, itinerary: prev.itinerary + data }));
            } else if (type === "done") {
              setState((prev) => ({ ...prev, isLoading: false, status: "" }));
            } else if (type === "error") {
              setState((prev) => ({ ...prev, isLoading: false, error: data }));
            }
          } catch {
            // malformed SSE line, skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setState((prev) => ({ ...prev, isLoading: false, status: "Cancelled." }));
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : "Unknown error",
        }));
      }
    }
  }, []);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setState((prev) => ({ ...prev, isLoading: false, status: "Cancelled." }));
  }, []);

  return { state, submit, abort };
}