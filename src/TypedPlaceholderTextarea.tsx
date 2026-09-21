import { useEffect, useState, type TextareaHTMLAttributes } from "react";

// A textarea whose placeholder is typed out, as measured on Relume's intake composer:
// one character every 31ms, the finished line rests 1800ms, then the field clears at
// once and the next line starts. It writes the real placeholder attribute, so the
// browser styles and hides it. Only this component re-renders while it types.
const PER_CHARACTER = 31;
const REST = 1800;

export default function TypedPlaceholderTextarea({
  phrases,
  value,
  ...rest
}: { phrases: string[]; value: string } & Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "placeholder" | "value"
>) {
  // Starts on a finished line, as theirs does.
  const [at, setAt] = useState(0);
  const [shown, setShown] = useState(phrases[0].length);
  const still =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phrase = phrases[at];
  // Nothing is visible while there is text, so nothing needs typing.
  const paused = still || Boolean(value) || phrases.length < 2;

  useEffect(() => {
    if (paused) return;
    const finished = shown >= phrase.length;
    const timer = setTimeout(
      () => {
        if (!finished) return setShown(shown + 1);
        setAt((at + 1) % phrases.length);
        setShown(0);
      },
      finished ? REST : PER_CHARACTER,
    );
    return () => clearTimeout(timer);
  }, [at, shown, paused, phrase, phrases.length]);

  return (
    <textarea
      {...rest}
      value={value}
      placeholder={still ? phrases[0] : phrase.slice(0, shown) || " "}
    />
  );
}
