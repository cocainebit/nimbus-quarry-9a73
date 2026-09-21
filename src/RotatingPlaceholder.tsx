import { useEffect, useState } from "react";

// A placeholder the field does not own, written by a typewriter: a caret types the
// line, rests on the finished sentence, backspaces it away and types the next.
const TYPE = 42;
const ERASE = 16;
const REST = 1900;
const PAUSE = 380;

export default function RotatingPlaceholder({
  phrases,
  hidden,
}: {
  phrases: string[];
  hidden: boolean;
}) {
  const [at, setAt] = useState(0);
  const [shown, setShown] = useState(0);
  const [erasing, setErasing] = useState(false);
  const still =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phrase = phrases[at % phrases.length];
  const resting = !erasing && shown === phrase.length;

  useEffect(() => {
    if (hidden || still) return;
    let wait: number;
    if (erasing) wait = shown > 0 ? ERASE : PAUSE;
    else if (shown < phrase.length)
      // A person does not type evenly, and lingers a little after punctuation.
      wait =
        TYPE + Math.random() * 38 + (/[,.…]/.test(phrase[shown - 1]) ? 160 : 0);
    else wait = REST;
    const timer = setTimeout(() => {
      if (erasing) {
        if (shown > 0) return setShown(shown - 1);
        setErasing(false);
        return setAt((i) => (i + 1) % phrases.length);
      }
      if (shown < phrase.length) return setShown(shown + 1);
      if (phrases.length > 1) setErasing(true);
    }, wait);
    return () => clearTimeout(timer);
  }, [at, shown, erasing, hidden, still, phrase, phrases.length]);

  if (hidden) return null;
  return (
    <span className="rotating-placeholder" aria-hidden="true">
      {still ? phrases[0] : phrase.slice(0, shown)}
      {!still && <i className={resting ? "caret resting" : "caret"} />}
    </span>
  );
}
