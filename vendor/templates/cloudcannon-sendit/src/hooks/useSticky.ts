import { useEffect, useState } from "react";

/**
 * Custom hook to handle sticky behavior based on scroll position
 * @param threshold - The scroll position threshold (default: 0)
 * @returns Whether the element should be sticky
 */
export function useSticky(threshold: number = 0): boolean {
  const [isSticky, setIsSticky] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = (): void => {
      setIsSticky(window.scrollY > threshold);
    };

    // Initialize sticky state on client side
    setIsSticky(window.scrollY > threshold);

    window.addEventListener("scroll", handleScroll);

    return (): void => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  return isSticky;
}
