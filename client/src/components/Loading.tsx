import type { Stage } from "../../../shared/stage.js";

const LOADING_MESSAGES = {
  ["start"]: "Resolving destination...",
  ["resolve"]: "Pulling local information...",
  ["search"]: "Generating itinerary...",
};

function Loading({ stage }: { stage?: Stage }) {
  if (!stage) {
    return null;
  }
  const loadingState = Object.keys(LOADING_MESSAGES);
  const currentIndex = stage === "generate" ? 2 : loadingState.indexOf(stage);

  if (currentIndex === -1) {
    return null;
  }

  return (
    <div
      className={`max-w-md mx-auto mt-3 h-[200px] overflow-y-hidden scroll-smooth flex flex-col gap-4 ${currentIndex === 0 ? "justify-start" : currentIndex === loadingState.length - 1 ? "justify-end" : "justify-center"}`}
    >
      {Object.entries(LOADING_MESSAGES)
        .slice(
          Math.max(0, currentIndex - 1),
          Math.min(currentIndex + 2, loadingState.length),
        )
        .map(([key, loadingMessage]) => {
          const isDone = loadingState.indexOf(key) < currentIndex;
          const isCurrentStage = key === stage;

          const containerStyle = [];
          if (isDone || isCurrentStage) {
            containerStyle.push("bg-white/40 border border-white/40 shadow-sm");
          }
          if (isCurrentStage) {
            containerStyle.push("opacity-100");
          } else {
            containerStyle.push("opacity-50");
            containerStyle.push("mx-[24px]");
          }

          return (
            <div
              key={key}
              className={`flex items-center gap-4 p-4 rounded-lg backdrop-blur-sm ${containerStyle.join(" ")}`}
            >
              <div className="flex shrink-0 items-center justify-center w-[30px] h-[30px] rounded-full shadow-sm">
                {isDone ? (
                  <span className="flex items-center justify-center w-full h-full rounded-full bg-[#336579] border-[7px] border-white/70 text-[10px] text-white">
                    ✓
                  </span>
                ) : isCurrentStage ? (
                  <span className="w-full h-full rounded-full bg-white/70 border-[9px] border-[#336579] animate-pulse" />
                ) : (
                  <span className="w-full h-full rounded-full border border-[#336579]" />
                )}
              </div>
              <span className="font-medium text-lg">{loadingMessage}</span>
            </div>
          );
        })}
    </div>
  );
}

export default Loading;
