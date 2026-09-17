import type { CSSProperties, ReactNode } from "react";
import { getLayoutPreset } from "../shared/app-layouts.mjs";
import "./app-overview-layout.css";
export type OverviewSlot =
  "heading" | "widgets" | "stats" | "recent" | "actions";
type Slots = Record<OverviewSlot, ReactNode>;
function grid(rows: string[][], slots: Slots) {
  const visible = rows
    .map((row) => row.map((name) => (slots[name as OverviewSlot] ? name : ".")))
    .filter((row) => row.some((name) => name !== "."));
  return {
    areas: visible.map((row) => `"${row.join(" ")}"`).join(" ") || "none",
    columns: `repeat(${visible[0]?.length || 1},minmax(0,1fr))`,
  };
}
/** Content is rendered once, in semantic mobile order. Container queries change
 * only placement, so previews, small embeds and published apps share a layout. */
export default function AppOverviewLayout({
  layout,
  slots,
}: {
  layout: string;
  slots: Slots;
}) {
  const preset = getLayoutPreset(layout),
    desktop = grid(preset.desktop, slots),
    tablet = grid(preset.tablet, slots);
  const mobile = preset.mobile.filter(
    (name: string) => slots[name as OverviewSlot],
  );
  const style = {
    "--layout-desktop-areas": desktop.areas,
    "--layout-desktop-columns": desktop.columns,
    "--layout-tablet-areas": tablet.areas,
    "--layout-tablet-columns": tablet.columns,
    "--layout-mobile-areas": mobile
      .map((name: string) => `"${name}"`)
      .join(" "),
    "--layout-max-width": `${preset.maxWidth}px`,
    "--layout-widget-columns": preset.widgetColumns,
    "--layout-tablet-widget-columns": Math.min(2, preset.widgetColumns),
  } as CSSProperties;
  return (
    <div
      className={`app-composition app-composition-${preset.id} app-recent-${preset.recordView}`}
      style={style}
      data-layout={preset.id}
    >
      <div className="app-composition-grid">
        {mobile.map((name: string) => (
          <section
            key={name}
            className={`app-composition-slot app-slot-${name}`}
            data-layout-slot={name}
            style={{ gridArea: name }}
          >
            {slots[name as OverviewSlot]}
          </section>
        ))}
      </div>
    </div>
  );
}
