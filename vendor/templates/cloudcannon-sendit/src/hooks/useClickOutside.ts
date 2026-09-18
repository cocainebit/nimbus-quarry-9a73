import { useEffect, useRef } from "react";

/**
 * Custom hook to handle clicks outside a specific element
 * @param callback - Function to call when clicking outside the element
 * @param enabled - Whether the click outside detection is enabled (default: true)
 * @returns Ref to attach to the element you want to detect clicks outside of
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  callback: () => void,
  enabled: boolean = true,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    // Use mousedown instead of click for better UX
    // mousedown fires before blur/focus events
    document.addEventListener("mousedown", handleClickOutside);

    return (): void => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [callback, enabled]);

  return ref;
}
