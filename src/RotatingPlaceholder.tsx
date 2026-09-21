import { useEffect, useState } from "react";

// Two stacked lines that trade places, as a placeholder the field does not own.
export default function RotatingPlaceholder({
  phrases,
  hidden,
  hold = 3300,
}: {
  phrases: string[];
  hidden: boolean;
  hold?: number;
}) {
  const [slots, setSlots] = useState({
    a: 0,
    b: 1 % phrases.length,
    front: "a",
  });
  useEffect(() => {
    if (hidden || phrases.length < 2) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setSlots((s) => {
        const showing = s.front === "a" ? s.a : s.b;
        const next = (showing + 1) % phrases.length;
        // The line at the back takes the next phrase, then comes forward.
        return s.front === "a"
          ? { ...s, b: next, front: "b" }
          : { ...s, a: next, front: "a" };
      });
    }, hold);
    return () => clearInterval(timer);
  }, [hidden, hold, phrases.length]);
  if (hidden) return null;
  return (
    <span className="rotating-placeholder" aria-hidden="true">
      <span className={slots.front === "a" ? "front" : "back"}>
        {phrases[slots.a]}
      </span>
      <span className={slots.front === "b" ? "front" : "back"}>
        {phrases[slots.b]}
      </span>
    </span>
  );
}
