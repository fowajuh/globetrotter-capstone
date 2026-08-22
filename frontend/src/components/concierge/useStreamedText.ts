import { useEffect, useRef, useState } from "react";

/**
 * Reveals `text` a few characters at a time. Word-chunked (not
 * character-by-character) so it reads as a considered response arriving,
 * not a typewriter gimmick — most of what makes streaming feel premium is
 * pacing, not raw speed.
 */
export function useStreamedText(text: string, active: boolean) {
  const [shown, setShown] = useState(active ? "" : text);
  const [done, setDone] = useState(!active);
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    if (!active) {
      setShown(text);
      setDone(true);
      return;
    }
    setShown("");
    setDone(false);
    const words = text.split(" ");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(words.slice(0, i).join(" "));
      if (i >= words.length) {
        clearInterval(id);
        setDone(true);
      }
    }, 28);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, active]);

  return { shown, done };
}
