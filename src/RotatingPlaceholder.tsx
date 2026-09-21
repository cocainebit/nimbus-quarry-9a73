import { useEffect, useState, type CSSProperties } from "react";

// A placeholder the field does not own: each line arrives a character at a time,
// rests as a whole sentence, fades, and the next one starts.
const PER_CHARACTER = 28;
const REST = 2400;
const FADE = 300;

export default function RotatingPlaceholder({
  phrases,
  hidden,
}: {
  phrases: string[];
  hidden: boolean;
}) {
  const [at, setAt] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const still =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phrase = phrases[at % phrases.length];

  useEffect(() => {
    if (hidden || still || phrases.length < 2) return;
    const typed = phrase.length * PER_CHARACTER;
    const leave = setTimeout(() => setLeaving(true), typed + REST);
    const next = setTimeout(
      () => {
        setLeaving(false);
        setAt((i) => (i + 1) % phrases.length);
      },
      typed + REST + FADE,
    );
    return () => {
      clearTimeout(leave);
      clearTimeout(next);
    };
  }, [at, hidden, still, phrase, phrases.length]);

  if (hidden) return null;
  if (still)
    return (
      <span className="rotating-placeholder" aria-hidden="true">
        {phrases[0]}
      </span>
    );
  return (
    <span
      key={at}
      className={`rotating-placeholder typing${leaving ? " leaving" : ""}`}
      aria-hidden="true"
    >
      {[...phrase].map((character, i) => (
        <span
          key={i}
          style={{ "--i": i } as CSSProperties}
          data-last={i === phrase.length - 1 ? "" : undefined}
        >
          {character}
        </span>
      ))}
    </span>
  );
}
