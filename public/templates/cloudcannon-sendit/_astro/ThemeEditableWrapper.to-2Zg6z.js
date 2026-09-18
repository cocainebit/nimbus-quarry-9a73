const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["_astro/ThemeSelector.BroC-4iA.js","_astro/jsx-runtime.DfqoFFQ2.js","_astro/index.BsgqzGof.js"])))=>i.map(i=>d[i]);
import { _ as __vitePreload } from './preload-helper.BC7ZYKCr.js';
import { j as jsxRuntimeExports } from './jsx-runtime.DfqoFFQ2.js';
import { r as reactExports, R as React } from './index.BsgqzGof.js';

const theme = {"primary_color":"#e71818","secondary_color":"#ffffff","anchor_color":"#f5e30d"};
const dataTheme = {
  theme,
};

const useCloudCannonEditor = () => {
  const [isEditable, setIsEditable] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (typeof window !== "undefined" && window.inEditorMode) {
      setIsEditable(true);
    }
  }, []);
  return isEditable;
};

const ThemeSelector = React.lazy(() => __vitePreload(() => import('./ThemeSelector.BroC-4iA.js'),true              ?__vite__mapDeps([0,1,2]):void 0));
const ThemeEditableWrapper = () => {
  const isEditable = useCloudCannonEditor();
  const ref = reactExports.useRef(null);
  const { theme } = dataTheme;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: isEditable && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-editable": "component",
      "data-hide-controls": true,
      ref,
      onClick: () => ref.current?.editable.controlsElement.editButton.click(),
      style: { position: "fixed" },
      className: "w-18 h-18 outline-1 -outline-offset-4 shadow-[#034ad8]/20 bottom-4 right-4 rounded-full bg-[#034ad8] shadow-lg outline-secondary z-50 hover:cursor-pointer",
      "data-prop": "@data[theme].theme",
      "data-component": "shared/ThemeSelector",
      title: "Theme selector.",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(ThemeSelector, { ...theme })
    }
  ) }) });
};

