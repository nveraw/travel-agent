import { useState } from "react";
import "./App.css";
import { useStreamingTravel } from "./hooks/useStreamingTravel";

function App() {
  const [message, setMessage] = useState("");
  const { state, submit, abort } = useStreamingTravel();

  const handleSubmit = () => {
    console.log('handleSubmit', message)
    if (message.trim()) submit(message.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      if (!state.isLoading) handleSubmit();
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <textarea
          className="m-2 p-2 rounded-md outline-2 outline-gray-200 bg-grey-50"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Where do you want to travel? (e.g. 'I want to go to Japan in spring' or 'suggest a winter destination')"
          rows={3}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className=""
          onClick={() => (state.isLoading ? abort() : handleSubmit())}
        >
          {state.isLoading ? "Stop" : "Send"}
        </button>
      </form>
      {state.itinerary}
      {state.isLoading && <div className="loading" />}
    </>
  );
}

export default App;
