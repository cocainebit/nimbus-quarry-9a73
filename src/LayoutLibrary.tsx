import { useState } from "react";
import { layoutPresets } from "../shared/app-layouts.mjs";
import "./layout-library.css";

type Viewport = "desktop" | "tablet" | "mobile";
const slotLabels: Record<string, string> = {
  heading: "Title",
  widgets: "Metrics",
  stats: "Summary",
  recent: "Work",
  actions: "Actions",
};

export default function LayoutLibrary({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const categories = [
    ...new Set(layoutPresets.map((layout) => layout.category)),
  ];
  const filtered = layoutPresets.filter(
    (layout) =>
      (category === "all" || layout.category === category) &&
      `${layout.name} ${layout.category} ${layout.description}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const selected = layoutPresets.find((layout) => layout.id === value);
  return (
    <section className="layout-library" aria-label="Responsive layout library">
      <div className="layout-library-heading">
        <strong>Responsive layout library</strong>
        <span>{layoutPresets.length} layouts</span>
      </div>
      <p className="layout-library-intro">
        Reorganize the workspace. Every layout includes desktop, tablet and
        mobile arrangements; your database connections stay in place.
      </p>
      <label>
        Content layout
        <select
          aria-label="Content layout"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {layoutPresets.map((layout) => (
            <option value={layout.id} key={layout.id}>
              {layout.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Search layouts
        <input
          type="search"
          aria-label="Search layouts"
          placeholder="Find a structure for your workspace…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <label>
        Category
        <select
          aria-label="Layout category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="all">All layouts</option>
          {categories.map((item) => (
            <option value={item} key={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <div
        className="layout-library-viewports"
        role="group"
        aria-label="Layout preview viewport"
      >
        {(["desktop", "tablet", "mobile"] as const).map((item) => (
          <button
            type="button"
            key={item}
            aria-pressed={viewport === item}
            onClick={() => setViewport(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="layout-library-count" aria-live="polite">
        <span>{filtered.length} matching layouts</span>
        <span>{selected?.name || "Custom layout"}</span>
      </div>
      <div className="layout-library-grid">
        {filtered.map((layout) => {
          const grid: string[][] =
            viewport === "mobile"
              ? layout.mobile.map((slot: string) => [slot])
              : layout[viewport];
          const slots = [...new Set(grid.flat())].filter(
            (slot) => slot !== ".",
          );
          return (
            <button
              type="button"
              className="layout-library-card"
              key={layout.id}
              aria-pressed={value === layout.id}
              onClick={() => onChange(layout.id)}
            >
              <span
                className={`layout-miniature-frame layout-frame-${viewport}`}
                aria-hidden="true"
              >
                <span
                  className="layout-miniature"
                  style={{
                    gridTemplateAreas: grid
                      .map((row) => `"${row.join(" ")}"`)
                      .join(" "),
                    gridTemplateColumns: `repeat(${grid[0]?.length || 1}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${grid.length}, minmax(0, 1fr))`,
                  }}
                >
                  {slots.map((slot) => (
                    <span
                      className={`layout-miniature-slot layout-slot-${slot}`}
                      style={{ gridArea: slot }}
                      key={slot}
                    >
                      <span>{slotLabels[slot] || slot}</span>
                      <i />
                      <i />
                    </span>
                  ))}
                </span>
              </span>
              <strong>{layout.name}</strong>
              <small>{layout.description}</small>
              <span className="layout-library-category">{layout.category}</span>
            </button>
          );
        })}
      </div>
      {!filtered.length && (
        <div className="layout-library-empty">
          <p>No layouts match these filters.</p>
          <button
            type="button"
            onClick={() => {
              setCategory("all");
              setQuery("");
            }}
          >
            Reset layout filters
          </button>
        </div>
      )}
      <p className="layout-library-footnote">
        Thumbnails show section placement. Empty database sections display their
        actual empty state in your app.
      </p>
    </section>
  );
}
