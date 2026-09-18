import { j as jsxRuntimeExports } from './jsx-runtime.DfqoFFQ2.js';
import { r as reactExports } from './index.BsgqzGof.js';

const logo = "/images/logo.svg";
const nav_items = [{"link":"/","text":"Home","dropdown":[]},{"link":"/features/","text":"Features","dropdown":[]},{"link":"/pricing/","text":"Pricing","dropdown":[]},{"link":"/about/","text":"About","dropdown":[]},{"link":"/blog/","text":"Blog","dropdown":[{"dropdown_text":"All Articles","dropdown_link":"/blog/"},{"dropdown_text":"Blog Showcase","dropdown_link":"/blog/blog-showcase/"},{"dropdown_text":"Marketing","dropdown_link":"/tags/marketing/"},{"dropdown_text":"Technology","dropdown_link":"/tags/technology/"}]},{"link":"/contact/","text":"Contact","dropdown":[]}];
const nav_btn = {"text":"Get Started","link":"/signup/"};
const navigation = {
  logo,
  nav_items,
  nav_btn,
};

function useBodyScrollLock(isLocked) {
  reactExports.useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLocked]);
}

function useClickOutside(callback, enabled = true) {
  const ref = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!enabled) return;
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [callback, enabled]);
  return ref;
}

function useKeyPress(key, callback, options = {}) {
  const {
    event = "keydown",
    target = typeof window !== "undefined" ? window : void 0,
    eventOptions
  } = options;
  reactExports.useEffect(() => {
    if (!target) return;
    const handleKeyEvent = (event2) => {
      if (event2.key === key) {
        callback(event2);
      }
    };
    const eventTarget = target;
    eventTarget.addEventListener(event, handleKeyEvent, eventOptions);
    return () => {
      eventTarget.removeEventListener(event, handleKeyEvent, eventOptions);
    };
  }, [key, callback, event, target, eventOptions]);
}

function useSticky(threshold = 0) {
  const [isSticky, setIsSticky] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > threshold);
    };
    setIsSticky(window.scrollY > threshold);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);
  return isSticky;
}