export { ThemeEditableWrapper as default };


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUVPLE1BQU0sdUJBQXVCLE1BQU07QUFDeEMsUUFBTSxDQUFDLFlBQVksYUFBYSxJQUFJQSxzQkFBUyxLQUFLO0FBRWxELEVBQUFDLHNCQUFBLENBQVUsTUFBTTtBQUVkLFFBQUksT0FBTyxXQUFXLGVBQWUsT0FBTyxjQUFjO0FBQ3hELG9CQUFjLElBQUk7QUFBQSxJQUNwQjtBQUFBLEVBQ0YsR0FBRyxFQUFFO0FBRUwsU0FBTztBQUNUOztBQ1RBLE1BQU0sZ0JBQWdCLE1BQU0sS0FBSywwQkFBTSxPQUFPLDZCQUFpQixxREFBQztBQUVoRSxNQUFNLHVCQUF1QixNQUFNO0FBQ2pDLFFBQU0sYUFBYSxzQkFBcUI7QUFDeEMsUUFBTSxNQUFNQyxvQkFBMkMsSUFBSTtBQUUzRCxRQUFNLEVBQUUsT0FBTSxHQUFJO0FBRWxCLHlCQUNFQyxxQkFBQSxDQUFBQywwQkFBQSxJQUNHLHdDQUNDRCxxQkFBQSxDQUFDRSxxQkFBQSxJQUFTLFVBQVUsTUFDbEIsMEJBQUFGLHFCQUFBO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxpQkFBYztBQUFBLE1BQ2Qsc0JBQWtCO0FBQUEsTUFDbEI7QUFBQSxNQUNBLFNBQVMsTUFDUCxJQUFJLFNBQVMsU0FBUyxnQkFBZ0IsV0FBVyxPQUFNO0FBQUEsTUFFekQsT0FBTyxFQUFFLFVBQVUsU0FBUTtBQUFBLE1BQzNCLFdBQVU7QUFBQSxNQUNWLGFBQVU7QUFBQSxNQUNWLGtCQUFlO0FBQUEsTUFDZixPQUFNO0FBQUEsTUFFTiwwQkFBQUEscUJBQUEsQ0FBQyxpQkFBZSxHQUFHLE9BQU87QUFBQTtBQUFBLEtBRTlCLEdBRUo7QUFFSiIsIm5hbWVzIjpbInVzZVN0YXRlIiwidXNlRWZmZWN0IiwidXNlUmVmIiwianN4IiwiRnJhZ21lbnQiLCJTdXNwZW5zZSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyIuLi8uLi9zcmMvaG9va3MvdXNlQ2xvdWRDYW5ub25FZGl0b3IudHMiLCIuLi8uLi9zcmMvY29tcG9uZW50cy9zaGFyZWQvVGhlbWVFZGl0YWJsZVdyYXBwZXIudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tIFwicmVhY3RcIjtcblxuZXhwb3J0IGNvbnN0IHVzZUNsb3VkQ2Fubm9uRWRpdG9yID0gKCkgPT4ge1xuICBjb25zdCBbaXNFZGl0YWJsZSwgc2V0SXNFZGl0YWJsZV0gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAvLyBDaGVjayBpZiB3aW5kb3cuaW5FZGl0b3JNb2RlIChmcm9tIG91ciBwcmV2aW91cyBzZXR1cClcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3cuaW5FZGl0b3JNb2RlKSB7XG4gICAgICBzZXRJc0VkaXRhYmxlKHRydWUpO1xuICAgIH1cbiAgfSwgW10pO1xuXG4gIHJldHVybiBpc0VkaXRhYmxlO1xufTtcbiIsImltcG9ydCBkYXRhVGhlbWUgZnJvbSBcIkBkYXRhL3RoZW1lLmpzb25cIjtcbmltcG9ydCBSZWFjdCwgeyBTdXNwZW5zZSwgdXNlUmVmIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyB1c2VDbG91ZENhbm5vbkVkaXRvciB9IGZyb20gXCIuLi8uLi9ob29rcy91c2VDbG91ZENhbm5vbkVkaXRvclwiO1xuXG5jb25zdCBUaGVtZVNlbGVjdG9yID0gUmVhY3QubGF6eSgoKSA9PiBpbXBvcnQoXCIuL1RoZW1lU2VsZWN0b3JcIikpO1xuXG5jb25zdCBUaGVtZUVkaXRhYmxlV3JhcHBlciA9ICgpID0+IHtcbiAgY29uc3QgaXNFZGl0YWJsZSA9IHVzZUNsb3VkQ2Fubm9uRWRpdG9yKCk7XG4gIGNvbnN0IHJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudCAmIHsgZWRpdGFibGU6IGFueSB9PihudWxsKTtcblxuICBjb25zdCB7IHRoZW1lIH0gPSBkYXRhVGhlbWU7XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAge2lzRWRpdGFibGUgJiYgKFxuICAgICAgICA8U3VzcGVuc2UgZmFsbGJhY2s9e251bGx9PlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIGRhdGEtZWRpdGFibGU9XCJjb21wb25lbnRcIlxuICAgICAgICAgICAgZGF0YS1oaWRlLWNvbnRyb2xzXG4gICAgICAgICAgICByZWY9e3JlZn1cbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+XG4gICAgICAgICAgICAgIHJlZi5jdXJyZW50Py5lZGl0YWJsZS5jb250cm9sc0VsZW1lbnQuZWRpdEJ1dHRvbi5jbGljaygpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdHlsZT17eyBwb3NpdGlvbjogXCJmaXhlZFwiIH19XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTE4IGgtMTggb3V0bGluZS0xIC1vdXRsaW5lLW9mZnNldC00IHNoYWRvdy1bIzAzNGFkOF0vMjAgYm90dG9tLTQgcmlnaHQtNCByb3VuZGVkLWZ1bGwgYmctWyMwMzRhZDhdIHNoYWRvdy1sZyBvdXRsaW5lLXNlY29uZGFyeSB6LTUwIGhvdmVyOmN1cnNvci1wb2ludGVyXCJcbiAgICAgICAgICAgIGRhdGEtcHJvcD1cIkBkYXRhW3RoZW1lXS50aGVtZVwiXG4gICAgICAgICAgICBkYXRhLWNvbXBvbmVudD1cInNoYXJlZC9UaGVtZVNlbGVjdG9yXCJcbiAgICAgICAgICAgIHRpdGxlPVwiVGhlbWUgc2VsZWN0b3IuXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8VGhlbWVTZWxlY3RvciB7Li4udGhlbWV9IC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvU3VzcGVuc2U+XG4gICAgICApfVxuICAgIDwvPlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgVGhlbWVFZGl0YWJsZVdyYXBwZXI7XG4iXSwiZmlsZSI6Il9hc3Ryby9UaGVtZUVkaXRhYmxlV3JhcHBlci50by0yWmc2ei5qcyJ9