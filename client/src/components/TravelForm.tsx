import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { useAutoResizeTextarea } from "../hooks/useAutoResizeTextArea";

interface TravelFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  isLoading?: boolean;
  onSend: (input: string) => void;
  onStop: () => void;
}

function TravelForm({ isLoading, onSend, onStop, className }: TravelFormProps) {
  const [inputMsg, setInputMessage] = useState("");

  const textareaRef = useAutoResizeTextarea(inputMsg);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  const handleStop = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onStop();
  };

  return (
    <form
      className={`w-full max-w-159.5 mx-auto ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSend(inputMsg.trim());
        setInputMessage("");
      }}
    >
      <div className="flex w-full h-min">
        <textarea
          ref={textareaRef}
          className="mr-2 p-2 flex-1 rounded-md outline-2 outline-gray-200 resize-none overflow-hidden"
          value={inputMsg}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="'I want to go to Japan in spring' or 'suggest a winter destination'"
          rows={1}
          onKeyDown={handleKeyDown}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "0px";
            el.style.height = `${el.scrollHeight}px`;
          }}
        />
        {isLoading ? (
          <button
            className="h-10 w-10 mt-auto text-2xl p-0 flex items-center justify-center bg-gray-50"
            type="button"
            onClick={handleStop}
          >
            ⏹
          </button>
        ) : (
          <button
            className="h-10 w-10 mt-auto text-2xl p-0 flex items-center justify-center bg-gray-50"
            type="submit"
          >
            ➤
          </button>
        )}
      </div>
    </form>
  );
}

export default TravelForm;
