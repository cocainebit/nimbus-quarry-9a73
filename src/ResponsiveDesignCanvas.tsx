import { useLayoutEffect, useRef, useState } from "react";
import type { Project } from "./model";
import AppDesignPreview from "./AppDesignPreview";
import "./responsive-design-canvas.css";
const devices = {
  desktop: { name: "Desktop", width: 1440, height: 1000 },
  tablet: { name: "Tablet", width: 1024, height: 900 },
  phone: { name: "Phone", width: 390, height: 844 },
};
type Device = keyof typeof devices;
export default function ResponsiveDesignCanvas({
  project,
}: {
  project: Project;
}) {
  const [device, setDevice] = useState<Device>("desktop");
  const [availableWidth, setAvailableWidth] = useState(760);
  const [contentHeight, setContentHeight] = useState(1000);
  const viewport = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const dimensions = devices[device];
  const scale = Math.min(1, Math.max(1, availableWidth) / dimensions.width);
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setAvailableWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setContentHeight(Math.ceil(entry.contentRect.height));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <section
      className={`responsive-design-canvas canvas-device-${device}`}
      aria-label="Responsive design canvas"
    >
      <div className="canvas-device-toolbar">
        <div role="group" aria-label="Canvas device">
          {(Object.keys(devices) as Device[]).map((key) => (
            <button
              type="button"
              aria-label={`Preview ${key}`}
              aria-pressed={device === key}
              key={key}
              onClick={() => {
                setDevice(key);
                viewport.current?.scrollTo({ top: 0 });
              }}
            >
              {devices[key].name}
            </button>
          ))}
        </div>
        <span aria-live="polite">
          {dimensions.width}px · {Math.round(scale * 100)}% scale
        </span>
      </div>
      <div
        className="canvas-device-viewport"
        ref={viewport}
        tabIndex={0}
        aria-label={`${dimensions.name} preview, scroll to inspect all sections`}
      >
        <div
          className="canvas-scaled-footprint"
          style={{
            width: dimensions.width * scale,
            height: Math.max(dimensions.height, contentHeight) * scale,
          }}
        >
          <div
            ref={canvas}
            className="canvas-device-content"
            style={
              {
                width: dimensions.width,
                minHeight: dimensions.height,
                transform: `scale(${scale})`,
                "--canvas-min-height": `${dimensions.height}px`,
              } as React.CSSProperties
            }
          >
            <AppDesignPreview project={project} />
          </div>
        </div>
      </div>
      <p className="canvas-device-note">
        Actual {dimensions.width}px layout, scaled to fit. Scroll the canvas to
        inspect every section. Preview records are illustrative.
      </p>
    </section>
  );
}
