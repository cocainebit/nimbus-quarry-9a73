import { confirmDialog } from "./dialogs";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import {
  ArrowUpRight,
  ArrowUp,
  Plus,
  Search,
  Layers,
  LayoutGrid,
  Sparkles,
  Copy,
  Trash2,
  X,
  Folder,
  LayoutTemplate,
  SlidersHorizontal,
  RefreshCw,
  Import,
  LogIn,
  LogOut,
} from "lucide-react";
import { demoProject, normalizeProject, type Project } from "./model";
import { SitePage } from "./blocks";
const Editor = lazy(() => import("./Editor"));
const NativeTemplateEditor = lazy(() => import("./NativeTemplateEditor"));
import SourceTemplateCatalogue from "./SourceTemplateCatalogue";
import { sourceTemplates } from "../shared/source-templates.mjs";
import { useProjects } from "./storage";
import AccountForm from "./AccountForm";
import RotatingPlaceholder from "./RotatingPlaceholder";
import AccountChip from "./AccountChip";
const SettingsPage = lazy(() => import("./Settings"));
import AppCatalogue from "./AppCatalogue";
import { api } from "./backend-api";
import {
  websiteStarters,
  inferWebsiteStarter,
} from "../shared/website-starters.mjs";
type ProjectType = "website" | "portal" | "crm" | "tracker";
function inferProjectType(value: string): ProjectType {
  const text = value.slice(0, 6000).toLowerCase();
  if (/\b(crm|sales pipeline|leads|customer relationships)\b/.test(text))
    return "crm";
  if (/\b(client portal|customer portal|client workspace)\b/.test(text))
    return "portal";
  if (
    /\b(task|tasks|project tracker|workspace|kanban|project management|dashboard|todo|application|app)\b/.test(
      text,
    )
  )
    return "tracker";
  return "website";
}

