import { useLayoutEffect, useRef, type RefObject } from "react";

export function useAutoResizeTextarea(
  value: string,
): RefObject<HTMLTextAreaElement | null> {
  const MAX_HEIGHT = 240;

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;

    // Reset height so shrinking works
    el.style.height = "0px";

    // Set to content height
    const newHeight = Math.min(el.scrollHeight, MAX_HEIGHT);
    el.style.height = `${newHeight}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  };

  // Handles programmatic value changes
  useLayoutEffect(() => {
    resize();
  }, [value]);

  return textareaRef;
}
