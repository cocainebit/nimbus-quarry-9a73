import { useEffect, useState } from "react";
import { api, type Collection } from "./backend-api";
import type { Project } from "./model";
import {
  getAppDesign,
  designPresets,
  applyDesignPreset,
  createDashboardWidgets,
  fontOptions,
} from "../shared/app-design.mjs";
import "./preset-gallery.css";
import { contrastRatio } from "../shared/design-colors.mjs";
import ResponsiveDesignCanvas from "./ResponsiveDesignCanvas";
import LayoutLibrary from "./LayoutLibrary";
export default function AppLayoutSettings({
  project,
  onChange,
  onClose,
}: {
  project: Project;
  onChange: (p: Project) => void;
  onClose: () => void;
}) {
  const app = project.app!;
  const design = getAppDesign(app);
  const setDesign = (next: typeof design) =>
    onChange({ ...project, app: { ...app, design: next } });
  const [collections, setCollections] = useState<Collection[]>([]);
  const [error, setError] = useState("");
  const [themeSearch, setThemeSearch] = useState("");
  const [themeSource, setThemeSource] = useState("all");
  const [themeMode, setThemeMode] = useState("all");
  const [connectionNotice, setConnectionNotice] = useState("");
  const [loadingCollections, setLoadingCollections] = useState(true);
  const sources = [...new Set(designPresets.map((p) => p.source))];
  const filteredPresets = designPresets.filter(
    (p) =>
      (themeSource === "all" || p.source === themeSource) &&
      (themeMode === "all" || p.mode === themeMode) &&
      `${p.name} ${p.description} ${p.source}`
        .toLowerCase()
        .includes(themeSearch.trim().toLowerCase()),
  );
  const textContrast = Math.min(
    contrastRatio(design.palette.text, design.palette.surface),
    contrastRatio(design.palette.text, design.palette.background),
  );
  const mutedContrast = Math.min(
    contrastRatio(design.palette.muted, design.palette.surface),
    contrastRatio(design.palette.muted, design.palette.background),
  );
  const matchingPreset = designPresets.find((p) =>
    Object.entries(p.palette).every(
      ([key, value]) =>
        design.palette[key as keyof typeof design.palette] === value,
    ),
  );
  const connectDashboard = () => {
    const generated: typeof design.widgets =
      createDashboardWidgets(collections);
    const bindings = new Set(
      design.widgets.map((w) => `${w.type}:${w.collectionId}:${w.field || ""}`),
    );
    const additional = generated
      .filter(
        (w) => !bindings.has(`${w.type}:${w.collectionId}:${w.field || ""}`),
      )
      .slice(0, 12 - design.widgets.length);
    setDesign({ ...design, widgets: [...design.widgets, ...additional] });
    setConnectionNotice(
      additional.length
        ? `${additional.length} widgets connected to your existing database. No records were created.`
        : "Your dashboard already has these collection bindings.",
    );
  };
  useEffect(() => {
    let alive = true;
    setLoadingCollections(true);
    setCollections([]);
    void api(`/api/projects/${project.id}/backend`)
      .then((b) => {
        if (alive) setCollections(b.collections);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoadingCollections(false);
      });
    return () => {
      alive = false;
    };
  }, [project.id]);
  return (
    <div className="modal-backdrop">
      <section
        className="backend-panel design-studio"
        role="dialog"
        aria-modal="true"
        aria-label="App layout"
      >
        <div className="backend-actions">
          <h2>App design studio</h2>
          <button onClick={onClose}>Close</button>
        </div>
        <p>
          Customize the screens connected to your app’s database. Changes go
          live when you publish.
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="design-studio-body">
          <div className="backend-form design-controls">
            <fieldset>
              <legend>01 / Design direction</legend>
              <div className="preset-gallery-tools">
                <label>
                  Search themes
                  <input
                    type="search"
                    aria-label="Search themes"
                    placeholder="Search theme names or styles…"
                    value={themeSearch}
                    onChange={(e) => setThemeSearch(e.target.value)}
                  />
                </label>
                <div className="preset-gallery-filters">
                  <label>
                    Source
                    <select
                      aria-label="Theme source"
                      value={themeSource}
                      onChange={(e) => setThemeSource(e.target.value)}
                    >
                      <option value="all">All sources</option>
                      {sources.map((source) => (
                        <option key={source} value={source}>
                          {source}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Appearance
                    <select
                      aria-label="Theme appearance"
                      value={themeMode}
                      onChange={(e) => setThemeMode(e.target.value)}
                    >
                      <option value="all">Light & dark</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </label>
                </div>
                <div className="preset-gallery-status">
                  <span aria-live="polite">
                    {filteredPresets.length} of {designPresets.length} presets
                  </span>
                  <span>
                    {matchingPreset
                      ? `Selected: ${matchingPreset.name}`
                      : "Custom palette"}
                  </span>
                </div>
              </div>
              <div
                className="design-preset-grid preset-gallery-scroll"
                aria-label="Theme presets"
              >
                {filteredPresets.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    className="design-preset preset-gallery-card"
                    aria-pressed={matchingPreset?.id === p.id}
                    onClick={() => setDesign(applyDesignPreset(design, p))}
                  >
                    <span
                      className="preset-miniature"
                      aria-hidden="true"
                      style={{
                        background: p.palette.background,
                        color: p.palette.text,
                        borderColor: p.palette.border,
                      }}
                    >
                      <span
                        className="preset-miniature-bar"
                        style={{
                          background: p.palette.surface,
                          borderColor: p.palette.border,
                        }}
                      >
                        <i style={{ background: p.palette.primary }} />
                        <i style={{ background: p.palette.border }} />
                        <i style={{ background: p.palette.border }} />
                      </span>
                      <span className="preset-miniature-content">
                        <b>Aa</b>
                        <span className="preset-miniature-stats">
                          {[0, 1, 2].map((i) => (
                            <i
                              key={i}
                              style={{
                                background: p.palette.surface,
                                borderColor: p.palette.border,
                              }}
                            >
                              <span
                                style={{
                                  background:
                                    i === 0
                                      ? p.palette.primary
                                      : p.palette.muted,
                                }}
                              />
                            </i>
                          ))}
                        </span>
                      </span>
                    </span>
                    <strong>{p.name}</strong>
                    <small>{p.description}</small>
                    <span className="preset-card-meta">
                      <span>{p.source}</span>
                      <span>{p.mode}</span>
                    </span>
                    <span className="design-swatches" aria-hidden="true">
                      {Object.values(p.palette)
                        .slice(0, 4)
                        .map((color, i) => (
                          <i key={i} style={{ background: color }} />
                        ))}
                    </span>
                  </button>
                ))}
              </div>
              {!filteredPresets.length && (
                <div className="preset-gallery-empty">
                  <p>No themes match these filters.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setThemeSearch("");
                      setThemeSource("all");
                      setThemeMode("all");
                    }}
                  >
                    Reset theme filters
                  </button>
                </div>
              )}
              <p className="preset-gallery-help">
                Themes change presentation. Your screens, records, permissions
                and dashboard connections stay in place.
              </p>
            </fieldset>
            <fieldset>
              <legend>02 / Theme tokens</legend>
              <div className="design-colors">
                {Object.entries(design.palette).map(([key, value]) => (
                  <label key={key}>
                    {key}
                    <input
                      type="color"
                      aria-label={`${key} color`}
                      value={value}
                      onChange={(e) =>
                        setDesign({
                          ...design,
                          palette: { ...design.palette, [key]: e.target.value },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <div
                className={`preset-contrast-note ${Math.min(textContrast, mutedContrast) < 4.5 ? "needs-attention" : ""}`}
                aria-live="polite"
              >
                <strong>Text contrast · {textContrast.toFixed(1)}:1</strong>
                <span>Secondary text · {mutedContrast.toFixed(1)}:1</span>
                {Math.min(textContrast, mutedContrast) < 4.5 && (
                  <p>
                    Some text colors fall below 4.5:1 on your surfaces. Adjust
                    Text or Muted for easier reading.
                  </p>
                )}
              </div>
              <label>
                Body typography
                <select
                  aria-label="Body typography"
                  value={design.font}
                  onChange={(e) =>
                    setDesign({
                      ...design,
                      font: e.target.value as typeof design.font,
                    })
                  }
                >
                  {fontOptions.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Heading typography
                <select
                  aria-label="Heading typography"
                  value={design.headingFont || ""}
                  onChange={(e) =>
                    setDesign({
                      ...design,
                      headingFont: (e.target.value ||
                        undefined) as typeof design.headingFont,
                    })
                  }
                >
                  <option value="">Match body typography</option>
                  {fontOptions.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
              <LayoutLibrary
                value={design.layout}
                onChange={(layout) =>
                  setDesign({
                    ...design,
                    layout: layout as typeof design.layout,
                  })
                }
              />
              <label>
                Corner radius · {design.radius}px
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={design.radius}
                  onChange={(e) =>
                    setDesign({ ...design, radius: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Density
                <select
                  aria-label="Density"
                  value={design.density}
                  onChange={(e) =>
                    setDesign({
                      ...design,
                      density: e.target.value as typeof design.density,
                    })
                  }
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
              <label>
                Navigation layout
                <select
                  aria-label="Navigation layout"
                  value={design.navigation}
                  onChange={(e) =>
                    setDesign({
                      ...design,
                      navigation: e.target.value as typeof design.navigation,
                    })
                  }
                >
                  <option value="sidebar">Sidebar workspace</option>
                  <option value="topbar">Top navigation</option>
                </select>
              </label>
              <label>
                Dashboard heading
                <input
                  maxLength={160}
                  value={design.heading}
                  onChange={(e) =>
                    setDesign({ ...design, heading: e.target.value })
                  }
                />
              </label>
            </fieldset>
            <fieldset>
              <legend>03 / Connected dashboard</legend>
              <p>
                Widgets use all records the signed-in member is allowed to read.
              </p>
              <div className="preset-connect-panel">
                <button
                  type="button"
                  className="preset-connect-button"
                  disabled={
                    loadingCollections ||
                    !collections.length ||
                    design.widgets.length >= 12
                  }
                  onClick={connectDashboard}
                >
                  Connect dashboard automatically
                </button>
                <small>
                  {loadingCollections
                    ? "Loading your collections…"
                    : !collections.length
                      ? "Create collections in App backend to connect live data."
                      : `Use ${collections.length} existing collections for counts, totals and status breakdowns.`}
                </small>
                {connectionNotice && <p role="status">{connectionNotice}</p>}
              </div>
              {design.widgets.map((w, i) => (
                <div className="design-widget-editor" key={w.id}>
                  <label>
                    Widget title
                    <input
                      value={w.title}
                      maxLength={80}
                      onChange={(e) =>
                        setDesign({
                          ...design,
                          widgets: design.widgets.map((x, j) =>
                            i === j
                              ? {
                                  ...x,
                                  title: e.target.value || "Untitled widget",
                                }
                              : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    Widget type
                    <select
                      aria-label="Widget type"
                      value={w.type}
                      onChange={(e) => {
                        const type = e.target.value as typeof w.type;
                        const c = collections.find(
                          (c) => c.id === w.collectionId,
                        );
                        const field = c?.fields.find((f) =>
                          type === "sum"
                            ? f.type === "number"
                            : type === "group"
                              ? f.type === "enum"
                              : true,
                        )?.name;
                        setDesign({
                          ...design,
                          widgets: design.widgets.map((x, j) =>
                            i === j ? { ...x, type, field } : x,
                          ),
                        });
                      }}
                    >
                      <option value="count">Record count</option>
                      <option
                        value="sum"
                        disabled={
                          !collections
                            .find((c) => c.id === w.collectionId)
                            ?.fields.some((f) => f.type === "number")
                        }
                      >
                        Numeric total
                      </option>
                      <option
                        value="group"
                        disabled={
                          !collections
                            .find((c) => c.id === w.collectionId)
                            ?.fields.some((f) => f.type === "enum")
                        }
                      >
                        Status breakdown
                      </option>
                      <option value="recent">Recent records</option>
                    </select>
                  </label>
                  <label>
                    Collection
                    <select
                      aria-label="Collection"
                      value={w.collectionId}
                      onChange={(e) =>
                        setDesign({
                          ...design,
                          widgets: design.widgets.map((x, j) =>
                            i === j
                              ? {
                                  ...x,
                                  collectionId: e.target.value,
                                  type: "count",
                                  field: undefined,
                                }
                              : x,
                          ),
                        })
                      }
                    >
                      {collections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {["sum", "group"].includes(w.type) && (
                    <label>
                      Field
                      <select
                        aria-label="Field"
                        value={w.field}
                        onChange={(e) =>
                          setDesign({
                            ...design,
                            widgets: design.widgets.map((x, j) =>
                              i === j ? { ...x, field: e.target.value } : x,
                            ),
                          })
                        }
                      >
                        {collections
                          .find((c) => c.id === w.collectionId)
                          ?.fields.filter((f) =>
                            w.type === "sum"
                              ? f.type === "number"
                              : f.type === "enum",
                          )
                          .map((f) => (
                            <option key={f.name} value={f.name}>
                              {f.label}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setDesign({
                        ...design,
                        widgets: design.widgets.filter((_, j) => i !== j),
                      })
                    }
                  >
                    Remove widget
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={!collections.length || design.widgets.length >= 12}
                onClick={() =>
                  setDesign({
                    ...design,
                    widgets: [
                      ...design.widgets,
                      {
                        id: crypto.randomUUID(),
                        title: collections[0].name,
                        type: "count",
                        collectionId: collections[0].id,
                        limit: 5,
                      },
                    ],
                  })
                }
              >
                + Add data widget
              </button>
            </fieldset>

            <label>
              Workspace title
              <input
                value={app.title}
                maxLength={100}
                onChange={(e) =>
                  onChange({
                    ...project,
                    app: { ...app, title: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Workspace description
              <textarea
                value={app.description}
                maxLength={400}
                onChange={(e) =>
                  onChange({
                    ...project,
                    app: { ...app, description: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Visual style
              <select
                value={app.template}
                onChange={(e) =>
                  onChange({
                    ...project,
                    app: {
                      ...app,
                      template: e.target.value as "portal" | "crm" | "tracker",
                    },
                  })
                }
              >
                <option value="portal">Client portal · warm editorial</option>
                <option value="crm">CRM · focused violet</option>
                <option value="tracker">Project tracker · cool blue</option>
              </select>
            </label>
            {app.navigation.map((n, i) => (
              <fieldset key={n.collectionId}>
                <legend>Screen {i + 1}</legend>
                <label>
                  Navigation label
                  <input
                    value={n.label}
                    maxLength={80}
                    onChange={(e) =>
                      onChange({
                        ...project,
                        app: {
                          ...app,
                          navigation: app.navigation.map((x, j) =>
                            i === j ? { ...x, label: e.target.value } : x,
                          ),
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Data layout
                  <select
                    value={n.view}
                    onChange={(e) =>
                      onChange({
                        ...project,
                        app: {
                          ...app,
                          navigation: app.navigation.map((x, j) =>
                            i === j
                              ? {
                                  ...x,
                                  view: e.target.value as
                                    "table" | "cards" | "board",
                                }
                              : x,
                          ),
                        },
                      })
                    }
                  >
                    <option value="table">Table</option>
                    <option value="cards">Cards</option>
                    {n.statusField && (
                      <option value="board">Status board</option>
                    )}
                  </select>
                </label>
                <label>
                  Board status field
                  <select
                    value={n.statusField || ""}
                    onChange={(e) =>
                      onChange({
                        ...project,
                        app: {
                          ...app,
                          navigation: app.navigation.map((x, j) =>
                            i === j
                              ? {
                                  ...x,
                                  statusField: e.target.value || undefined,
                                  view: e.target.value ? x.view : "table",
                                }
                              : x,
                          ),
                        },
                      })
                    }
                  >
                    <option value="">No status field</option>
                    {collections
                      .find((c) => c.id === n.collectionId)
                      ?.fields.filter((f) => f.type === "enum")
                      .map((f) => (
                        <option key={f.name} value={f.name}>
                          {f.label}
                        </option>
                      ))}
                  </select>
                </label>
                <div className="design-field-list">
                  <strong>Visible columns</strong>
                  {collections
                    .find((c) => c.id === n.collectionId)
                    ?.fields.map((f) => (
                      <label key={f.name}>
                        <input
                          type="checkbox"
                          checked={
                            !n.visibleFields || n.visibleFields.includes(f.name)
                          }
                          onChange={(e) => {
                            const current =
                              n.visibleFields ||
                              collections
                                .find((c) => c.id === n.collectionId)!
                                .fields.map((f) => f.name);
                            onChange({
                              ...project,
                              app: {
                                ...app,
                                navigation: app.navigation.map((x, j) =>
                                  j === i
                                    ? {
                                        ...x,
                                        visibleFields: e.target.checked
                                          ? [...current, f.name]
                                          : current.filter(
                                              (name) => name !== f.name,
                                            ),
                                      }
                                    : x,
                                ),
                              },
                            });
                          }}
                        />
                        {f.label}
                      </label>
                    ))}
                </div>
                <button
                  onClick={() =>
                    onChange({
                      ...project,
                      app: {
                        ...app,
                        navigation: app.navigation.filter((_, j) => j !== i),
                      },
                    })
                  }
                >
                  Remove screen
                </button>
                <button
                  disabled={i === 0}
                  onClick={() => {
                    const nav = [...app.navigation];
                    [nav[i - 1], nav[i]] = [nav[i], nav[i - 1]];
                    onChange({ ...project, app: { ...app, navigation: nav } });
                  }}
                >
                  Move up
                </button>
              </fieldset>
            ))}
            <label>
              Add a collection screen
              <select
                value=""
                onChange={(e) => {
                  const c = collections.find((c) => c.id === e.target.value);
                  if (c)
                    onChange({
                      ...project,
                      app: {
                        ...app,
                        navigation: [
                          ...app.navigation,
                          {
                            collectionId: c.id,
                            label: c.name,
                            view: "table",
                            statusField: c.fields.find((f) => f.type === "enum")
                              ?.name,
                          },
                        ],
                      },
                    });
                }}
              >
                <option value="">Choose a collection</option>
                {collections
                  .filter(
                    (c) => !app.navigation.some((n) => n.collectionId === c.id),
                  )
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div className="design-preview-pane">
            <div className="design-preview-caption">
              <strong>Live canvas</strong>
              <span>Changes apply to your published app after publishing.</span>
            </div>
            <ResponsiveDesignCanvas project={project} />
          </div>
        </div>
      </section>
    </div>
  );
}
