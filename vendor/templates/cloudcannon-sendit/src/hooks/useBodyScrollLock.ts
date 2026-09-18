import { useEffect } from "react";

/**
 * Custom hook to lock/unlock body scroll
 * @param isLocked - Whether the body scroll should be locked
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return (): void => {
      document.body.style.overflow = "";
    };
  }, [isLocked]);
}
