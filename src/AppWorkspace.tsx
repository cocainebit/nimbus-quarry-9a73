import { confirmDialog } from "./dialogs";
import { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  Bell,
  Search,
  Plus,
  ChevronRight,
  LogOut,
  ArrowUpRight,
  Columns3,
  List,
  CheckCircle2,
} from "lucide-react";
import type { Project } from "./model";
import { api, type Collection, type DataRecord } from "./backend-api";
import AccountForm from "./AccountForm";
import { RecordFields, formRecordData } from "./RecordFields";
import RuntimeFiles from "./RuntimeFiles";
import "./app-workspace.css";
import AppOverviewLayout from "./AppOverviewLayout";
import { designVariables, getAppDesign } from "../shared/app-design.mjs";
type Nav = {
  collectionId: string;
  label: string;
  view: "table" | "board" | "cards";
  statusField?: string;
  visibleFields?: string[];
  fieldLabels?: Record<string, string>;
};
export default function AppWorkspace({
  project,
  collections,
  base,
  user,
  onSession,
  preview = false,
}: {
  project: Project;
  collections: Collection[];
  base: string;
  user: any;
  onSession: () => Promise<void>;
  preview?: boolean;
}) {
  const config = project.app!;
  const design = getAppDesign(config);
  const [widgetData, setWidgetData] = useState<Record<string, any>>({});
  const identity = useRef("");
  identity.current = `${base}:${user?.id || "guest"}`;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [active, setActive] = useState("overview");
  const [storedRows, setRows] = useState<Record<string, DataRecord[]>>({});
  const [loadedIdentity, setLoadedIdentity] = useState("");
  const rows = loadedIdentity === identity.current ? storedRows : {};
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState("updated_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [searchBusy, setSearchBusy] = useState(false);
  const searchGeneration = useRef(0);
  const currentScreen = useRef(active);
  currentScreen.current = active;
  const [editing, setEditing] = useState<{
    collection: Collection;
    record: DataRecord | null;
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [notifications, setNotifications] = useState<
    { id: string; message: string }[]
  >([]);
  const [viewOverride, setViewOverride] = useState<string | null>(null);
  const nav = config.navigation as Nav[];
  const selected = nav.find((n) => n.collectionId === active);
  const collection = collections.find((c) => c.id === active);
  // The overview's primary action follows the navigation the owner arranged, not the
  // order collections happen to arrive in: a button that says "New project" has to
  // create a project.
  const primaryNav = nav.find((n) =>
    collections.some((c) => c.id === n.collectionId),
  );
  const primary =
    collections.find((c) => c.id === primaryNav?.collectionId) ||
    collections[0];
  const primaryLabel =
    (primaryNav ?? nav[0])?.label.toLowerCase().replace(/s$/, "") || "record";
  const displayFields =
    collection?.fields.filter(
      (f) =>
        !selected?.visibleFields || selected.visibleFields.includes(f.name),
    ) || [];
  const mode = viewOverride || selected?.view || "table";
  const refresh = async () => {
    if (preview) return;
    const requestIdentity = identity.current;
    const requestSearchGeneration = searchGeneration.current;
    const loaded: Record<string, DataRecord[]> = {};
    const counts: Record<string, number> = {};
    for (const c of collections) {
      if (user || c.public_read) {
        const result = await api(`${base}/collections/${c.id}/query`, {
          limit: 100,
          ...(c.id === active
            ? {
                search: query,
                sort: { field: sortField, direction: sortDirection },
              }
            : {}),
        });
        loaded[c.id] = result.records;
        counts[c.id] = result.total;
      }
    }
    const metrics: Record<string, any> = {};
    for (const widget of design.widgets) {
      const c = collections.find((c) => c.id === widget.collectionId);
      if (!c || (!user && !c.public_read)) continue;
      try {
        metrics[widget.id] =
          widget.type === "recent"
            ? await api(`${base}/collections/${c.id}/query`, {
                limit: widget.limit,
                sort: { field: "updated_at", direction: "desc" },
              })
            : await api(`${base}/collections/${c.id}/summary`, {
                metrics: [
                  {
                    name: "value",
                    op: widget.type === "sum" ? "sum" : "count",
                    ...(widget.type === "sum" ? { field: widget.field } : {}),
                  },
                ],
                ...(widget.type === "group" ? { groupBy: widget.field } : {}),
              });
      } catch {
        metrics[widget.id] = { error: true };
      }
    }
    const updates = user
      ? await api<{ id: string; message: string }[]>(`${base}/notifications`)
      : [];
    if (mounted.current && identity.current === requestIdentity) {
      setLoadedIdentity(requestIdentity);
      setRows((previous) =>
        requestSearchGeneration === searchGeneration.current
          ? loaded
          : {
              ...loaded,
              [currentScreen.current]: previous[currentScreen.current] || [],
            },
      );
      setTotals((previous) =>
        requestSearchGeneration === searchGeneration.current
          ? counts
          : {
              ...counts,
              [currentScreen.current]: previous[currentScreen.current] || 0,
            },
      );
      setWidgetData(metrics);
      setNotifications(updates);
    }
  };
  useEffect(() => {
    setRows({});
    setTotals({});
    setWidgetData({});
    setNotifications([]);
    setEditing(null);
    setNotice("");
    setError("");
    void refresh().catch((e) => setError(e.message));
  }, [base, user?.id, collections, preview, JSON.stringify(design.widgets)]);
  useEffect(() => {
    if (active !== "activity" || !user || preview) return;
    let alive = true;
    const update = () =>
      api<{ id: string; message: string }[]>(`${base}/notifications`)
        .then((n) => {
          if (alive) setNotifications(n);
        })
        .catch((e) => alive && setError(e.message));
    void update();
    const timer = setInterval(() => void update(), 3000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [active, base, user?.id, preview]);
  useEffect(() => {
    const generation = ++searchGeneration.current;
    if (!collection || preview || (!user && !collection.public_read)) return;
    let alive = true;
    const expected = identity.current;
    setSearchBusy(true);
    const timer = setTimeout(() => {
      void api(`${base}/collections/${collection.id}/query`, {
        search: query,
        sort: { field: sortField, direction: sortDirection },
        limit: 100,
      })
        .then((result) => {
          if (
            alive &&
            identity.current === expected &&
            generation === searchGeneration.current
          ) {
            setLoadedIdentity(expected);
            setRows((all) => ({ ...all, [collection.id]: result.records }));
            setTotals((all) => ({ ...all, [collection.id]: result.total }));
          }
        })
        .catch((e) => {
          if (alive && identity.current === expected) setError(e.message);
        })
        .finally(() => {
          if (alive) setSearchBusy(false);
        });
    }, 220);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [base, user?.id, active, query, sortField, sortDirection, preview]);
  const visible = rows[active] || [];
  const total = Object.values(rows).reduce((n, rs) => n + rs.length, 0);
  const titles = nav.map((n) => ({
    ...n,
    count: totals[n.collectionId] || 0,
  }));
  const completed = Object.values(rows)
    .flat()
    .filter((r) =>
      Object.values(r.data).some(
        (v) =>
          typeof v === "string" &&
          ["done", "completed", "resolved", "won", "delivered"].includes(
            v.toLowerCase(),
          ),
      ),
    ).length;
  const changeStatus = async (r: DataRecord, status: string) => {
    if (!collection || !selected?.statusField) return;
    setBusy(true);
    try {
      await api(
        `${base}/collections/${collection.id}/records/${r.id}`,
        {
          data: { ...r.data, [selected.statusField]: status },
          version: r.version,
        },
        "PATCH",
      );
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const text = (r: DataRecord, f?: string) =>
    String(
      r.data[f || "title"] ??
        r.data.name ??
        Object.values(r.data)[0] ??
        "Untitled",
    );
  const recordCard = (r: DataRecord) => (
    <article className="work-card" key={r.id}>
      <div className="work-card-top">
        <span className="work-avatar">{text(r).slice(0, 2).toUpperCase()}</span>
        {r.canEdit && (
          <button
            aria-label={`Edit ${text(r)}`}
            onClick={() => setEditing({ collection: collection!, record: r })}
          >
            ↗
          </button>
        )}
      </div>
      <h3>{text(r)}</h3>
      {displayFields
        .filter((f) => !["title", "name"].includes(f.name))
        .slice(0, 3)
        .map((f) => (
          <p key={f.name}>
            <span>{selected?.fieldLabels?.[f.name] || f.label}</span>
            <strong>
              {f.type === "reference"
                ? referenceName(
                    f.referenceCollectionId,
                    String(r.data[f.name] || ""),
                  )
                : f.type === "file"
                  ? r.data[f.name]
                    ? "File attached"
                    : "—"
                  : String(r.data[f.name] ?? "—")}
            </strong>
          </p>
        ))}
      {r.canEdit && selected?.statusField && (
        <select
          aria-label={`Status for ${text(r)}`}
          value={String(r.data[selected.statusField] || "")}
          disabled={busy}
          onChange={(e) => void changeStatus(r, e.target.value)}
        >
          {collection?.fields
            .find((f) => f.name === selected.statusField)
            ?.options?.map((o) => (
              <option key={o}>{o}</option>
            ))}
        </select>
      )}
    </article>
  );
  function referenceName(id: string | undefined, value: string) {
    const r = rows[id || ""]?.find((r) => r.id === value);
    return r ? text(r) : value ? "Linked record" : "—";
  }
  const open = (id: string) => {
    setActive(id);
    setQuery("");
    setViewOverride(null);
    setError("");
  };
  return (
    <div
      className={`application-shell app-composition-shell app-${config.template} app-nav-${design.navigation} app-density-${design.density} app-layout-${design.layout || "dashboard"}`}
      style={designVariables(design) as React.CSSProperties}
    >
      <aside className="application-sidebar">
        <div className="application-brand">
          <span className="application-mark">
            {config.template === "crm"
              ? "↗"
              : config.template === "tracker"
                ? "◈"
                : "p"}
          </span>
          <strong>{project.name}</strong>
        </div>
        <div className="workspace-switch">
          <span className="work-avatar">
            {project.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <strong>{config.title}</strong>
            <small>Workspace</small>
          </div>
          <ChevronRight size={15} />
        </div>
        <small className="application-nav-label">WORKSPACE</small>
        <button
          className={active === "overview" ? "active" : ""}
          onClick={() => open("overview")}
        >
          <LayoutDashboard size={17} />
          Overview
        </button>
        {nav.map((n, i) => (
          <button
            key={n.collectionId}
            className={active === n.collectionId ? "active" : ""}
            onClick={() => open(n.collectionId)}
          >
            {i === 0 ? (
              <FolderKanban size={17} />
            ) : i === 1 ? (
              <Users size={17} />
            ) : (
              <FileText size={17} />
            )}{" "}
            {n.label}
            <small>{rows[n.collectionId]?.length || 0}</small>
          </button>
        ))}
        <small className="application-nav-label">PERSONAL</small>
        <button
          className={active === "files" ? "active" : ""}
          onClick={() => open("files")}
        >
          <FileText size={17} />
          Files
        </button>
        <button
          className={active === "activity" ? "active" : ""}
          onClick={() => open("activity")}
        >
          <Bell size={17} />
          Activity<small>{notifications.length}</small>
        </button>
        <div className="application-sidebar-bottom">
          <span className="work-avatar">
            {user?.name?.slice(0, 2).toUpperCase() || "ME"}
          </span>
          <div>
            <strong>{user?.name || "Your account"}</strong>
            <small>{user?.email || "Sign in to get started"}</small>
          </div>
          {user && !preview && (
            <button
              aria-label="Sign out"
              onClick={async () => {
                try {
                  await api("/api/member-auth/sign-out", {});
                  await onSession();
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>
      <main className="application-main">
        <header className="application-topbar">
          <span>
            Workspace <ChevronRight size={13} />{" "}
            {selected?.label ||
              active.charAt(0).toUpperCase() + active.slice(1)}
          </span>
          <div>
            <span className="live-status">
              {preview ? "Design preview" : "Connected"}
            </span>
            <button aria-label="View activity" onClick={() => open("activity")}>
              <Bell size={17} />
            </button>
          </div>
        </header>
        <div className="application-content">
          {preview && (
            <p className="preview-banner">
              App design preview. Publish locally to use accounts, records, and
              workflows.
            </p>
          )}
          {error && (
            <p className="backend-error" role="alert">
              {error}
            </p>
          )}
          {notice && <p role="status">{notice}</p>}
          {!user && !preview ? (
            <section className="app-welcome">
              <span className="app-eyebrow">WELCOME TO YOUR WORKSPACE</span>
              <h1>{config.title}</h1>
              <p>{config.description}</p>
              <AccountForm
                member
                onDone={() =>
                  void onSession().catch((e) => setError(e.message))
                }
              />
            </section>
          ) : (
            <>
              {active === "overview" && (
                <>
                  <AppOverviewLayout
                    layout={design.layout}
                    slots={{
                      heading: (
                        <div className="app-page-heading">
                          <div>
                            <span className="app-eyebrow">
                              YOUR WORK, IN ONE PLACE
                            </span>
                            <h1>{design.heading}</h1>
                            <p>{config.description}</p>
                          </div>
                          {primary && (
                            <button
                              className="app-primary"
                              disabled={preview || !primary.member_create}
                              onClick={() =>
                                setEditing({
                                  collection: primary,
                                  record: null,
                                })
                              }
                            >
                              <Plus size={16} />
                              New {primaryLabel}
                            </button>
                          )}
                        </div>
                      ),
                      widgets:
                        design.widgets.length > 0 ? (
                          <div className="app-dashboard-widgets">
                            {design.widgets.map((w) => {
                              const result = widgetData[w.id];
                              const groups = result?.groups || [];
                              return (
                                <section
                                  className={`app-panel app-widget app-widget-${w.type}`}
                                  key={w.id}
                                >
                                  <div className="app-section-heading">
                                    <h2>{w.title}</h2>
                                    <button
                                      onClick={() => open(w.collectionId)}
                                    >
                                      Open ↗
                                    </button>
                                  </div>
                                  {result?.error ? (
                                    <p>Unable to load this widget.</p>
                                  ) : !result ? (
                                    <p>
                                      {preview
                                        ? "Publish to connect live data."
                                        : "Loading…"}
                                    </p>
                                  ) : w.type === "recent" ? (
                                    result.records.length ? (
                                      result.records.map((r: DataRecord) => (
                                        <button
                                          className="recent-row"
                                          key={r.id}
                                          onClick={() => open(w.collectionId)}
                                        >
                                          <span className="work-avatar">
                                            {text(r).slice(0, 2).toUpperCase()}
                                          </span>
                                          <strong>{text(r)}</strong>
                                          <ChevronRight size={14} />
                                        </button>
                                      ))
                                    ) : (
                                      <p>No records yet.</p>
                                    )
                                  ) : w.type === "group" ? (
                                    groups.length ? (
                                      groups.slice(0, w.limit).map((g: any) => (
                                        <div
                                          className="app-chart-row"
                                          key={g.key ?? "empty"}
                                        >
                                          <span>
                                            {String(g.key ?? "Unspecified")}
                                          </span>
                                          <strong>{g.metrics.value}</strong>
                                          <div
                                            style={{
                                              width: `${Math.max(2, (100 * g.metrics.value) / Math.max(1, ...groups.map((x: any) => x.metrics.value)))}%`,
                                            }}
                                          />
                                        </div>
                                      ))
                                    ) : (
                                      <p>No records yet.</p>
                                    )
                                  ) : (
                                    <strong className="app-widget-number">
                                      {Number(
                                        groups[0]?.metrics.value || 0,
                                      ).toLocaleString()}
                                    </strong>
                                  )}
                                  <small className="app-widget-caption">
                                    {w.type === "recent"
                                      ? "Latest accessible records"
                                      : "All accessible records"}
                                  </small>
                                </section>
                              );
                            })}
                          </div>
                        ) : null,
                      stats: (
                        <div className="app-stats">
                          {titles.slice(0, 3).map((t) => (
                            <button
                              key={t.collectionId}
                              onClick={() => open(t.collectionId)}
                            >
                              <span>{t.label}</span>
                              <strong>{t.count}</strong>
                              <small>
                                View all <ArrowUpRight size={13} />
                              </small>
                            </button>
                          ))}
                          <div>
                            <span>Completed</span>
                            <strong>{completed}</strong>
                            <small>
                              <CheckCircle2 size={13} />
                              Within loaded records
                            </small>
                          </div>
                        </div>
                      ),
                      recent: (
                        <section className="app-panel">
                          <div className="app-section-heading">
                            <div>
                              <h2>Recent work</h2>
                              <p>Your latest updates, ready to pick up.</p>
                            </div>
                            <button
                              onClick={() =>
                                open(nav[0]?.collectionId || "overview")
                              }
                            >
                              View all ↗
                            </button>
                          </div>
                          {Object.values(rows).flat().length ? (
                            Object.entries(rows)
                              .flatMap(([id, rs]) =>
                                rs.slice(0, 3).map((r) => (
                                  <button
                                    className="recent-row"
                                    key={r.id}
                                    onClick={() => open(id)}
                                  >
                                    <span className="work-avatar">
                                      {text(r).slice(0, 2).toUpperCase()}
                                    </span>
                                    <span>
                                      <strong>{text(r)}</strong>
                                      <small>
                                        {
                                          collections.find((c) => c.id === id)
                                            ?.name
                                        }
                                      </small>
                                    </span>
                                    <ChevronRight size={16} />
                                  </button>
                                )),
                              )
                              .slice(0, 6)
                          ) : (
                            <div className="app-empty">
                              <FolderKanban size={34} />
                              <h3>Ready for your first project</h3>
                              <p>
                                Create a record to start. Your data will appear
                                here as you work.
                              </p>
                              <button
                                disabled={preview || !primary?.member_create}
                                onClick={() =>
                                  setEditing({
                                    collection: primary,
                                    record: null,
                                  })
                                }
                              >
                                Create your first record →
                              </button>
                            </div>
                          )}
                        </section>
                      ),
                      actions: (
                        <section className="app-highlight">
                          <span className="app-eyebrow">MAKE IT YOURS</span>
                          <h2>
                            A home for
                            <br />
                            what’s next.
                          </h2>
                          <p>
                            Keep the details together. Track progress, share
                            context, and turn a request into a finished piece of
                            work.
                          </p>
                          <div className="app-art">
                            <span />
                            <span />
                            <span />
                          </div>
                          <button
                            onClick={() =>
                              open(
                                nav[1]?.collectionId ||
                                  nav[0]?.collectionId ||
                                  "overview",
                              )
                            }
                          >
                            Explore your workspace <ArrowUpRight size={16} />
                          </button>
                        </section>
                      ),
                    }}
                  />
                  <p className="app-footnote">
                    {total} records loaded · Dashboard widgets and collection
                    search include all accessible records.
                  </p>
                </>
              )}
              {collection && (
                <>
                  <div className="app-page-heading">
                    <div>
                      <span className="app-eyebrow">
                        WORKSPACE / {selected?.label.toUpperCase()}
                      </span>
                      <h1>{selected?.label}</h1>
                      <p>
                        {collection.public_read
                          ? "Shared publicly."
                          : "A focused view of the records you can access."}
                      </p>
                    </div>
                    <button
                      className="app-primary"
                      disabled={preview || !collection.member_create}
                      onClick={() => setEditing({ collection, record: null })}
                    >
                      <Plus size={16} />
                      Add record
                    </button>
                  </div>
                  <div className="app-data-toolbar">
                    <label>
                      <Search size={16} />
                      <input
                        aria-label="Search records"
                        placeholder={`Search ${selected?.label.toLowerCase()}…`}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                    <div>
                      <select
                        aria-label="Sort records"
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value)}
                      >
                        <option value="updated_at">Recently updated</option>
                        <option value="created_at">Date created</option>
                        {collection.fields
                          .filter(
                            (f) => !["file", "reference"].includes(f.type),
                          )
                          .map((f) => (
                            <option key={f.name} value={f.name}>
                              {f.label}
                            </option>
                          ))}
                      </select>
                      <button
                        aria-label="Toggle sort direction"
                        onClick={() =>
                          setSortDirection((d) =>
                            d === "asc" ? "desc" : "asc",
                          )
                        }
                      >
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </button>
                      <button
                        aria-label="Table view"
                        onClick={() => setViewOverride("table")}
                      >
                        <List size={16} />
                      </button>
                      <button
                        aria-label="Card view"
                        onClick={() => setViewOverride("cards")}
                      >
                        <Columns3 size={16} />
                      </button>
                      <button
                        disabled={preview}
                        onClick={() =>
                          void refresh().catch((e) => setError(e.message))
                        }
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                  <p className="app-footnote" aria-live="polite">
                    {searchBusy
                      ? "Searching…"
                      : `${totals[active] || 0} matching records · ${visible.length} displayed`}
                  </p>
                  {mode === "board" && selected?.statusField ? (
                    <div className="app-board">
                      {collection.fields
                        .find((f) => f.name === selected.statusField)
                        ?.options?.map((status) => (
                          <section className="app-board-column" key={status}>
                            <h3>
                              <span
                                className={`status-dot status-${status.toLowerCase().replace(/\W/g, "-")}`}
                              />
                              {status}
                              <small>
                                {
                                  visible.filter(
                                    (r) =>
                                      r.data[selected.statusField!] === status,
                                  ).length
                                }
                              </small>
                            </h3>
                            {visible
                              .filter(
                                (r) => r.data[selected.statusField!] === status,
                              )
                              .map(recordCard)}
                            {!visible.some(
                              (r) => r.data[selected.statusField!] === status,
                            ) && <p className="board-empty">No items yet</p>}
                          </section>
                        ))}
                    </div>
                  ) : mode === "cards" ? (
                    <div className="app-record-grid">
                      {visible.map(recordCard)}
                    </div>
                  ) : (
                    <div className="app-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            {displayFields.map((f) => (
                              <th key={f.name}>
                                {selected?.fieldLabels?.[f.name] || f.label}
                              </th>
                            ))}
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visible.map((r) => (
                            <tr key={r.id}>
                              {displayFields.map((f) => (
                                <td key={f.name}>
                                  {f.type === "enum" ? (
                                    <span className="app-status-pill">
                                      {String(r.data[f.name] ?? "—")}
                                    </span>
                                  ) : f.type === "reference" ? (
                                    referenceName(
                                      f.referenceCollectionId,
                                      String(r.data[f.name] || ""),
                                    )
                                  ) : f.type === "file" ? (
                                    r.data[f.name] ? (
                                      <a
                                        href={`${base}/files/${r.data[f.name]}`}
                                      >
                                        Download file ↗
                                      </a>
                                    ) : (
                                      "—"
                                    )
                                  ) : (
                                    String(r.data[f.name] ?? "—")
                                  )}
                                </td>
                              ))}
                              <td>
                                {r.canEdit && (
                                  <button
                                    aria-label={`Edit ${text(r)}`}
                                    onClick={() =>
                                      setEditing({ collection, record: r })
                                    }
                                  >
                                    Edit ↗
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {(rows[active]?.length || 0) < (totals[active] || 0) && (
                    <button
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        const expected = identity.current;
                        try {
                          const generation = searchGeneration.current;
                          const result = await api(
                            `${base}/collections/${active}/query`,
                            {
                              search: query,
                              sort: {
                                field: sortField,
                                direction: sortDirection,
                              },
                              offset: rows[active].length,
                              limit: 100,
                            },
                          );
                          const more: DataRecord[] = result.records;
                          if (generation !== searchGeneration.current) return;
                          if (identity.current === expected)
                            setRows((all) => ({
                              ...all,
                              [active]: [...all[active], ...more],
                            }));
                          if (!more.length) setNotice("All records loaded.");
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Load more records
                    </button>
                  )}
                  {!visible.length && (
                    <div className="app-empty">
                      <h3>
                        {query
                          ? "No matching records"
                          : "Start with one useful thing"}
                      </h3>
                      <p>
                        {query
                          ? "Try another search."
                          : "Add your first record. Every field is connected to your app’s database."}
                      </p>
                    </div>
                  )}
                </>
              )}
              {active === "files" &&
                (preview ? (
                  <div className="app-empty">
                    <h2>Private file library</h2>
                    <p>Uploads become available in your published app.</p>
                  </div>
                ) : (
                  <RuntimeFiles key={`${base}:${user?.id}`} base={base} />
                ))}
              {active === "activity" && (
                <section className="app-panel">
                  <h1>Activity</h1>
                  <p>Updates from your app’s workflows.</p>
                  {notifications.length ? (
                    notifications.map((n) => (
                      <div className="recent-row" key={n.id}>
                        <Bell size={16} />
                        <p>{n.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="app-empty">
                      <h3>You’re all caught up</h3>
                      <p>Workflow notifications will appear here.</p>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </main>
      {editing && (
        <div className="modal-backdrop">
          <section
            className="app-record-modal"
            role="dialog"
            aria-modal="true"
            aria-label={editing.record ? "Edit record" : "New record"}
          >
            <div className="backend-actions">
              <div>
                <span className="app-eyebrow">{editing.collection.name}</span>
                <h2>
                  {editing.record
                    ? "Edit record"
                    : "Make room for something new"}
                </h2>
              </div>
              <button disabled={busy} onClick={() => setEditing(null)}>
                Close
              </button>
            </div>
            <form
              className="backend-form"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                try {
                  const data = formRecordData(
                    editing.collection,
                    e.currentTarget,
                  );
                  await api(
                    `${base}/collections/${editing.collection.id}/records${editing.record ? "/" + editing.record.id : ""}`,
                    editing.record
                      ? { data, version: editing.record.version }
                      : { data },
                    editing.record ? "PATCH" : "POST",
                  );
                  setEditing(null);
                  await refresh();
                  setNotice("Saved to your app.");
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <RecordFields
                fields={editing.collection.fields}
                base={base}
                record={editing.record}
              />
              {error && <p role="alert">{error}</p>}
              <div className="backend-actions">
                <button className="app-primary" disabled={busy}>
                  {busy ? "Saving…" : "Save record"}
                </button>
                {editing.record && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      if (
                        !(await confirmDialog("Delete this record?", {
                          confirmLabel: "Delete",
                          danger: true,
                        }))
                      )
                        return;
                      setBusy(true);
                      try {
                        await api(
                          `${base}/collections/${editing.collection.id}/records/${editing.record!.id}`,
                          { version: editing.record!.version },
                          "DELETE",
                        );
                        setEditing(null);
                        await refresh();
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Delete record
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
