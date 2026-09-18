import { useEffect, useRef, useState } from "react";

/**
 * Custom hook to handle mobile menu functionality
 * @returns Object containing menu state and handlers
 */
export function useMobileMenu() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLElement>(null);

  const toggleMenu = (): void => {
    setIsOpen(!isOpen);
  };

  const closeMenu = (): void => {
    setIsOpen(false);
  };

  const openMenu = (): void => {
    setIsOpen(true);
  };

  // Handle click outside to close menu and body scroll prevention
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return (): void => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && isOpen) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return (): void => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);

  return {
    isOpen,
    toggleMenu,
    closeMenu,
    openMenu,
    menuRef,
  };
}