function Navigation({ pageUrl }) {
  const isSticky = useSticky();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = reactExports.useState(false);
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  const navbarRef = useClickOutside(closeMobileMenu, isMobileMenuOpen);
  useBodyScrollLock(isMobileMenuOpen);
  const [openDropdown, setOpenDropdown] = reactExports.useState(false);
  const dropdownButtonRefs = reactExports.useRef({});
  const dropdownMenuRefs = reactExports.useRef({});
  const getDropdownButtonRef = (index) => {
    if (!dropdownButtonRefs.current[index]) {
      dropdownButtonRefs.current[index] = { current: null };
    }
    return dropdownButtonRefs.current[index];
  };
  const getDropdownMenuRef = (index) => {
    if (!dropdownMenuRefs.current[index]) {
      dropdownMenuRefs.current[index] = { current: null };
    }
    return dropdownMenuRefs.current[index];
  };
  useKeyPress("Escape", (e) => {
    if (openDropdown !== false) {
      setOpenDropdown(false);
    }
    if (isMobileMenuOpen) {
      closeMobileMenu();
    }
  });
  const handleDropdownClick = (e, index) => {
    if (window.innerWidth >= 1024) return;
    e.preventDefault();
    setOpenDropdown(openDropdown === index ? null : index);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => {
          console.log("skip to content clicked");
          const mainContent = document.getElementById("main-content") || document.querySelector("main") || document.querySelector('[role="main"]') || document.querySelector(".main-content");
          if (mainContent) {
            mainContent.focus();
            mainContent.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        },
        onKeyDown: (e) => {
          console.log("skip to content clicked");
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const mainContent = document.getElementById("main-content") || document.querySelector("main") || document.querySelector('[role="main"]') || document.querySelector(".main-content");
            if (mainContent) {
              mainContent.focus();
              mainContent.scrollIntoView({
                behavior: "smooth",
                block: "start"
              });
            }
          }
        },
        className: "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-primary text-secondary px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center gap-2 shadow-lg",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "svg",
            {
              className: "w-4 h-4 shrink-0",
              fill: "none",
              stroke: "currentColor",
              viewBox: "0 0 24 24",
              xmlns: "http://www.w3.org/2000/svg",
              "aria-hidden": "true",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                  d: "M13 7l5 5m0 0l-5 5m5-5H6"
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Skip to main content" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs opacity-90 ml-2 px-2 py-1 bg-primary rounded border border-primary", children: "Hit Enter" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "header",
      {
        className: `fixed z-30 w-full transition-all duration-100 ${isSticky || isMobileMenuOpen ? " bg-white shadow-primary/10 shadow-xl" : ""}`,
        role: "banner",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "nav",
          {
            ref: navbarRef,
            className: `mx-auto max-w-[1500px] px-6 pt-8 pb-10 lg:flex lg:px-8 lg:pb-5`,
            role: "navigation",
            "aria-label": "Main navigation",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: " mx-auto flex items-center justify-between w-full", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "a",
                {
                  "data-astro-prefetch": true,
                  className: "flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md",
                  href: "/",
                  "aria-label": "Go to homepage",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "img",
                    {
                      "data-editable": "image",
                      "data-prop-src": "logo",
                      "data-prop-alt": "logo_alt",
                      src: navigation.logo,
                      alt: "Company logo",
                      className: "h-12 w-auto max-w-[155px]"
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  className: "p-2 lg:hidden flex items-center justify-center w-10 h-10 bg-transparent border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200",
                  type: "button",
                  "aria-controls": "mobile-navigation-menu",
                  "aria-expanded": isMobileMenuOpen,
                  "aria-label": isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu",
                  onClick: toggleMobileMenu,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `${isMobileMenuOpen ? "hidden" : "flex"} `, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "svg",
                      {
                        width: "30",
                        height: "30",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        xmlns: "http://www.w3.org/2000/svg",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "line",
                            {
                              x1: "3.5",
                              y1: "5.5",
                              x2: "21.5",
                              y2: "5.5",
                              stroke: "#292D32",
                              strokeWidth: "3",
                              strokeLinecap: "round",
                              strokeLinejoin: "round"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "line",
                            {
                              x1: "4.5",
                              y1: "12.5",
                              x2: "21.5",
                              y2: "12.5",
                              stroke: "#292D32",
                              strokeWidth: "3",
                              strokeLinecap: "round",
                              strokeLinejoin: "round"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "line",
                            {
                              x1: "11.5",
                              y1: "19.5",
                              x2: "21.5",
                              y2: "19.5",
                              stroke: "#292D32",
                              strokeWidth: "3",
                              strokeLinecap: "round",
                              strokeLinejoin: "round"
                            }
                          )
                        ]
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `${isMobileMenuOpen ? "flex" : "hidden"} `, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "svg",
                      {
                        width: "35",
                        height: "35",
                        viewBox: "0 0 28 28",
                        fill: "none",
                        xmlns: "http://www.w3.org/2000/svg",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "path",
                            {
                              d: "M21.5 6.5L6.5 21.5",
                              stroke: "#292D32",
                              strokeWidth: "3",
                              strokeLinecap: "round",
                              strokeLinejoin: "round"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "path",
                            {
                              d: "M21.5 21.5L6.5 6.5",
                              stroke: "#292D32",
                              strokeWidth: "3",
                              strokeLinecap: "round",
                              strokeLinejoin: "round"
                            }
                          )
                        ]
                      }
                    ) })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: `${isMobileMenuOpen ? "block" : "hidden"} duration-200 transition-all lg:flex grow items-center justify-center absolute lg:relative top-full lg:top-auto left-0 lg:left-auto w-full lg:w-auto bg-white lg:bg-transparent shadow-lg lg:shadow-none`,
                  id: "mobile-navigation-menu",
                  role: "region",
                  "aria-label": "Navigation menu",
                  "aria-hidden": !isMobileMenuOpen,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "ul",
                    {
                      className: "lg:flex grid items-center gap-0 lg:gap-1.5 list-none lg:p-0 m-0 mb-6 lg:mb-0",
                      role: "menubar",
                      "aria-label": "Main navigation links",
                      "data-editable": "array",
                      "data-prop": "nav_items",
                      children: [
                        navigation.nav_items.map(
                          (item, i) => {
                            return /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "li",
                              {
                                className: `relative w-full grid  ${item.dropdown?.length ? "group" : ""}`,
                                role: "none",
                                "data-editable": "array-item",
                                children: item.dropdown?.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                    "button",
                                    {
                                      ref: getDropdownButtonRef(i),
                                      id: `dropdown-button-${i}`,
                                      className: `block w-full text-left px-10 lg:px-5 py-3 text-2xl lg:text-xl font-normal lg:rounded-lg transition-colors duration-200 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset ${pageUrl?.pathname === item.link || item.dropdown?.some((dropdownItem) => pageUrl?.pathname === dropdownItem.dropdown_link) ? "text-primary" : "text-gray-700"} flex items-center lg:justify-start`,
                                      onClick: (e) => {
                                        handleDropdownClick(e, i);
                                        if (!item.dropdown || window.innerWidth >= 1024) {
                                          closeMobileMenu();
                                        }
                                      },
                                      onKeyDown: (e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          handleDropdownClick(e, i);
                                        } else if (e.key === "ArrowDown") {
                                          e.preventDefault();
                                          if (openDropdown !== i) {
                                            setOpenDropdown(i);
                                            setTimeout(() => {
                                              const menuRef = getDropdownMenuRef(i);
                                              const firstItem = menuRef.current?.querySelector(
                                                "a:first-child"
                                              );
                                              if (firstItem) firstItem.focus();
                                            }, 50);
                                          }
                                        }
                                      },
                                      role: "menuitem",
                                      "aria-haspopup": "true",
                                      "aria-expanded": openDropdown === i,
                                      "aria-controls": `dropdown-menu-${i}`,
                                      children: [
                                        /* @__PURE__ */ jsxRuntimeExports.jsx("editable-text", { "data-prop": "text", children: item.text }),
                                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                                          "svg",
                                          {
                                            className: `ml-2 w-4 h-4 transition-transform duration-200 ${openDropdown === i ? "rotate-180" : ""}`,
                                            fill: "none",
                                            stroke: "currentColor",
                                            viewBox: "0 0 24 24",
                                            xmlns: "http://www.w3.org/2000/svg",
                                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                              "path",
                                              {
                                                strokeLinecap: "round",
                                                strokeLinejoin: "round",
                                                strokeWidth: 2,
                                                d: "M19 9l-7 7-7-7"
                                              }
                                            )
                                          }
                                        )
                                      ]
                                    }
                                  ),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    "ul",
                                    {
                                      ref: getDropdownMenuRef(i),
                                      id: `dropdown-menu-${i}`,
                                      className: `lg:absolute lg:top-full lg:left-0 lg:min-w-[200px] w-full lg:bg-white lg:shadow-lg lg:rounded-lg lg:border lg:border-gray-200 transition-all duration-250 z-50 px-0 ${openDropdown === i ? "block lg:opacity-100 lg:visible lg:translate-y-0" : "hidden lg:block lg:opacity-0 lg:invisible lg:translate-y-1"} lg:group-hover:opacity-100 lg:group-hover:visible lg:group-hover:translate-y-0`,
                                      role: "menu",
                                      "aria-labelledby": `dropdown-button-${i}`,
                                      "aria-hidden": openDropdown !== i,
                                      children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-editable": "array", "data-prop": "dropdown", children: item.dropdown.map((dropdown_item, j) => {
                                        return /* @__PURE__ */ jsxRuntimeExports.jsx(
                                          "li",
                                          {
                                            className: "",
                                            role: "none",
                                            "data-editable": "array-item",
                                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                              "a",
                                              {
                                                "data-astro-prefetch": true,
                                                className: `block px-12 lg:px-5 py-2 text-xl font-normal lg:font-medium hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset transition-all duration-200 border-b border-gray-100 last:border-b-0 ${pageUrl?.pathname === dropdown_item.dropdown_link ? "text-primary" : "text-gray-700"}`,
                                                href: dropdown_item.dropdown_link,
                                                onClick: closeMobileMenu,
                                                onKeyDown: (e) => {
                                                  const menuRef = getDropdownMenuRef(i);
                                                  const menuItems = menuRef.current?.querySelectorAll("a");
                                                  const currentIndex = Array.from(
                                                    menuItems
                                                  ).indexOf(e.target);
                                                  if (e.key === "ArrowDown") {
                                                    e.preventDefault();
                                                    const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
                                                    menuItems[nextIndex]?.focus();
                                                  } else if (e.key === "ArrowUp") {
                                                    e.preventDefault();
                                                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
                                                    menuItems[prevIndex]?.focus();
                                                  } else if (e.key === "Escape") {
                                                    e.preventDefault();
                                                    setOpenDropdown(false);
                                                    getDropdownButtonRef(
                                                      i
                                                    ).current?.focus();
                                                  }
                                                },
                                                role: "menuitem",
                                                children: /* @__PURE__ */ jsxRuntimeExports.jsx("editable-text", { "data-prop": "dropdown_text", children: dropdown_item.dropdown_text })
                                              }
                                            )
                                          },
                                          j
                                        );
                                      }) })
                                    }
                                  )
                                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  "a",
                                  {
                                    "data-astro-prefetch": true,
                                    href: `${item.link}`,
                                    className: `block px-10 lg:px-5 py-3 text-2xl lg:text-xl font-normal lg:rounded-lg transition-colors duration-200 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset ${pageUrl?.pathname === item.link ? "text-primary" : "text-gray-700"}`,
                                    onClick: closeMobileMenu,
                                    role: "menuitem",
                                    children: /* @__PURE__ */ jsxRuntimeExports.jsx("editable-text", { "data-prop": "text", children: item.text })
                                  }
                                )
                              },
                              i
                            );
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { role: "none", children: isMobileMenuOpen ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center lg:hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "a",
                          {
                            "data-astro-prefetch": true,
                            href: `${navigation.nav_btn?.link}`,
                            className: "inline-flex mb-2 items-center px-6 py-3 text-base bg-secondary lg:rounded-2xl font-normal text-primary hover:bg-primary hover:text-secondary border border-primary rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                            onClick: closeMobileMenu,
                            role: "menuitem",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx("editable-text", { "data-prop": "nav_btn.text", children: navigation.nav_btn?.text })
                          }
                        ) }) : null })
                      ]
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden lg:block", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "a",
                {
                  "data-astro-prefetch": true,
                  href: `${navigation.nav_btn?.link}`,
                  className: "inline-flex items-center px-6 py-3 text-base font-normal text-primary bg-secondary hover:bg-primary hover:text-secondary  border border-primary rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("editable-text", { "data-prop": "nav_btn.text", children: navigation.nav_btn?.text })
                }
              ) }) 
            ] })
          }
        )
      }
    )
  ] });
}

