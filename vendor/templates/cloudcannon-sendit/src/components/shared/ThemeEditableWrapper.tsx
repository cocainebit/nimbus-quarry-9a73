import dataTheme from "@data/theme.json";
import React, { Suspense, useRef } from "react";
import { useCloudCannonEditor } from "../../hooks/useCloudCannonEditor";

const ThemeSelector = React.lazy(() => import("./ThemeSelector"));

const ThemeEditableWrapper = () => {
  const isEditable = useCloudCannonEditor();
  const ref = useRef<HTMLDivElement & { editable: any }>(null);

  const { theme } = dataTheme;

  return (
    <>
      {isEditable && (
        <Suspense fallback={null}>
          <div
            data-editable="component"
            data-hide-controls
            ref={ref}
            onClick={() =>
              ref.current?.editable.controlsElement.editButton.click()
            }
            style={{ position: "fixed" }}
            className="w-18 h-18 outline-1 -outline-offset-4 shadow-[#034ad8]/20 bottom-4 right-4 rounded-full bg-[#034ad8] shadow-lg outline-secondary z-50 hover:cursor-pointer"
            data-prop="@data[theme].theme"
            data-component="shared/ThemeSelector"
            title="Theme selector."
          >
            <ThemeSelector {...theme} />
          </div>
        </Suspense>
      )}
    </>
  );
};

export default ThemeEditableWrapper;