// The composer's placeholder lines: the app's own starter copy, one at a time.
const composerPrompts = [
  "A website for an architecture studio that designs thoughtful, sustainable spaces…",
  "A productivity platform for creative teams…",
  "A client portal for projects, requests and documents…",
  "An independent wellness studio helping people slow down…",
];
const starters = [
  {
    name: "Architecture studio",
    brief:
      "A considered architecture studio creating thoughtful homes. Editorial, warm and minimal. Pages: Home, Projects, Studio, Contact.",
  },
  {
    name: "SaaS startup",
    brief:
      "A productivity platform for creative teams. Clear, confident and approachable. Pages: Home, Features, Pricing, Contact.",
  },
  {
    name: "Wellness brand",
    brief:
      "An independent wellness studio helping people slow down. Calm and welcoming. Pages: Home, Our approach, Classes, Contact.",
  },
];
export default function App() {
  const {
    projects,
    setProjects,
    ready,
    storageError,
    saving,
    workspace,
    user,
    connectServer,
    disconnect,
    importLocal,
    removeProject,
    retry,
    saveNow,
  } = useProjects();
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountMenu, setAccountMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!accountMenu) return;
    accountMenuRef.current
      ?.querySelector<HTMLButtonElement>(".account-menu button")
      ?.focus();
    const away = (e: PointerEvent) => {
      if (!accountMenuRef.current?.contains(e.target as Node))
        setAccountMenu(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAccountMenu(false);
      accountMenuRef.current
        ?.querySelector<HTMLButtonElement>(".profile")
        ?.focus();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
    };
  }, [accountMenu]);
  const [accountError, setAccountError] = useState("");
  const [importError, setImportError] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [brief, setBrief] = useState("");
  const [name, setName] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("website");
  const [typeChosen, setTypeChosen] = useState(false);
  const [websiteStarter, setWebsiteStarter] = useState("studio");
  const [starterChosen, setStarterChosen] = useState(false);
  const [pendingCreation, setPendingCreation] = useState<{
    type: Exclude<ProjectType, "website">;
    name: string;
    brief: string;
  } | null>(null);
  const pendingCatalogue = useRef<(() => Promise<void>) | null>(null);
  const connecting = useRef(false);
  const [mode, setMode] = useState<"demo" | "ai">("demo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [connected, setConnected] = useState(false);
  const [providerName, setProviderName] = useState("AI provider");
  const [view, setView] = useState("projects");
  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => {
        setConnected(d.configured && d.reachable && d.modelInstalled);
        setProviderName(d.provider || "AI provider");
      })
      .catch(() => {});
  }, []);
  const project = projects.find((p) => p.id === active);
  const save = (p: Project) =>
    setProjects((all) =>
      all.map((item) =>
        item.id === p.id ? { ...p, updated: new Date().toISOString() } : item,
      ),
    );
  function browseOriginals() {
    setView("templates");
    requestAnimationFrame(() =>
      document
        .querySelector(".source-collection")
        ?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );
  }
  function start(prefill = "", selectedType?: ProjectType) {
    setBrief(prefill);
    setName("");
    setError("");
    setProjectType(selectedType || inferProjectType(prefill));
    setTypeChosen(Boolean(selectedType));
    setWebsiteStarter(inferWebsiteStarter(prefill));
    setStarterChosen(false);
    setModal(true);
  }
  async function installApp(intent: {
    type: Exclude<ProjectType, "website">;
    name: string;
    brief: string;
  }) {
    const result = await api<{ project: Project }>(
      `/api/catalog/${intent.type}/install`,
      { name: intent.name },
    );
    await connectServer();
    setProjects((all) =>
      all.map((p) =>
        p.id === result.project.id ? { ...p, brief: intent.brief } : p,
      ),
    );
    setActive(result.project.id);
    setModal(false);
    setPendingCreation(null);
  }
  // Returning from the shared account sign-in: open the server workspace for the new session.
  useEffect(() => {
    if (!ready) return;
    const url = new URL(location.href);
    if (url.searchParams.get("shared-account") !== "1") return;
    url.searchParams.delete("shared-account");
    history.replaceState(null, "", url);
    void finishAccount();
  }, [ready]);
  async function finishAccount() {
    if (connecting.current) return;
    connecting.current = true;
    setAccountError("");
    try {
      await connectServer();
      if (pendingCreation) await installApp(pendingCreation);
      if (pendingCatalogue.current) {
        const resume = pendingCatalogue.current;
        await resume();
        pendingCatalogue.current = null;
      }
      setAccountOpen(false);
    } catch (e) {
      setAccountError((e as Error).message);
    } finally {
      connecting.current = false;
    }
  }
  async function create() {
    if (!name.trim() || brief.trim().length < 10) {
      setError("Add a project name and a brief of at least 10 characters.");
      return;
    }
    if (projectType !== "website" && workspace !== "server") {
      setPendingCreation({
        type: projectType,
        name: name.trim(),
        brief: brief.trim(),
      });
      setModal(false);
      setAccountError("");
      setAccountOpen(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (projectType !== "website") {
        await installApp({
          type: projectType,
          name: name.trim(),
          brief: brief.trim(),
        });
        return;
      }
      let p: Project;
      if (mode === "demo")
        p = demoProject(name.trim(), brief.trim(), websiteStarter);
      // Paid actions ask for their payment through api(), which opens the
      // payment sheet and runs the request again once the charge is paid.
      else p = await api<Project>("/api/generate", { name, brief });
      p = normalizeProject(p);
      setProjects((all) => [p, ...all]);
      setActive(p.id);
      setModal(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create project.");
    } finally {
      setBusy(false);
    }
  }
  async function importProject(file?: File) {
    if (!file) return;
    try {
      if (file.size > 30_000_000)
        throw new Error("Project file is too large (30 MB maximum).");
      const p = normalizeProject(JSON.parse(await file.text()));
      p.id = crypto.randomUUID();
      p.name += " (imported)";
      setProjects((all) => [p, ...all]);
      setActive(p.id);
      setImportError("");
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Invalid project file.");
    }
  }
  if (!ready)
    return (
      <div className="loading">
        {storageError || "Loading your saved projects…"}
      </div>
    );
  if (project)
    return (
      <>
        <Suspense
          fallback={<div className="loading">Opening your workspace…</div>}
        >
          {project.nativeTemplate ? (
            <NativeTemplateEditor
              project={project}
              saveStatus={
                storageError ? "Not saved" : saving ? "Saving…" : "Saved"
              }
              onChange={save}
              onBack={() => setActive(null)}
            />
          ) : (
            <Editor
              key={project.id}
              project={project}
              saveStatus={
                storageError ? "Not saved" : saving ? "Saving…" : "Saved"
              }
              onChange={save}
              onBack={() => setActive(null)}
            />
          )}
        </Suspense>
        {storageError && (
          <div className="storage-error" role="alert">
            {storageError} <button onClick={retry}>Retry saving</button>
          </div>
        )}
      </>
    );
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-head">
          <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
            <span className="brand-mark">
              <Layers size={15} />
            </span>
            Plotform<span className="beta">BETA</span>
          </a>
          <button className="primary sidebar-create" onClick={() => start()}>
            <Plus size={16} />
            Create project
          </button>
        </div>
        <label className="sidebar-search">
          <Search size={16} />
          <input
            aria-label="Find a project"
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setView("projects");
            }}
          />
        </label>
        <nav className="sidebar-nav" aria-label="Workspace">
          <button
            className={view === "projects" ? "nav-item selected" : "nav-item"}
            onClick={() => setView("projects")}
          >
            <Folder size={16} />
            All projects<span>{projects.length}</span>
          </button>
          <button
            className={view === "templates" ? "nav-item selected" : "nav-item"}
            onClick={() => setView("templates")}
          >
            <LayoutTemplate size={16} />
            Starter templates
          </button>
          <button
            className={view === "settings" ? "nav-item selected" : "nav-item"}
            onClick={() => setView("settings")}
          >
            <SlidersHorizontal size={16} />
            Settings
          </button>
        </nav>
        <div className="sidebar-bottom" ref={accountMenuRef}>
          {workspace === "server" && <AccountChip userId={user?.id} />}
          {accountMenu && (
            <div
              className="account-menu"
              role="group"
              aria-label="Your workspace"
            >
              <div className="account-menu-head">
                <span className="avatar dark">
                  {(user?.email || "You").slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <strong>{user?.email || "Your workspace"}</strong>
                  <small>
                    {workspace === "server"
                      ? "Server saving enabled"
                      : "Local drafts"}
                  </small>
                </div>
              </div>
              <div className="account-menu-group">
                {workspace === "server" ? (
                  <>
                    <button
                      onClick={() => {
                        setAccountMenu(false);
                        setAccountError("");
                        void saveNow()
                          .then(() => connectServer())
                          .catch((e) => {
                            setAccountError(e.message);
                            setAccountOpen(true);
                          });
                      }}
                    >
                      <RefreshCw size={16} />
                      Save and refresh projects
                    </button>
                    <button
                      onClick={() => {
                        setAccountMenu(false);
                        setAccountError("");
                        void importLocal().catch((e) => {
                          setAccountError(e.message);
                          setAccountOpen(true);
                        });
                      }}
                    >
                      <Import size={16} />
                      Import local drafts as copies
                    </button>
                  </>
                ) : (
                  <button
                    className="accent"
                    onClick={() => {
                      setAccountMenu(false);
                      setAccountError("");
                      setAccountOpen(true);
                    }}
                  >
                    <LogIn size={16} />
                    Sign in
                  </button>
                )}
                <button
                  onClick={() => {
                    setAccountMenu(false);
                    setView("settings");
                  }}
                >
                  <SlidersHorizontal size={16} />
                  Settings
                </button>
              </div>
              {workspace === "server" && (
                <div className="account-menu-group">
                  <button
                    onClick={() => {
                      setAccountMenu(false);
                      void disconnect().catch((e) => {
                        setAccountError(e.message);
                        setAccountOpen(true);
                      });
                    }}
                  >
                    <LogOut size={16} />
                    Save and sign out
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            className="profile"
            aria-label="Account & server projects"
            aria-haspopup="true"
            aria-expanded={accountMenu}
            title={
              workspace === "server"
                ? "Projects save to your account on this server."
                : "Projects save in this browser. Sign in to sync them with your account."
            }
            onClick={() => setAccountMenu((open) => !open)}
          >
            <span className="avatar dark">
              {(user?.email || "You").slice(0, 2).toUpperCase()}
            </span>
            <span className="profile-name">
              {user?.email || "Your workspace"}
            </span>
            <span className="profile-plan">
              {workspace === "server" ? "Server" : "Local"}
            </span>
            <span className="profile-status">
              {workspace === "server"
                ? "Server saving enabled"
                : "Local drafts"}
            </span>
          </button>
        </div>
      </aside>
      <main className="dashboard-main">
        <div className="dashboard-content">
          {view === "settings" && (
            <Suspense
              fallback={<p className="settings-loading">Loading settings…</p>}
            >
              <SettingsPage onOpenAccount={() => setAccountOpen(true)} />
            </Suspense>
          )}
          {view !== "settings" && (
            <>
              <section className="dash-hero">
                <h1>
                  Build a working app.
                  <br />
                  Design a distinctive website.
                </h1>
                <p className="intro">
                  Build portals, CRMs, and workspaces with real databases. For
                  websites, choose from {sourceTemplates.length} original
                  open-source designs and edit their actual source.
                </p>
                <div className="brief-composer">
                  <div className="composer-label">
                    <Sparkles size={17} /> What are we creating?
                  </div>
                  <div className="composer-field">
                    <textarea
                      aria-label="Website brief"
                      value={brief}
                      onChange={(e) => setBrief(e.target.value)}
                      maxLength={6000}
                    />
                    <RotatingPlaceholder
                      hidden={Boolean(brief)}
                      phrases={composerPrompts}
                    />
                  </div>
                  <div className="composer-footer">
                    <span>Start with a brief. Shape every detail.</span>
                    <button className="secondary" onClick={browseOriginals}>
                      Create a website <ArrowUp size={16} />
                    </button>
                    <button
                      className="primary"
                      onClick={() =>
                        start(
                          brief,
                          inferProjectType(brief) === "website"
                            ? "tracker"
                            : inferProjectType(brief),
                        )
                      }
                    >
                      Build an app <ArrowUp size={16} />
                    </button>
                  </div>
                </div>
                <span className="mini-label">
                  YOUR NEXT APP OR WEBSITE STARTS HERE ↗
                </span>
                <div className="starter-row">
                  <button onClick={browseOriginals}>
                    Browse original source templates <ArrowUpRight size={13} />
                  </button>
                  <button onClick={() => start(brief, "website")}>
                    Build with editable blocks
                  </button>
                </div>
              </section>
            </>
          )}
          {view === "templates" && (
            <>
              <SourceTemplateCatalogue
                onCreated={(created) => {
                  setProjects((all) => [created, ...all]);
                  setActive(created.id);
                }}
              />
              {workspace !== "server" && (
                <p className="catalog-account-note">
                  App starters include a working database and member accounts.{" "}
                  <button
                    className="secondary"
                    onClick={() => setAccountOpen(true)}
                  >
                    Sign in to create an app
                  </button>
                </p>
              )}
              <AppCatalogue
                onSignIn={
                  workspace === "server"
                    ? undefined
                    : (resume?: () => Promise<void>) => {
                        pendingCatalogue.current = resume || null;
                        setAccountError("");
                        setAccountOpen(true);
                      }
                }
                onInstalled={async (installed) => {
                  await connectServer();
                  setActive(installed.id);
                }}
              />
            </>
          )}
          {view === "projects" && (
            <section className="project-section">
              <div className="section-header">
                <div>
                  <h2>
                    {view === "projects"
                      ? "Your projects"
                      : "Marketing website starters"}{" "}
                    <span>
                      {view === "projects" ? projects.length : starters.length}
                    </span>
                  </h2>
                  <p>
                    {view === "projects"
                      ? "Pick up where inspiration left off."
                      : "A starting point, ready to make your own."}
                  </p>
                </div>
                {view === "projects" && (
                  <div className="project-actions">
                    <label className="secondary import-button">
                      Import project
                      <input
                        type="file"
                        accept="application/json,.json"
                        aria-label="Import project"
                        onChange={(e) =>
                          void importProject(e.target.files?.[0])
                        }
                      />
                    </label>
                    <label className="search">
                      <Search size={16} />
                      <input
                        aria-label="Search projects"
                        placeholder="Search projects"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                    <button className="icon-btn" title="Grid view">
                      <LayoutGrid size={17} />
                    </button>
                    <button className="secondary" onClick={() => start()}>
                      <Plus size={16} />
                      New project
                    </button>
                  </div>
                )}
              </div>
              {importError && (
                <p className="error" role="alert">
                  {importError}
                </p>
              )}
              <div className="project-grid">
                {view === "projects" ? (
                  <>
                    {projects
                      .filter((p) =>
                        p.name.toLowerCase().includes(search.toLowerCase()),
                      )
                      .map((p) => (
                        <article className="project-card" key={p.id}>
                          <button
                            className="project-preview"
                            onClick={() => setActive(p.id)}
                            aria-label={`Open ${p.name}`}
                          >
                            <span className="project-tile">
                              <div className="mini-site">
                                {p.nativeTemplate ? (
                                  <img
                                    alt={`${p.name} source design`}
                                    src={`/templates/${p.nativeTemplate.id}/plotform-preview.jpg`}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      objectPosition: "top",
                                      pointerEvents: "none",
                                    }}
                                  />
                                ) : (
                                  <SitePage project={p} page={p.pages[0]} />
                                )}
                              </div>
                            </span>
                            <span
                              className="project-swatch"
                              style={{ background: p.theme.accent }}
                            />
                            <span className="preview-open">
                              Open project <ArrowUpRight size={15} />
                            </span>
                          </button>
                          <div className="project-meta">
                            <div>
                              <span className="project-kind">
                                {p.app ? (
                                  <LayoutGrid size={14} />
                                ) : (
                                  <LayoutTemplate size={14} />
                                )}
                              </span>
                              <button
                                className="text-btn"
                                onClick={() => setActive(p.id)}
                              >
                                {p.name}
                              </button>
                              <small>
                                {p.pages.length} pages <span>·</span>{" "}
                                {p.nativeTemplate
                                  ? "Original source template"
                                  : p.app
                                    ? "Working app"
                                    : p.source === "demo"
                                      ? "Curated website"
                                      : "AI generated"}
                              </small>
                            </div>
                            <div className="card-actions">
                              <button
                                className="icon-btn"
                                title={`Duplicate ${p.name}`}
                                onClick={async () => {
                                  if (p.app) {
                                    try {
                                      if (workspace === "server")
                                        await saveNow();
                                      const result = await api<{
                                        project: Project;
                                      }>(`/api/projects/${p.id}/duplicate`, {});
                                      await connectServer();
                                      setActive(result.project.id);
                                    } catch (e) {
                                      setImportError((e as Error).message);
                                    }
                                    return;
                                  }
                                  const copy = structuredClone(p);
                                  copy.id = crypto.randomUUID();
                                  copy.name += " copy";
                                  setProjects((all) => [copy, ...all]);
                                }}
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                className="icon-btn"
                                title={`Delete ${p.name}`}
                                onClick={async () => {
                                  if (
                                    await confirmDialog(
                                      workspace === "server"
                                        ? `Archive ${p.name}? Its published app will go offline; its data will be retained.`
                                        : `Delete ${p.name}? Export it first if you want a backup.`,
                                      {
                                        confirmLabel:
                                          workspace === "server"
                                            ? "Archive"
                                            : "Delete",
                                        danger: true,
                                      },
                                    )
                                  )
                                    void removeProject(p.id).catch((e) =>
                                      setImportError(e.message),
                                    );
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    {!search && (
                      <button className="new-card" onClick={() => start()}>
                        <span>
                          <Plus size={25} />
                        </span>
                        <strong>A blank canvas. Endless possibilities.</strong>
                        <small>Create a new project</small>
                      </button>
                    )}
                    {search &&
                      !projects.some((p) =>
                        p.name.toLowerCase().includes(search.toLowerCase()),
                      ) && <p>No projects match “{search}”.</p>}
                  </>
                ) : (
                  starters.map((s) => (
                    <button
                      className="template-card"
                      key={s.name}
                      onClick={() => start(s.brief)}
                    >
                      <LayoutTemplate size={28} />
                      <h3>{s.name}</h3>
                      <p>{s.brief}</p>
                      <span>
                        Use template <ArrowUpRight size={16} />
                      </span>
                    </button>
                  ))
                )}
              </div>
            </section>
          )}
          <div className="workflow-note">
            <span>
              <Layers size={18} /> One idea, all the way through.
            </span>
            <div>
              01 Brief <i>→</i> 02 Sitemap <i>→</i> 03 Wireframes <i>→</i> 04
              Design
            </div>
          </div>
        </div>
      </main>
      {storageError && (
        <div className="storage-error" role="alert">
          {storageError}
        </div>
      )}
      {accountOpen && (
        <div className="modal-backdrop">
          <section
            className={
              workspace === "server"
                ? "backend-panel"
                : "backend-panel auth-panel"
            }
            role="dialog"
            aria-modal="true"
            aria-label="Account and server projects"
          >
            <div className="backend-actions">
              <h2>Your workspace</h2>
              <button
                onClick={() => {
                  setAccountOpen(false);
                  if (pendingCreation) {
                    setPendingCreation(null);
                    setModal(true);
                  }
                  pendingCatalogue.current = null;
                }}
              >
                Close
              </button>
            </div>
            <p>
              Server projects are saved to your account in PostgreSQL on this
              server. Your local drafts stay separate until you import them.
            </p>
            {pendingCreation && (
              <p role="status">
                Sign in to create {pendingCreation.name} with its own database
                and member accounts. Your selected{" "}
                {pendingCreation.type === "tracker"
                  ? "workspace"
                  : pendingCreation.type}{" "}
                starter will be installed after sign-in.
              </p>
            )}
            {pendingCatalogue.current && (
              <p role="status">Sign in to install your selected app starter.</p>
            )}
            {accountError && <p role="alert">{accountError}</p>}
            {workspace === "server" ? (
              <>
                <p>Signed in as {user?.email}</p>
                {(pendingCreation || pendingCatalogue.current) && (
                  <button
                    className="primary"
                    onClick={() => void finishAccount()}
                  >
                    Continue creating your app
                  </button>
                )}
                <div className="backend-actions">
                  <button
                    onClick={() =>
                      void saveNow()
                        .then(() => connectServer())
                        .catch((e) => setAccountError(e.message))
                    }
                  >
                    Save and refresh projects
                  </button>
                  <button
                    onClick={() =>
                      void importLocal().catch((e) =>
                        setAccountError(e.message),
                      )
                    }
                  >
                    Import local drafts as copies
                  </button>
                  <button
                    onClick={() =>
                      void disconnect()
                        .then(() => setAccountOpen(false))
                        .catch((e) => setAccountError(e.message))
                    }
                  >
                    Save and sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="auth-frame">
                  <i aria-hidden="true" />
                  <AccountForm onDone={() => void finishAccount()} />
                  <button
                    className="auth-session"
                    onClick={() => void finishAccount()}
                  >
                    Load projects with current session
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
      {modal && (
        <div
          className="modal-backdrop"
          onClick={() => !busy && setModal(false)}
        >
          <form
            className="modal new-project"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
          >
            <button
              type="button"
              className="modal-close icon-btn"
              aria-label="Close"
              disabled={busy}
              onClick={() => setModal(false)}
            >
              <X size={20} />
            </button>
            <header className="np-head">
              <h2 id="new-title">Make room for your next idea.</h2>
              <p>
                Choose a working application or a marketing website. Each starts
                with its own structure.
              </p>
            </header>
            <div className="np-body">
              <div className="np-grid">
                <label>
                  Project type
                  <select
                    aria-label="Project type"
                    value={projectType}
                    onChange={(e) => {
                      setProjectType(e.target.value as ProjectType);
                      setTypeChosen(true);
                    }}
                  >
                    <option value="portal">
                      Client portal · projects, requests & documents
                    </option>
                    <option value="crm">
                      CRM · contacts & sales opportunities
                    </option>
                    <option value="tracker">
                      Workspace · projects & tasks
                    </option>
                    <option value="website">
                      Marketing website · pages & content
                    </option>
                  </select>
                </label>
                <label>
                  Project name
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    placeholder="Your next big thing"
                  />
                </label>
              </div>
              <label>
                {projectType === "website" ? "Website brief" : "App brief"}
                <textarea
                  value={brief}
                  onChange={(e) => {
                    setBrief(e.target.value);
                    if (!typeChosen)
                      setProjectType(inferProjectType(e.target.value));
                    if (!starterChosen)
                      setWebsiteStarter(inferWebsiteStarter(e.target.value));
                  }}
                  maxLength={6000}
                  placeholder="Who is it for? What should it say? Include ‘Pages: Home, About, Contact’ to define your structure."
                />
              </label>
              {projectType === "website" ? (
                <div className="np-grid">
                  <div>
                    <label>
                      Website starter
                      <select
                        aria-label="Website starter"
                        value={websiteStarter}
                        onChange={(e) => {
                          setWebsiteStarter(e.target.value);
                          setStarterChosen(true);
                        }}
                      >
                        {websiteStarters.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="mode-note">
                      {
                        websiteStarters.find((s) => s.id === websiteStarter)
                          ?.description
                      }
                    </p>
                  </div>
                  <div>
                    <label>
                      Generation mode
                      <select
                        value={mode}
                        onChange={(e) =>
                          setMode(e.target.value as "demo" | "ai")
                        }
                      >
                        <option value="demo">
                          Curated starter — no AI required
                        </option>
                        <option value="ai">
                          AI generation —{" "}
                          {connected
                            ? `${providerName} connected`
                            : `requires ${providerName} setup`}
                        </option>
                      </select>
                    </label>
                    <small className="mode-note">
                      {mode === "demo"
                        ? "Uses the selected design and editable sample content with your page names. This is a curated starter, not AI generation."
                        : "Uses your configured local model to create a plan and original copy."}
                    </small>
                  </div>
                </div>
              ) : (
                <p className="mode-note">
                  Creates a working{" "}
                  {projectType === "tracker"
                    ? "project workspace"
                    : projectType}{" "}
                  with member accounts, related database collections, and
                  connected screens. Your brief is saved for further
                  development; this installs the selected starter rather than
                  generating custom business logic.{" "}
                  {workspace !== "server" &&
                    "Sign in on the next step to save the app and its database."}
                </p>
              )}
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
            </div>
            <footer className="np-foot">
              <button className="primary" disabled={busy}>
                {busy
                  ? "Creating your project…"
                  : projectType !== "website"
                    ? workspace === "server"
                      ? "Create working app"
                      : "Sign in & create app"
                    : mode === "demo"
                      ? "Create demo website"
                      : "Generate website"}
                <Sparkles size={16} />
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}