export { Navigation as default };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF2aWdhdGlvbi5ENGJtdVItUC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2hvb2tzL3VzZUJvZHlTY3JvbGxMb2NrLnRzIiwiLi4vLi4vc3JjL2hvb2tzL3VzZUNsaWNrT3V0c2lkZS50cyIsIi4uLy4uL3NyYy9ob29rcy91c2VLZXlQcmVzcy50cyIsIi4uLy4uL3NyYy9ob29rcy91c2VTdGlja3kudHMiLCIuLi8uLi9zcmMvY29tcG9uZW50cy9sYXlvdXRzL25hdmlnYXRpb24uanN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZUVmZmVjdCB9IGZyb20gXCJyZWFjdFwiO1xuXG4vKipcbiAqIEN1c3RvbSBob29rIHRvIGxvY2svdW5sb2NrIGJvZHkgc2Nyb2xsXG4gKiBAcGFyYW0gaXNMb2NrZWQgLSBXaGV0aGVyIHRoZSBib2R5IHNjcm9sbCBzaG91bGQgYmUgbG9ja2VkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VCb2R5U2Nyb2xsTG9jayhpc0xvY2tlZDogYm9vbGVhbik6IHZvaWQge1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChpc0xvY2tlZCkge1xuICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9IFwiaGlkZGVuXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSBcIlwiO1xuICAgIH1cblxuICAgIHJldHVybiAoKTogdm9pZCA9PiB7XG4gICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLm92ZXJmbG93ID0gXCJcIjtcbiAgICB9O1xuICB9LCBbaXNMb2NrZWRdKTtcbn1cbiIsImltcG9ydCB7IHVzZUVmZmVjdCwgdXNlUmVmIH0gZnJvbSBcInJlYWN0XCI7XG5cbi8qKlxuICogQ3VzdG9tIGhvb2sgdG8gaGFuZGxlIGNsaWNrcyBvdXRzaWRlIGEgc3BlY2lmaWMgZWxlbWVudFxuICogQHBhcmFtIGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gY2FsbCB3aGVuIGNsaWNraW5nIG91dHNpZGUgdGhlIGVsZW1lbnRcbiAqIEBwYXJhbSBlbmFibGVkIC0gV2hldGhlciB0aGUgY2xpY2sgb3V0c2lkZSBkZXRlY3Rpb24gaXMgZW5hYmxlZCAoZGVmYXVsdDogdHJ1ZSlcbiAqIEByZXR1cm5zIFJlZiB0byBhdHRhY2ggdG8gdGhlIGVsZW1lbnQgeW91IHdhbnQgdG8gZGV0ZWN0IGNsaWNrcyBvdXRzaWRlIG9mXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VDbGlja091dHNpZGU8VCBleHRlbmRzIEhUTUxFbGVtZW50ID0gSFRNTEVsZW1lbnQ+KFxuICBjYWxsYmFjazogKCkgPT4gdm9pZCxcbiAgZW5hYmxlZDogYm9vbGVhbiA9IHRydWUsXG4pIHtcbiAgY29uc3QgcmVmID0gdXNlUmVmPFQ+KG51bGwpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFlbmFibGVkKSByZXR1cm47XG5cbiAgICBjb25zdCBoYW5kbGVDbGlja091dHNpZGUgPSAoZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lkID0+IHtcbiAgICAgIGlmIChyZWYuY3VycmVudCAmJiAhcmVmLmN1cnJlbnQuY29udGFpbnMoZXZlbnQudGFyZ2V0IGFzIE5vZGUpKSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIFVzZSBtb3VzZWRvd24gaW5zdGVhZCBvZiBjbGljayBmb3IgYmV0dGVyIFVYXG4gICAgLy8gbW91c2Vkb3duIGZpcmVzIGJlZm9yZSBibHVyL2ZvY3VzIGV2ZW50c1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgaGFuZGxlQ2xpY2tPdXRzaWRlKTtcblxuICAgIHJldHVybiAoKTogdm9pZCA9PiB7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIGhhbmRsZUNsaWNrT3V0c2lkZSk7XG4gICAgfTtcbiAgfSwgW2NhbGxiYWNrLCBlbmFibGVkXSk7XG5cbiAgcmV0dXJuIHJlZjtcbn1cbiIsImltcG9ydCB7IHVzZUVmZmVjdCB9IGZyb20gXCJyZWFjdFwiO1xuXG5pbnRlcmZhY2UgVXNlS2V5UHJlc3NPcHRpb25zIHtcbiAgZXZlbnQ/OiBcImtleWRvd25cIiB8IFwia2V5dXBcIiB8IFwia2V5cHJlc3NcIjtcbiAgdGFyZ2V0PzogRWxlbWVudCB8IFdpbmRvdyB8IERvY3VtZW50O1xuICBldmVudE9wdGlvbnM/OiBBZGRFdmVudExpc3RlbmVyT3B0aW9ucztcbn1cblxuLyoqXG4gKiBDdXN0b20gaG9vayB0byBoYW5kbGUgaW5kaXZpZHVhbCBrZXkgcHJlc3MgZXZlbnRzXG4gKiBAcGFyYW0ga2V5IC0gVGhlIGtleSB0byBsaXN0ZW4gZm9yIChlLmcuLCBcIkVzY2FwZVwiLCBcIkVudGVyXCIsIFwiQXJyb3dVcFwiKVxuICogQHBhcmFtIGNhbGxiYWNrIC0gVGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiB0aGUga2V5IGlzIHByZXNzZWRcbiAqIEBwYXJhbSBvcHRpb25zIC0gQWRkaXRpb25hbCBvcHRpb25zIGZvciB0aGUga2V5IHByZXNzIGV2ZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VLZXlQcmVzcyhcbiAga2V5OiBzdHJpbmcsXG4gIGNhbGxiYWNrOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHZvaWQsXG4gIG9wdGlvbnM6IFVzZUtleVByZXNzT3B0aW9ucyA9IHt9XG4pOiB2b2lkIHtcbiAgY29uc3Qge1xuICAgIGV2ZW50ID0gXCJrZXlkb3duXCIsXG4gICAgdGFyZ2V0ID0gdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHVuZGVmaW5lZCxcbiAgICBldmVudE9wdGlvbnMsXG4gIH0gPSBvcHRpb25zO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCF0YXJnZXQpIHJldHVybjtcblxuICAgIGNvbnN0IGhhbmRsZUtleUV2ZW50ID0gKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCA9PiB7XG4gICAgICBpZiAoZXZlbnQua2V5ID09PSBrZXkpIHtcbiAgICAgICAgY2FsbGJhY2soZXZlbnQpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBldmVudFRhcmdldCA9IHRhcmdldCBhcyBFdmVudFRhcmdldDtcbiAgICBldmVudFRhcmdldC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVLZXlFdmVudCBhcyBFdmVudExpc3RlbmVyLCBldmVudE9wdGlvbnMpO1xuXG4gICAgcmV0dXJuICgpOiB2b2lkID0+IHtcbiAgICAgIGV2ZW50VGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZUtleUV2ZW50IGFzIEV2ZW50TGlzdGVuZXIsIGV2ZW50T3B0aW9ucyk7XG4gICAgfTtcbiAgfSwgW2tleSwgY2FsbGJhY2ssIGV2ZW50LCB0YXJnZXQsIGV2ZW50T3B0aW9uc10pO1xufVxuIiwiaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gXCJyZWFjdFwiO1xuXG4vKipcbiAqIEN1c3RvbSBob29rIHRvIGhhbmRsZSBzdGlja3kgYmVoYXZpb3IgYmFzZWQgb24gc2Nyb2xsIHBvc2l0aW9uXG4gKiBAcGFyYW0gdGhyZXNob2xkIC0gVGhlIHNjcm9sbCBwb3NpdGlvbiB0aHJlc2hvbGQgKGRlZmF1bHQ6IDApXG4gKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBlbGVtZW50IHNob3VsZCBiZSBzdGlja3lcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZVN0aWNreSh0aHJlc2hvbGQ6IG51bWJlciA9IDApOiBib29sZWFuIHtcbiAgY29uc3QgW2lzU3RpY2t5LCBzZXRJc1N0aWNreV0gPSB1c2VTdGF0ZTxib29sZWFuPihmYWxzZSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBoYW5kbGVTY3JvbGwgPSAoKTogdm9pZCA9PiB7XG4gICAgICBzZXRJc1N0aWNreSh3aW5kb3cuc2Nyb2xsWSA+IHRocmVzaG9sZCk7XG4gICAgfTtcblxuICAgIC8vIEluaXRpYWxpemUgc3RpY2t5IHN0YXRlIG9uIGNsaWVudCBzaWRlXG4gICAgc2V0SXNTdGlja3kod2luZG93LnNjcm9sbFkgPiB0aHJlc2hvbGQpO1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIiwgaGFuZGxlU2Nyb2xsKTtcblxuICAgIHJldHVybiAoKTogdm9pZCA9PiB7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInNjcm9sbFwiLCBoYW5kbGVTY3JvbGwpO1xuICAgIH07XG4gIH0sIFt0aHJlc2hvbGRdKTtcblxuICByZXR1cm4gaXNTdGlja3k7XG59XG4iLCJpbXBvcnQgbmF2aWdhdGlvbiBmcm9tIFwiQGRhdGEvbmF2aWdhdGlvbi5qc29uXCI7XG5pbXBvcnQgeyB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyB1c2VCb2R5U2Nyb2xsTG9jayB9IGZyb20gXCIuLi8uLi9ob29rcy91c2VCb2R5U2Nyb2xsTG9ja1wiO1xuaW1wb3J0IHsgdXNlQ2xpY2tPdXRzaWRlIH0gZnJvbSBcIi4uLy4uL2hvb2tzL3VzZUNsaWNrT3V0c2lkZVwiO1xuaW1wb3J0IHsgdXNlS2V5UHJlc3MgfSBmcm9tIFwiLi4vLi4vaG9va3MvdXNlS2V5UHJlc3NcIjtcbmltcG9ydCB7IHVzZVN0aWNreSB9IGZyb20gXCIuLi8uLi9ob29rcy91c2VTdGlja3lcIjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gTmF2aWdhdGlvbih7IHBhZ2VVcmwgfSkge1xuICBjb25zdCBpc1N0aWNreSA9IHVzZVN0aWNreSgpO1xuICBjb25zdCBbaXNNb2JpbGVNZW51T3Blbiwgc2V0SXNNb2JpbGVNZW51T3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgY29uc3QgdG9nZ2xlTW9iaWxlTWVudSA9ICgpID0+IHtcbiAgICBzZXRJc01vYmlsZU1lbnVPcGVuKCFpc01vYmlsZU1lbnVPcGVuKTtcbiAgfTtcblxuICBjb25zdCBjbG9zZU1vYmlsZU1lbnUgPSAoKSA9PiB7XG4gICAgc2V0SXNNb2JpbGVNZW51T3BlbihmYWxzZSk7XG4gIH07XG5cbiAgLy8gVXNlIGNsaWNrIG91dHNpZGUgaG9vayB0byBjbG9zZSBtb2JpbGUgbWVudVxuICBjb25zdCBuYXZiYXJSZWYgPSB1c2VDbGlja091dHNpZGUoY2xvc2VNb2JpbGVNZW51LCBpc01vYmlsZU1lbnVPcGVuKTtcblxuICAvLyBMb2NrIGJvZHkgc2Nyb2xsIHdoZW4gbW9iaWxlIG1lbnUgaXMgb3BlblxuICB1c2VCb2R5U2Nyb2xsTG9jayhpc01vYmlsZU1lbnVPcGVuKTtcblxuICBjb25zdCBbb3BlbkRyb3Bkb3duLCBzZXRPcGVuRHJvcGRvd25dID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIC8vIENyZWF0ZSByZWZzIGZvciBkcm9wZG93biBidXR0b25zIGFuZCBtZW51c1xuICBjb25zdCBkcm9wZG93bkJ1dHRvblJlZnMgPSB1c2VSZWYoe30pO1xuICBjb25zdCBkcm9wZG93bk1lbnVSZWZzID0gdXNlUmVmKHt9KTtcblxuICAvLyBIZWxwZXIgZnVuY3Rpb25zIHRvIGdldCByZWZzIChubyBob29rcyBpbnNpZGUpXG4gIGNvbnN0IGdldERyb3Bkb3duQnV0dG9uUmVmID0gKGluZGV4KSA9PiB7XG4gICAgaWYgKCFkcm9wZG93bkJ1dHRvblJlZnMuY3VycmVudFtpbmRleF0pIHtcbiAgICAgIGRyb3Bkb3duQnV0dG9uUmVmcy5jdXJyZW50W2luZGV4XSA9IHsgY3VycmVudDogbnVsbCB9O1xuICAgIH1cbiAgICByZXR1cm4gZHJvcGRvd25CdXR0b25SZWZzLmN1cnJlbnRbaW5kZXhdO1xuICB9O1xuXG4gIGNvbnN0IGdldERyb3Bkb3duTWVudVJlZiA9IChpbmRleCkgPT4ge1xuICAgIGlmICghZHJvcGRvd25NZW51UmVmcy5jdXJyZW50W2luZGV4XSkge1xuICAgICAgZHJvcGRvd25NZW51UmVmcy5jdXJyZW50W2luZGV4XSA9IHsgY3VycmVudDogbnVsbCB9O1xuICAgIH1cbiAgICByZXR1cm4gZHJvcGRvd25NZW51UmVmcy5jdXJyZW50W2luZGV4XTtcbiAgfTtcblxuICAvLyBIYW5kbGUgRXNjYXBlIGtleSB0byBjbG9zZSBtZW51cyBhbmQgZHJvcGRvd25zXG4gIHVzZUtleVByZXNzKFwiRXNjYXBlXCIsIChlKSA9PiB7XG4gICAgaWYgKG9wZW5Ecm9wZG93biAhPT0gZmFsc2UpIHtcbiAgICAgIHNldE9wZW5Ecm9wZG93bihmYWxzZSk7XG4gICAgfVxuICAgIGlmIChpc01vYmlsZU1lbnVPcGVuKSB7XG4gICAgICBjbG9zZU1vYmlsZU1lbnUoKTtcbiAgICB9XG4gIH0pO1xuXG4gIGNvbnN0IGhhbmRsZURyb3Bkb3duQ2xpY2sgPSAoZSwgaW5kZXgpID0+IHtcbiAgICBpZiAod2luZG93LmlubmVyV2lkdGggPj0gMTAyNCkgcmV0dXJuOyAvLyBsZyBicmVha3BvaW50XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgc2V0T3BlbkRyb3Bkb3duKG9wZW5Ecm9wZG93biA9PT0gaW5kZXggPyBudWxsIDogaW5kZXgpO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIHsvKiBTa2lwIHRvIGNvbnRlbnQgbGluayBmb3IgYWNjZXNzaWJpbGl0eSAqL31cbiAgICAgIDxidXR0b25cbiAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwic2tpcCB0byBjb250ZW50IGNsaWNrZWRcIik7XG4gICAgICAgICAgY29uc3QgbWFpbkNvbnRlbnQgPVxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYWluLWNvbnRlbnRcIikgfHxcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJtYWluXCIpIHx8XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbcm9sZT1cIm1haW5cIl0nKSB8fFxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5tYWluLWNvbnRlbnRcIik7XG4gICAgICAgICAgaWYgKG1haW5Db250ZW50KSB7XG4gICAgICAgICAgICBtYWluQ29udGVudC5mb2N1cygpO1xuICAgICAgICAgICAgbWFpbkNvbnRlbnQuc2Nyb2xsSW50b1ZpZXcoeyBiZWhhdmlvcjogXCJzbW9vdGhcIiwgYmxvY2s6IFwic3RhcnRcIiB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH19XG4gICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInNraXAgdG8gY29udGVudCBjbGlja2VkXCIpO1xuICAgICAgICAgIGlmIChlLmtleSA9PT0gXCJFbnRlclwiIHx8IGUua2V5ID09PSBcIiBcIikge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgY29uc3QgbWFpbkNvbnRlbnQgPVxuICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1haW4tY29udGVudFwiKSB8fFxuICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwibWFpblwiKSB8fFxuICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbcm9sZT1cIm1haW5cIl0nKSB8fFxuICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLm1haW4tY29udGVudFwiKTtcbiAgICAgICAgICAgIGlmIChtYWluQ29udGVudCkge1xuICAgICAgICAgICAgICBtYWluQ29udGVudC5mb2N1cygpO1xuICAgICAgICAgICAgICBtYWluQ29udGVudC5zY3JvbGxJbnRvVmlldyh7XG4gICAgICAgICAgICAgICAgYmVoYXZpb3I6IFwic21vb3RoXCIsXG4gICAgICAgICAgICAgICAgYmxvY2s6IFwic3RhcnRcIixcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9fVxuICAgICAgICBjbGFzc05hbWU9XCJzci1vbmx5IGZvY3VzOm5vdC1zci1vbmx5IGZvY3VzOmFic29sdXRlIGZvY3VzOnRvcC00IGZvY3VzOmxlZnQtNCBmb2N1czp6LTUwIGJnLXByaW1hcnkgdGV4dC1zZWNvbmRhcnkgcHgtNCBweS0zIHJvdW5kZWQtbWQgdGV4dC1zbSBmb250LW1lZGl1bSB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0yMDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLXByaW1hcnkgZm9jdXM6cmluZy1vZmZzZXQtMiBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBzaGFkb3ctbGdcIlxuICAgICAgPlxuICAgICAgICA8c3ZnXG4gICAgICAgICAgY2xhc3NOYW1lPVwidy00IGgtNCBzaHJpbmstMFwiXG4gICAgICAgICAgZmlsbD1cIm5vbmVcIlxuICAgICAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICAgICAgdmlld0JveD1cIjAgMCAyNCAyNFwiXG4gICAgICAgICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgICAgICAgYXJpYS1oaWRkZW49XCJ0cnVlXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxwYXRoXG4gICAgICAgICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgICAgICAgICBzdHJva2VXaWR0aD17Mn1cbiAgICAgICAgICAgIGQ9XCJNMTMgN2w1IDVtMCAwbC01IDVtNS01SDZcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvc3ZnPlxuICAgICAgICA8c3Bhbj5Ta2lwIHRvIG1haW4gY29udGVudDwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBvcGFjaXR5LTkwIG1sLTIgcHgtMiBweS0xIGJnLXByaW1hcnkgcm91bmRlZCBib3JkZXIgYm9yZGVyLXByaW1hcnlcIj5cbiAgICAgICAgICBIaXQgRW50ZXJcbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9idXR0b24+XG5cbiAgICAgIDxoZWFkZXJcbiAgICAgICAgY2xhc3NOYW1lPXtgZml4ZWQgei0zMCB3LWZ1bGwgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMTAwICR7aXNTdGlja3kgfHwgaXNNb2JpbGVNZW51T3BlbiA/IFwiIGJnLXdoaXRlIHNoYWRvdy1wcmltYXJ5LzEwIHNoYWRvdy14bFwiIDogXCJcIn1gfVxuICAgICAgICByb2xlPVwiYmFubmVyXCJcbiAgICAgID5cbiAgICAgICAgPG5hdlxuICAgICAgICAgIHJlZj17bmF2YmFyUmVmfVxuICAgICAgICAgIGNsYXNzTmFtZT17YG14LWF1dG8gbWF4LXctWzE1MDBweF0gcHgtNiBwdC04IHBiLTEwIGxnOmZsZXggbGc6cHgtOCBsZzpwYi01YH1cbiAgICAgICAgICByb2xlPVwibmF2aWdhdGlvblwiXG4gICAgICAgICAgYXJpYS1sYWJlbD1cIk1haW4gbmF2aWdhdGlvblwiXG4gICAgICAgID5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIiBteC1hdXRvIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiB3LWZ1bGxcIj5cbiAgICAgICAgICAgIDxhXG4gICAgICAgICAgICAgIGRhdGEtYXN0cm8tcHJlZmV0Y2hcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLXByaW1hcnkgZm9jdXM6cmluZy1vZmZzZXQtMiByb3VuZGVkLW1kXCJcbiAgICAgICAgICAgICAgaHJlZj1cIi9cIlxuICAgICAgICAgICAgICBhcmlhLWxhYmVsPVwiR28gdG8gaG9tZXBhZ2VcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8aW1nXG4gICAgICAgICAgICAgICAgZGF0YS1lZGl0YWJsZT1cImltYWdlXCJcbiAgICAgICAgICAgICAgICBkYXRhLXByb3Atc3JjPVwibG9nb1wiXG4gICAgICAgICAgICAgICAgZGF0YS1wcm9wLWFsdD1cImxvZ29fYWx0XCJcbiAgICAgICAgICAgICAgICBzcmM9e25hdmlnYXRpb24ubG9nb31cbiAgICAgICAgICAgICAgICBhbHQ9XCJDb21wYW55IGxvZ29cIlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImgtMTIgdy1hdXRvIG1heC13LVsxNTVweF1cIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9hPlxuXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMiBsZzpoaWRkZW4gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdy0xMCBoLTEwIGJnLXRyYW5zcGFyZW50IGJvcmRlci0wIHJvdW5kZWQtbWQgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLXByaW1hcnkgZm9jdXM6cmluZy1vZmZzZXQtMiB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0yMDBcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgYXJpYS1jb250cm9scz1cIm1vYmlsZS1uYXZpZ2F0aW9uLW1lbnVcIlxuICAgICAgICAgICAgICBhcmlhLWV4cGFuZGVkPXtpc01vYmlsZU1lbnVPcGVufVxuICAgICAgICAgICAgICBhcmlhLWxhYmVsPXtcbiAgICAgICAgICAgICAgICBpc01vYmlsZU1lbnVPcGVuXG4gICAgICAgICAgICAgICAgICA/IFwiQ2xvc2UgbmF2aWdhdGlvbiBtZW51XCJcbiAgICAgICAgICAgICAgICAgIDogXCJPcGVuIG5hdmlnYXRpb24gbWVudVwiXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgb25DbGljaz17dG9nZ2xlTW9iaWxlTWVudX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgJHtpc01vYmlsZU1lbnVPcGVuID8gXCJoaWRkZW5cIiA6IFwiZmxleFwifSBgfT5cbiAgICAgICAgICAgICAgICA8c3ZnXG4gICAgICAgICAgICAgICAgICB3aWR0aD1cIjMwXCJcbiAgICAgICAgICAgICAgICAgIGhlaWdodD1cIjMwXCJcbiAgICAgICAgICAgICAgICAgIHZpZXdCb3g9XCIwIDAgMjQgMjRcIlxuICAgICAgICAgICAgICAgICAgZmlsbD1cIm5vbmVcIlxuICAgICAgICAgICAgICAgICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPGxpbmVcbiAgICAgICAgICAgICAgICAgICAgeDE9XCIzLjVcIlxuICAgICAgICAgICAgICAgICAgICB5MT1cIjUuNVwiXG4gICAgICAgICAgICAgICAgICAgIHgyPVwiMjEuNVwiXG4gICAgICAgICAgICAgICAgICAgIHkyPVwiNS41XCJcbiAgICAgICAgICAgICAgICAgICAgc3Ryb2tlPVwiIzI5MkQzMlwiXG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZVdpZHRoPVwiM1wiXG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDxsaW5lXG4gICAgICAgICAgICAgICAgICAgIHgxPVwiNC41XCJcbiAgICAgICAgICAgICAgICAgICAgeTE9XCIxMi41XCJcbiAgICAgICAgICAgICAgICAgICAgeDI9XCIyMS41XCJcbiAgICAgICAgICAgICAgICAgICAgeTI9XCIxMi41XCJcbiAgICAgICAgICAgICAgICAgICAgc3Ryb2tlPVwiIzI5MkQzMlwiXG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZVdpZHRoPVwiM1wiXG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDxsaW5lXG4gICAgICAgICAgICAgICAgICAgIHgxPVwiMTEuNVwiXG4gICAgICAgICAgICAgICAgICAgIHkxPVwiMTkuNVwiXG4gICAgICAgICAgICAgICAgICAgIHgyPVwiMjEuNVwiXG4gICAgICAgICAgICAgICAgICAgIHkyPVwiMTkuNVwiXG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZT1cIiMyOTJEMzJcIlxuICAgICAgICAgICAgICAgICAgICBzdHJva2VXaWR0aD1cIjNcIlxuICAgICAgICAgICAgICAgICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgICAgICAgICAgICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgJHtpc01vYmlsZU1lbnVPcGVuID8gXCJmbGV4XCIgOiBcImhpZGRlblwifSBgfT5cbiAgICAgICAgICAgICAgICA8c3ZnXG4gICAgICAgICAgICAgICAgICB3aWR0aD1cIjM1XCJcbiAgICAgICAgICAgICAgICAgIGhlaWdodD1cIjM1XCJcbiAgICAgICAgICAgICAgICAgIHZpZXdCb3g9XCIwIDAgMjggMjhcIlxuICAgICAgICAgICAgICAgICAgZmlsbD1cIm5vbmVcIlxuICAgICAgICAgICAgICAgICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPHBhdGhcbiAgICAgICAgICAgICAgICAgICAgZD1cIk0yMS41IDYuNUw2LjUgMjEuNVwiXG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZT1cIiMyOTJEMzJcIlxuICAgICAgICAgICAgICAgICAgICBzdHJva2VXaWR0aD1cIjNcIlxuICAgICAgICAgICAgICAgICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgICAgICAgICAgICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8cGF0aFxuICAgICAgICAgICAgICAgICAgICBkPVwiTTIxLjUgMjEuNUw2LjUgNi41XCJcbiAgICAgICAgICAgICAgICAgICAgc3Ryb2tlPVwiIzI5MkQzMlwiXG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZVdpZHRoPVwiM1wiXG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YCR7aXNNb2JpbGVNZW51T3BlbiA/IFwiYmxvY2tcIiA6IFwiaGlkZGVuXCJ9IGR1cmF0aW9uLTIwMCB0cmFuc2l0aW9uLWFsbCBsZzpmbGV4IGdyb3cgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGFic29sdXRlIGxnOnJlbGF0aXZlIHRvcC1mdWxsIGxnOnRvcC1hdXRvIGxlZnQtMCBsZzpsZWZ0LWF1dG8gdy1mdWxsIGxnOnctYXV0byBiZy13aGl0ZSBsZzpiZy10cmFuc3BhcmVudCBzaGFkb3ctbGcgbGc6c2hhZG93LW5vbmVgfVxuICAgICAgICAgICAgICBpZD1cIm1vYmlsZS1uYXZpZ2F0aW9uLW1lbnVcIlxuICAgICAgICAgICAgICByb2xlPVwicmVnaW9uXCJcbiAgICAgICAgICAgICAgYXJpYS1sYWJlbD1cIk5hdmlnYXRpb24gbWVudVwiXG4gICAgICAgICAgICAgIGFyaWEtaGlkZGVuPXshaXNNb2JpbGVNZW51T3Blbn1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPHVsXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibGc6ZmxleCBncmlkIGl0ZW1zLWNlbnRlciBnYXAtMCBsZzpnYXAtMS41IGxpc3Qtbm9uZSBsZzpwLTAgbS0wIG1iLTYgbGc6bWItMFwiXG4gICAgICAgICAgICAgICAgcm9sZT1cIm1lbnViYXJcIlxuICAgICAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJNYWluIG5hdmlnYXRpb24gbGlua3NcIlxuICAgICAgICAgICAgICAgIGRhdGEtZWRpdGFibGU9XCJhcnJheVwiXG4gICAgICAgICAgICAgICAgZGF0YS1wcm9wPVwibmF2X2l0ZW1zXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHtuYXZpZ2F0aW9uLm5hdl9pdGVtcy5tYXAoKGl0ZW0sIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxsaVxuICAgICAgICAgICAgICAgICAgICAgIGtleT17aX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2ByZWxhdGl2ZSB3LWZ1bGwgZ3JpZCAgJHtpdGVtLmRyb3Bkb3duPy5sZW5ndGggPyBcImdyb3VwXCIgOiBcIlwifWB9XG4gICAgICAgICAgICAgICAgICAgICAgcm9sZT1cIm5vbmVcIlxuICAgICAgICAgICAgICAgICAgICAgIGRhdGEtZWRpdGFibGU9XCJhcnJheS1pdGVtXCJcbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uZHJvcGRvd24/Lmxlbmd0aCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWY9e2dldERyb3Bkb3duQnV0dG9uUmVmKGkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9e2Bkcm9wZG93bi1idXR0b24tJHtpfWB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BibG9jayB3LWZ1bGwgdGV4dC1sZWZ0IHB4LTEwIGxnOnB4LTUgcHktMyB0ZXh0LTJ4bCBsZzp0ZXh0LXhsIGZvbnQtbm9ybWFsIGxnOnJvdW5kZWQtbGcgdHJhbnNpdGlvbi1jb2xvcnMgZHVyYXRpb24tMjAwIGhvdmVyOmJnLXByaW1hcnkvMTAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLXByaW1hcnkgZm9jdXM6cmluZy1pbnNldCAke3BhZ2VVcmw/LnBhdGhuYW1lID09PSBpdGVtLmxpbmsgfHwgaXRlbS5kcm9wZG93bj8uc29tZSgoZHJvcGRvd25JdGVtKSA9PiBwYWdlVXJsPy5wYXRobmFtZSA9PT0gZHJvcGRvd25JdGVtLmRyb3Bkb3duX2xpbmspID8gXCJ0ZXh0LXByaW1hcnlcIiA6IFwidGV4dC1ncmF5LTcwMFwifSBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LXN0YXJ0YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZURyb3Bkb3duQ2xpY2soZSwgaSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENsb3NlIG1vYmlsZSBtZW51IGlmIGl0J3MgYSByZWd1bGFyIGxpbmsgKG5vdCBkcm9wZG93bilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpdGVtLmRyb3Bkb3duIHx8IHdpbmRvdy5pbm5lcldpZHRoID49IDEwMjQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9zZU1vYmlsZU1lbnUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSGFuZGxlIGtleWJvYXJkIG5hdmlnYXRpb24gZm9yIGRyb3Bkb3duXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gXCJFbnRlclwiIHx8IGUua2V5ID09PSBcIiBcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVEcm9wZG93bkNsaWNrKGUsIGkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGUua2V5ID09PSBcIkFycm93RG93blwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wZW4gZHJvcGRvd24gYW5kIGZvY3VzIGZpcnN0IGl0ZW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3BlbkRyb3Bkb3duICE9PSBpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRPcGVuRHJvcGRvd24oaSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGb2N1cyBmaXJzdCBkcm9wZG93biBpdGVtIGFmdGVyIGEgYnJpZWYgZGVsYXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtZW51UmVmID0gZ2V0RHJvcGRvd25NZW51UmVmKGkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaXJzdEl0ZW0gPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lbnVSZWYuY3VycmVudD8ucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYTpmaXJzdC1jaGlsZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaXJzdEl0ZW0pIGZpcnN0SXRlbS5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvbGU9XCJtZW51aXRlbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmlhLWhhc3BvcHVwPVwidHJ1ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmlhLWV4cGFuZGVkPXtvcGVuRHJvcGRvd24gPT09IGl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmlhLWNvbnRyb2xzPXtgZHJvcGRvd24tbWVudS0ke2l9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZWRpdGFibGUtdGV4dCBkYXRhLXByb3A9XCJ0ZXh0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpdGVtLnRleHR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2VkaXRhYmxlLXRleHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3ZnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YG1sLTIgdy00IGgtNCB0cmFuc2l0aW9uLXRyYW5zZm9ybSBkdXJhdGlvbi0yMDAgJHtvcGVuRHJvcGRvd24gPT09IGkgPyBcInJvdGF0ZS0xODBcIiA6IFwiXCJ9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsbD1cIm5vbmVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3Qm94PVwiMCAwIDI0IDI0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2VXaWR0aD17Mn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkPVwiTTE5IDlsLTcgNy03LTdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWY9e2dldERyb3Bkb3duTWVudVJlZihpKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkPXtgZHJvcGRvd24tbWVudS0ke2l9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGxnOmFic29sdXRlIGxnOnRvcC1mdWxsIGxnOmxlZnQtMCBsZzptaW4tdy1bMjAwcHhdIHctZnVsbCBsZzpiZy13aGl0ZSBsZzpzaGFkb3ctbGcgbGc6cm91bmRlZC1sZyBsZzpib3JkZXIgbGc6Ym9yZGVyLWdyYXktMjAwIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTI1MCB6LTUwIHB4LTAgJHtvcGVuRHJvcGRvd24gPT09IGlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBcImJsb2NrIGxnOm9wYWNpdHktMTAwIGxnOnZpc2libGUgbGc6dHJhbnNsYXRlLXktMFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogXCJoaWRkZW4gbGc6YmxvY2sgbGc6b3BhY2l0eS0wIGxnOmludmlzaWJsZSBsZzp0cmFuc2xhdGUteS0xXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBsZzpncm91cC1ob3ZlcjpvcGFjaXR5LTEwMCBsZzpncm91cC1ob3Zlcjp2aXNpYmxlIGxnOmdyb3VwLWhvdmVyOnRyYW5zbGF0ZS15LTBgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9sZT1cIm1lbnVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJpYS1sYWJlbGxlZGJ5PXtgZHJvcGRvd24tYnV0dG9uLSR7aX1gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJpYS1oaWRkZW49e29wZW5Ecm9wZG93biAhPT0gaX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGRhdGEtZWRpdGFibGU9XCJhcnJheVwiIGRhdGEtcHJvcD1cImRyb3Bkb3duXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpdGVtLmRyb3Bkb3duLm1hcCgoZHJvcGRvd25faXRlbSwgaikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtqfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb2xlPVwibm9uZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtZWRpdGFibGU9XCJhcnJheS1pdGVtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLWFzdHJvLXByZWZldGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgYmxvY2sgcHgtMTIgbGc6cHgtNSBweS0yIHRleHQteGwgZm9udC1ub3JtYWwgbGc6Zm9udC1tZWRpdW0gaG92ZXI6YmctcHJpbWFyeS8xMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctcHJpbWFyeSBmb2N1czpyaW5nLWluc2V0IHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTIwMCBib3JkZXItYiBib3JkZXItZ3JheS0xMDAgbGFzdDpib3JkZXItYi0wICR7cGFnZVVybD8ucGF0aG5hbWUgPT09IGRyb3Bkb3duX2l0ZW0uZHJvcGRvd25fbGluayA/IFwidGV4dC1wcmltYXJ5XCIgOiBcInRleHQtZ3JheS03MDBcIn1gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhyZWY9e2Ryb3Bkb3duX2l0ZW0uZHJvcGRvd25fbGlua31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtjbG9zZU1vYmlsZU1lbnV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWVudVJlZiA9IGdldERyb3Bkb3duTWVudVJlZihpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1lbnVJdGVtcyA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lbnVSZWYuY3VycmVudD8ucXVlcnlTZWxlY3RvckFsbChcImFcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50SW5kZXggPSBBcnJheS5mcm9tKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZW51SXRlbXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApLmluZGV4T2YoZS50YXJnZXQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09IFwiQXJyb3dEb3duXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0SW5kZXggPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJbmRleCA8IG1lbnVJdGVtcy5sZW5ndGggLSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGN1cnJlbnRJbmRleCArIDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVudUl0ZW1zW25leHRJbmRleF0/LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGUua2V5ID09PSBcIkFycm93VXBcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByZXZJbmRleCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudEluZGV4ID4gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBjdXJyZW50SW5kZXggLSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IG1lbnVJdGVtcy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZW51SXRlbXNbcHJldkluZGV4XT8uZm9jdXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZS5rZXkgPT09IFwiRXNjYXBlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDbG9zZSBkcm9wZG93biBhbmQgcmV0dXJuIGZvY3VzIHRvIGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRPcGVuRHJvcGRvd24oZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXREcm9wZG93bkJ1dHRvblJlZihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApLmN1cnJlbnQ/LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb2xlPVwibWVudWl0ZW1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGVkaXRhYmxlLXRleHQgZGF0YS1wcm9wPVwiZHJvcGRvd25fdGV4dFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2Ryb3Bkb3duX2l0ZW0uZHJvcGRvd25fdGV4dH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2VkaXRhYmxlLXRleHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS1hc3Ryby1wcmVmZXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhyZWY9e2Ake2l0ZW0ubGlua31gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGJsb2NrIHB4LTEwIGxnOnB4LTUgcHktMyB0ZXh0LTJ4bCBsZzp0ZXh0LXhsIGZvbnQtbm9ybWFsIGxnOnJvdW5kZWQtbGcgdHJhbnNpdGlvbi1jb2xvcnMgZHVyYXRpb24tMjAwIGhvdmVyOmJnLXByaW1hcnkvMTAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLXByaW1hcnkgZm9jdXM6cmluZy1pbnNldCAke3BhZ2VVcmw/LnBhdGhuYW1lID09PSBpdGVtLmxpbmsgPyBcInRleHQtcHJpbWFyeVwiIDogXCJ0ZXh0LWdyYXktNzAwXCJ9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtjbG9zZU1vYmlsZU1lbnV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9sZT1cIm1lbnVpdGVtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxlZGl0YWJsZS10ZXh0IGRhdGEtcHJvcD1cInRleHRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpdGVtLnRleHR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9lZGl0YWJsZS10ZXh0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPGxpIHJvbGU9XCJub25lXCI+XG4gICAgICAgICAgICAgICAgICB7LyogTW9iaWxlIG5hdiBidXR0b24gLSBzaG93biBpbnNpZGUgbW9iaWxlIG1lbnUgKi99XG4gICAgICAgICAgICAgICAgICB7bmF2aWdhdGlvbi5lbmFibGVfbmF2X2J0biAmJiBpc01vYmlsZU1lbnVPcGVuID8gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1jZW50ZXIgbGc6aGlkZGVuXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGFcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtYXN0cm8tcHJlZmV0Y2hcbiAgICAgICAgICAgICAgICAgICAgICAgIGhyZWY9e2Ake25hdmlnYXRpb24ubmF2X2J0bj8ubGlua31gfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiaW5saW5lLWZsZXggbWItMiBpdGVtcy1jZW50ZXIgcHgtNiBweS0zIHRleHQtYmFzZSBiZy1zZWNvbmRhcnkgbGc6cm91bmRlZC0yeGwgZm9udC1ub3JtYWwgdGV4dC1wcmltYXJ5IGhvdmVyOmJnLXByaW1hcnkgaG92ZXI6dGV4dC1zZWNvbmRhcnkgYm9yZGVyIGJvcmRlci1wcmltYXJ5IHJvdW5kZWQteGwgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMzAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1wcmltYXJ5IGZvY3VzOnJpbmctb2Zmc2V0LTJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17Y2xvc2VNb2JpbGVNZW51fVxuICAgICAgICAgICAgICAgICAgICAgICAgcm9sZT1cIm1lbnVpdGVtXCJcbiAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZWRpdGFibGUtdGV4dCBkYXRhLXByb3A9XCJuYXZfYnRuLnRleHRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge25hdmlnYXRpb24ubmF2X2J0bj8udGV4dH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZWRpdGFibGUtdGV4dD5cbiAgICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKSA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAge25hdmlnYXRpb24uZW5hYmxlX25hdl9idG4gPyAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaGlkZGVuIGxnOmJsb2NrXCI+XG4gICAgICAgICAgICAgICAgPGFcbiAgICAgICAgICAgICAgICAgIGRhdGEtYXN0cm8tcHJlZmV0Y2hcbiAgICAgICAgICAgICAgICAgIGhyZWY9e2Ake25hdmlnYXRpb24ubmF2X2J0bj8ubGlua31gfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiaW5saW5lLWZsZXggaXRlbXMtY2VudGVyIHB4LTYgcHktMyB0ZXh0LWJhc2UgZm9udC1ub3JtYWwgdGV4dC1wcmltYXJ5IGJnLXNlY29uZGFyeSBob3ZlcjpiZy1wcmltYXJ5IGhvdmVyOnRleHQtc2Vjb25kYXJ5ICBib3JkZXIgYm9yZGVyLXByaW1hcnkgcm91bmRlZC14bCB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0zMDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLXByaW1hcnkgZm9jdXM6cmluZy1vZmZzZXQtMlwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPGVkaXRhYmxlLXRleHQgZGF0YS1wcm9wPVwibmF2X2J0bi50ZXh0XCI+XG4gICAgICAgICAgICAgICAgICAgIHtuYXZpZ2F0aW9uLm5hdl9idG4/LnRleHR9XG4gICAgICAgICAgICAgICAgICA8L2VkaXRhYmxlLXRleHQ+XG4gICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICkgOiBudWxsfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L25hdj5cbiAgICAgIDwvaGVhZGVyPlxuICAgIDwvPlxuICApO1xufVxuIl0sIm5hbWVzIjpbInVzZUVmZmVjdCIsInVzZVJlZiIsImV2ZW50IiwidXNlU3RhdGUiLCJqc3hzIiwiRnJhZ21lbnQiLCJqc3giXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQU1PLFNBQVMsa0JBQWtCLFFBQUEsRUFBeUI7QUFDekQsRUFBQUEsc0JBQUEsQ0FBVSxNQUFNO0FBQ2QsSUFBQSxJQUFJLFFBQUEsRUFBVTtBQUNaLE1BQUEsUUFBQSxDQUFTLElBQUEsQ0FBSyxNQUFNLFFBQUEsR0FBVyxRQUFBO0FBQUEsSUFDakMsQ0FBQSxNQUFPO0FBQ0wsTUFBQSxRQUFBLENBQVMsSUFBQSxDQUFLLE1BQU0sUUFBQSxHQUFXLEVBQUE7QUFBQSxJQUNqQztBQUVBLElBQUEsT0FBTyxNQUFZO0FBQ2pCLE1BQUEsUUFBQSxDQUFTLElBQUEsQ0FBSyxNQUFNLFFBQUEsR0FBVyxFQUFBO0FBQUEsSUFDakMsQ0FBQTtBQUFBLEVBQ0YsQ0FBQSxFQUFHLENBQUMsUUFBUSxDQUFDLENBQUE7QUFDZjs7QUNWTyxTQUFTLGVBQUEsQ0FDZCxRQUFBLEVBQ0EsT0FBQSxHQUFtQixJQUFBLEVBQ25CO0FBQ0EsRUFBQSxNQUFNLEdBQUEsR0FBTUMsb0JBQVUsSUFBSSxDQUFBO0FBRTFCLEVBQUFELHNCQUFBLENBQVUsTUFBTTtBQUNkLElBQUEsSUFBSSxDQUFDLE9BQUEsRUFBUztBQUVkLElBQUEsTUFBTSxrQkFBQSxHQUFxQixDQUFDLEtBQUEsS0FBNEI7QUFDdEQsTUFBQSxJQUFJLEdBQUEsQ0FBSSxXQUFXLENBQUMsR0FBQSxDQUFJLFFBQVEsUUFBQSxDQUFTLEtBQUEsQ0FBTSxNQUFjLENBQUEsRUFBRztBQUM5RCxRQUFBLFFBQUEsRUFBUztBQUFBLE1BQ1g7QUFBQSxJQUNGLENBQUE7QUFJQSxJQUFBLFFBQUEsQ0FB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
