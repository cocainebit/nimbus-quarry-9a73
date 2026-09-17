import { useState, useMemo, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  type NodeProps,
  type Node,
} from "@xyflow/react";
import PageDesigner from "./PageDesigner";
import WebsiteDesignPicker from "./WebsiteDesignPicker";
import BackendPanel from "./BackendPanel";
import AppDesignPreview from "./AppDesignPreview";
import AppLayoutSettings from "./AppLayoutSettings";
import AppDesignAI from "./AppDesignAI";
import RefinePanel from "./RefinePanel";
import { SectionFields, SectionLibrary } from "./SectionFields";
import { pageFiles, projectIssues } from "../shared/schema.mjs";
import {
  ArrowLeft,
  Plus,
  Download,
  Check,
  X,
  Trash2,
  ArrowUp,
  ArrowDown,
  Monitor,
  Smartphone,
  PanelLeft,
  Layers,
  MousePointer2,
  ExternalLink,
} from "lucide-react";
import {
  makeSection,
  kinds,
  uid,
  type Page,
  type Project,
  type Section,
} from "./model";
import { SitePage, Block } from "./blocks";
import { exportSite, download } from "./export";
type View = "Sitemap" | "Wireframes" | "Style guide" | "Design";
type PageNode = Node<{ page: Page; project: Project; wire: boolean }, "page">;
function CanvasPage({ data, selected }: NodeProps<PageNode>) {
  return (
    <div
      className={`canvas-page ${data.wire ? "artboard" : "map-card"} ${selected ? "active" : ""}`}
    >
      <Handle type="target" position={Position.Top} />
      <header>
        <span>
          <Layers size={14} />
          {data.page.name}
        </span>
        <small>
          {data.wire ? "1440" : `${data.page.sections.length} sections`}
        </small>
      </header>
      {data.wire ? (
        <div className="artboard-clip">
          <SitePage project={data.project} page={data.page} wireframe />
        </div>
      ) : (
        <div className="map-sections">
          <div className="global-section">
            ↔ Navigation <small>Global</small>
          </div>
          {data.page.sections.map((s, i) => (
            <div className="map-section" key={s.id}>
              <span className="section-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <strong>
                  {s.kind === "cta"
                    ? "Call to action"
                    : s.kind.charAt(0).toUpperCase() + s.kind.slice(1)}
                </strong>
                <p>{s.title}</p>
              </div>
            </div>
          ))}
          <div className="global-section">
            ↔ Footer <small>Global</small>
          </div>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
const nodeTypes = { page: CanvasPage };
export default function Editor({
  project,
  onChange,
  onBack,
  saveStatus,
}: {
  project: Project;
  onChange: (p: Project) => void;
  onBack: () => void;
  saveStatus: string;
}) {
  const [view, setView] = useState<View>(project.app ? "Design" : "Sitemap");
  const [selected, setSelected] = useState(project.pages[0]?.id || "");
  const [inspector, setInspector] = useState(true);
  const [preview, setPreview] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [designing, setDesigning] = useState(false);
  const [websiteDesign, setWebsiteDesign] = useState(false);
  const [exportMenu, setExportMenu] = useState(false);
  const [library, setLibrary] = useState(false);
  const [refine, setRefine] = useState<string | null>(null);
  const [exportError, setExportError] = useState("");
  const [settings, setSettings] = useState(false);
  const [backendOpen, setBackendOpen] = useState(false);
  const [appLayout, setAppLayout] = useState(false);
  const [designAI, setDesignAI] = useState(false);
  const [previewNotice, setPreviewNotice] = useState("");
  const [history, setHistory] = useState<Project[]>([]);
  const [future, setFuture] = useState<Project[]>([]);
  const [copiedSection, setCopiedSection] = useState<Section | null>(null);
  const page = project.pages.find((p) => p.id === selected) || project.pages[0];
  const update = useCallback(
    (next: Project) => {
      setHistory((h) => [...h.slice(-29), project]);
      setFuture([]);
      onChange(next);
    },
    [project, onChange],
  );
  const updatePage = (next: Page) =>
    update({
      ...project,
      pages: project.pages.map((p) => (p.id === next.id ? next : p)),
    });
  const computedNodes = useMemo<PageNode[]>(
    () =>
      project.pages.map((p, i) => ({
        id: p.id,
        type: "page",
        position: view === "Wireframes" ? { x: i * 480, y: 0 } : p.position,
        data: { page: p, project, wire: view === "Wireframes" },
        selected: p.id === selected,
      })),
    [project, view, selected],
  );
  const [nodes, setNodes, onNodesChange] =
    useNodesState<PageNode>(computedNodes);
  useEffect(() => setNodes(computedNodes), [computedNodes, setNodes]);
  const edges = useMemo(
    () =>
      project.pages.slice(1).map((p) => ({
        id: `home-${p.id}`,
        source: project.pages[0].id,
        target: p.id,
        type: "smoothstep",
        style: { stroke: "#c6c4c0", strokeWidth: 1.5 },
      })),
    [project.pages],
  );
  function navigateSite(e: React.MouseEvent<HTMLElement>) {
    const a = (e.target as HTMLElement).closest("a");
    const href = a?.getAttribute("href");
    const target = href ? pageFiles(project).indexOf(href) : -1;
    if (target >= 0) {
      e.preventDefault();
      setSelected(project.pages[target].id);
    }
  }

  function addPage() {
    const p: Page = {
      id: uid(),
      name: `Page ${project.pages.length + 1}`,
      seoTitle: "",
      description: "",
      hideNav: false,
      position: { x: (project.pages.length - 1) * 380, y: 550 },
      sections: [makeSection("hero"), makeSection("cta")],
    };
    update({ ...project, pages: [...project.pages, p] });
    setSelected(p.id);
  }
  function selectSection(id: string) {
    setInspector(true);
    window.setTimeout(() => {
      const el = document.getElementById(
        `edit-${id}`,
      ) as HTMLDetailsElement | null;
      if (el) {
        el.open = true;
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }, 50);
  }
  if (designing)
    return (
      <PageDesigner
        project={project}
        page={page}
        onSave={(sections) => updatePage({ ...page, sections })}
        onClose={() => setDesigning(false)}
        onChooseDesign={
          !project.app
            ? () => {
                setDesigning(false);
                setWebsiteDesign(true);
              }
            : undefined
        }
      />
    );
  return (
    <div className="editor">
      <header className="editor-header">
        <div className="editor-project">
          <button
            className="icon-btn back"
            aria-label="Back to projects"
            onClick={onBack}
          >
            <ArrowLeft size={18} />
          </button>
          <span className="brand-mark small">
            <Layers size={17} />
          </span>
          <input
            aria-label="Project name"
            value={project.name}
            onChange={(e) => onChange({ ...project, name: e.target.value })}
          />
          <span className="save-state">
            <Check size={12} />
            {saveStatus}
          </span>
        </div>
        <nav className="view-tabs">
          {(["Sitemap", "Wireframes", "Style guide", "Design"] as View[]).map(
            (v) => (
              <button
                key={v}
                className={view === v ? "active" : ""}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ),
          )}
        </nav>
        <div className="editor-actions">
          {!project.app && (
            <button
              className="secondary"
              onClick={() => setWebsiteDesign(true)}
            >
              Change website design
            </button>
          )}
          {project.app && (
            <button className="secondary" onClick={() => setDesignAI(true)}>
              Develop app design
            </button>
          )}
          <button className="secondary" onClick={() => setBackendOpen(true)}>
            App backend
          </button>
          <button className="secondary" onClick={() => setSettings(true)}>
            Site settings
          </button>
          <button className="secondary" onClick={() => setPreview(true)}>
            <ExternalLink size={14} />
            Preview
          </button>
          <div className="export-wrap">
            <button
              className="dark-button"
              onClick={() => setExportMenu(!exportMenu)}
            >
              <Download size={14} />
              Export
            </button>
            {exportMenu && (
              <div className="export-menu">
                <button
                  onClick={() => {
                    try {
                      exportSite(project);
                      setExportError("");
                    } catch (e) {
                      setExportError(
                        e instanceof Error ? e.message : "Export failed.",
                      );
                    }
                    setExportMenu(false);
                  }}
                >
                  Download website (.zip)
                  <small>HTML, CSS, images + contact server</small>
                </button>
                <button
                  onClick={() => {
                    download(
                      `${project.name}.json`,
                      JSON.stringify(project, null, 2),
                      "application/json",
                    );
                    setExportMenu(false);
                  }}
                >
                  Project backup (.json)
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="editor-body">
        <div className="tool-rail">
          <button
            className={`icon-btn ${inspector ? "tool-active" : ""}`}
            title="Toggle page inspector"
            onClick={() => setInspector(!inspector)}
          >
            <PanelLeft size={19} />
          </button>
          <button className="icon-btn" title="Add page" onClick={addPage}>
            <Plus size={22} />
          </button>
          <button
            className="icon-btn"
            title="Undo last edit"
            disabled={!history.length}
            onClick={() => {
              const last = history.at(-1);
              if (last) {
                setFuture((f) => [project, ...f]);
                onChange(last);
                setHistory((h) => h.slice(0, -1));
              }
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="icon-btn"
            title="Redo last edit"
            aria-label="Redo last edit"
            disabled={!future.length}
            onClick={() => {
              const next = future[0];
              if (next) {
                setHistory((h) => [...h, project]);
                onChange(next);
                setFuture((f) => f.slice(1));
              }
            }}
          >
            ↪
          </button>
          <span className="rail-bottom">
            <MousePointer2 size={17} />
          </span>
        </div>
        {inspector && (
          <aside className="inspector">
            <div className="inspector-title">
              <strong>Project pages</strong>
              <button className="icon-btn" title="Add page" onClick={addPage}>
                <Plus size={16} />
              </button>
            </div>
            <div className="page-list">
              {project.pages.map((p, i) => (
                <button
                  className={p.id === page.id ? "active" : ""}
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                >
                  <Layers size={14} />
                  {p.name}
                  <small>{String(i + 1).padStart(2, "0")}</small>
                </button>
              ))}
            </div>
            <div className="inspector-details">
              <span className="eyebrow">PAGE DETAILS</span>
              <button
                className="secondary full"
                onClick={() => setRefine("page")}
              >
                Develop page with AI
              </button>
              <label>
                Page name
                <input
                  value={page.name}
                  onChange={(e) =>
                    updatePage({ ...page, name: e.target.value })
                  }
                />
              </label>
              <details className="page-settings">
                <summary>Page URL & search settings</summary>
                <label>
                  URL slug
                  <input
                    value={page.slug || ""}
                    placeholder="about-us"
                    onChange={(e) =>
                      updatePage({
                        ...page,
                        slug:
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "") || undefined,
                      })
                    }
                  />
                </label>
                <small>
                  Export: {pageFiles(project)[project.pages.indexOf(page)]}
                </small>
                <label>
                  Search title
                  <input
                    value={page.seoTitle}
                    onChange={(e) =>
                      updatePage({ ...page, seoTitle: e.target.value })
                    }
                  />
                </label>
                <label>
                  Search description
                  <textarea
                    value={page.description}
                    onChange={(e) =>
                      updatePage({ ...page, description: e.target.value })
                    }
                    maxLength={400}
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={page.hideNav}
                    onChange={(e) =>
                      updatePage({ ...page, hideNav: e.target.checked })
                    }
                  />
                  Hide from navigation
                </label>
                <button
                  className="secondary full"
                  onClick={() => {
                    const duplicate = {
                      ...structuredClone(page),
                      id: uid(),
                      name: `${page.name} copy`,
                      slug: undefined,
                      position: {
                        x: page.position.x + 380,
                        y: page.position.y,
                      },
                      sections: page.sections.map((s) => ({
                        ...structuredClone(s),
                        id: uid(),
                      })),
                    };
                    update({
                      ...project,
                      pages: [...project.pages, duplicate],
                    });
                    setSelected(duplicate.id);
                  }}
                >
                  Duplicate page
                </button>
              </details>
              <div className="inspector-title">
                <strong>Sections</strong>
                <span>{page.sections.length}</span>
              </div>
              {page.sections.map((s, i) => (
                <details
                  className="section-edit"
                  id={`edit-${s.id}`}
                  key={s.id}
                >
                  <summary>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {s.kind}
                    <Chevron />
                  </summary>
                  <label>
                    Component
                    <select
                      value={s.kind}
                      onChange={(e) =>
                        updatePage({
                          ...page,
                          sections: page.sections.map((x) =>
                            x.id === s.id
                              ? {
                                  ...s,
                                  kind: e.target.value as Section["kind"],
                                }
                              : x,
                          ),
                        })
                      }
                    >
                      {kinds.map((k) => (
                        <option key={k}>{k}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Heading
                    <input
                      value={s.title}
                      onChange={(e) =>
                        updatePage({
                          ...page,
                          sections: page.sections.map((x) =>
                            x.id === s.id ? { ...s, title: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    Copy
                    <textarea
                      value={s.body}
                      onChange={(e) =>
                        updatePage({
                          ...page,
                          sections: page.sections.map((x) =>
                            x.id === s.id ? { ...s, body: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <SectionFields
                    section={s}
                    project={project}
                    onChange={(next) =>
                      updatePage({
                        ...page,
                        sections: page.sections.map((x) =>
                          x.id === s.id ? next : x,
                        ),
                      })
                    }
                  />
                  <button
                    className="secondary full"
                    onClick={() => setRefine(s.id)}
                  >
                    Refine section with AI
                  </button>
                  <button
                    className="secondary full"
                    onClick={() => {
                      const sections = [...page.sections];
                      sections.splice(i + 1, 0, {
                        ...structuredClone(s),
                        id: uid(),
                      });
                      updatePage({ ...page, sections });
                    }}
                  >
                    Duplicate section
                  </button>
                  <div className="reuse-section">
                    <button
                      className="secondary full"
                      onClick={() => setCopiedSection(structuredClone(s))}
                    >
                      Copy section
                    </button>
                    <label>
                      Move to page
                      <select
                        value=""
                        onChange={(e) => {
                          const target = e.target.value;
                          if (!target) return;
                          update({
                            ...project,
                            pages: project.pages.map((p) =>
                              p.id === page.id
                                ? {
                                    ...p,
                                    sections: p.sections.filter(
                                      (x) => x.id !== s.id,
                                    ),
                                  }
                                : p.id === target
                                  ? { ...p, sections: [...p.sections, s] }
                                  : p,
                            ),
                          });
                        }}
                      >
                        <option value="">Choose destination…</option>
                        {project.pages
                          .filter((p) => p.id !== page.id)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                  <div className="section-actions">
                    <button
                      className="icon-btn"
                      title="Move section up"
                      disabled={i === 0}
                      onClick={() => {
                        const sections = [...page.sections];
                        [sections[i - 1], sections[i]] = [
                          sections[i],
                          sections[i - 1],
                        ];
                        updatePage({ ...page, sections });
                      }}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      className="icon-btn"
                      title="Move section down"
                      disabled={i === page.sections.length - 1}
                      onClick={() => {
                        const sections = [...page.sections];
                        [sections[i + 1], sections[i]] = [
                          sections[i],
                          sections[i + 1],
                        ];
                        updatePage({ ...page, sections });
                      }}
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      className="icon-btn danger"
                      title="Delete section"
                      onClick={() =>
                        updatePage({
                          ...page,
                          sections: page.sections.filter((x) => x.id !== s.id),
                        })
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </details>
              ))}
              <button
                className="secondary full"
                onClick={() => setLibrary(true)}
              >
                <Plus size={14} />
                Add section
              </button>
              {copiedSection && (
                <button
                  className="secondary full"
                  onClick={() =>
                    updatePage({
                      ...page,
                      sections: [
                        ...page.sections,
                        { ...structuredClone(copiedSection), id: uid() },
                      ],
                    })
                  }
                >
                  Paste {copiedSection.kind} section
                </button>
              )}
              <button
                className="dark-button full"
                onClick={() => setDesigning(true)}
              >
                Open visual editor
                <ExternalLink size={14} />
              </button>
              <button
                className="text-btn danger delete-page"
                disabled={project.pages.length === 1}
                onClick={() => {
                  update({
                    ...project,
                    pages: project.pages.filter((p) => p.id !== page.id),
                  });
                  setSelected(project.pages.find((p) => p.id !== page.id)!.id);
                }}
              >
                Delete page
              </button>
            </div>
            <div className="inspector-foot">
              {project.source === "demo"
                ? "Demo content · edit to make it yours"
                : "AI generated · review before exporting"}
            </div>
          </aside>
        )}
        <main className="canvas-area">
          {["Sitemap", "Wireframes"].includes(view) ? (
            <>
              <div className="canvas-heading">
                <span>{project.name}</span>
                <small>
                  {view === "Sitemap"
                    ? "A clear structure for your next big idea."
                    : "Every section, taking shape."}
                </small>
              </div>
              <ReactFlow
                key={view}
                nodes={nodes}
                onNodesChange={onNodesChange}
                edges={view === "Sitemap" ? edges : []}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.16, maxZoom: 0.85 }}
                minZoom={0.1}
                maxZoom={1.5}
                nodesConnectable={false}
                deleteKeyCode={null}
                onNodeClick={(_e, node) => setSelected(node.id)}
                onNodeDoubleClick={(_e, node) => {
                  setSelected(node.id);
                  setDesigning(true);
                }}
                onNodeDragStop={(_e, node) => {
                  if (view === "Sitemap") {
                    const target = project.pages.find((p) => p.id === node.id)!;
                    updatePage({ ...target, position: node.position });
                  }
                }}
              >
                <Background color="#d5d3d0" gap={20} size={1} />
                <Controls showInteractive={false} />
                <MiniMap nodeColor="#e5d8ed" maskColor="rgba(241,240,238,.6)" />
              </ReactFlow>
              <div className="canvas-hint">
                Drag to pan <span>·</span> Scroll to zoom <span>·</span>{" "}
                Double-click a page to edit
              </div>
            </>
          ) : view === "Style guide" ? (
            <div className="style-guide">
              <span className="eyebrow">THE FEELING BEHIND YOUR WEBSITE</span>
              <h1>Make it unmistakably yours.</h1>
              <p>A shared design language, applied to every page.</p>
              <div className="style-grid">
                <section>
                  <h3>01 / Color palette</h3>
                  <div className="swatches">
                    {(["accent", "background"] as const).map((k) => (
                      <label key={k}>
                        <input
                          aria-label={`${k} color`}
                          type="color"
                          value={project.theme[k]}
                          onChange={(e) =>
                            update({
                              ...project,
                              theme: { ...project.theme, [k]: e.target.value },
                            })
                          }
                        />
                        <strong>{k}</strong>
                        <code>{project.theme[k]}</code>
                      </label>
                    ))}
                  </div>
                </section>
                <section>
                  <h3>02 / Typography</h3>
                  <div
                    className="type-sample"
                    style={{ fontFamily: project.theme.font }}
                  >
                    Aa
                    <span>
                      Good design speaks
                      <br />
                      for itself.
                    </span>
                  </div>
                  <select
                    aria-label="Font family"
                    value={project.theme.font}
                    onChange={(e) =>
                      update({
                        ...project,
                        theme: {
                          ...project.theme,
                          font: e.target.value as Project["theme"]["font"],
                        },
                      })
                    }
                  >
                    <option value="sans-serif">Modern sans serif</option>
                    <option value="Georgia, serif">Editorial serif</option>
                    <option value="monospace">Expressive mono</option>
                  </select>
                </section>
                <section>
                  <h3>03 / Shape & detail</h3>
                  <div
                    className="radius-preview"
                    style={{
                      borderRadius: project.theme.radius,
                      background: project.theme.accent,
                    }}
                  >
                    A softer kind of structure ↗
                  </div>
                  <label>
                    Corner radius · {project.theme.radius}px
                    <input
                      aria-label="Corner radius"
                      type="range"
                      min="0"
                      max="32"
                      value={project.theme.radius}
                      onChange={(e) =>
                        update({
                          ...project,
                          theme: {
                            ...project.theme,
                            radius: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </label>
                </section>
              </div>
            </div>
          ) : (
            <div className="design-stage">
              <div className="design-toolbar">
                <strong>{page.name}</strong>
                <div>
                  <button
                    className={`icon-btn ${!mobile ? "tool-active" : ""}`}
                    aria-label="Desktop view"
                    onClick={() => setMobile(false)}
                  >
                    <Monitor size={17} />
                  </button>
                  <button
                    className={`icon-btn ${mobile ? "tool-active" : ""}`}
                    aria-label="Mobile view"
                    onClick={() => setMobile(true)}
                  >
                    <Smartphone size={17} />
                  </button>
                  <button
                    className="dark-button"
                    onClick={() =>
                      project.app ? setAppLayout(true) : setDesigning(true)
                    }
                  >
                    {project.app ? "App layout" : "Edit page"}
                  </button>
                </div>
              </div>
              <div
                className={`design-preview ${mobile ? "mobile" : ""}`}
                onClick={project.app ? undefined : navigateSite}
                onSubmit={(e) => {
                  e.preventDefault();
                  window.alert(
                    "Preview only. Export and run the included server to collect messages.",
                  );
                }}
              >
                {project.app ? (
                  <AppDesignPreview project={project} />
                ) : (
                  <SitePage
                    project={project}
                    page={page}
                    onSelectSection={selectSection}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      {websiteDesign && !project.app && (
        <WebsiteDesignPicker
          project={project}
          onClose={() => setWebsiteDesign(false)}
          onApply={(next) => {
            update(next);
            setWebsiteDesign(false);
            setView("Design");
          }}
        />
      )}
      {designAI && (
        <AppDesignAI
          project={project}
          onChange={update}
          onClose={() => setDesignAI(false)}
        />
      )}
      {appLayout && project.app && (
        <AppLayoutSettings
          project={project}
          onChange={update}
          onClose={() => setAppLayout(false)}
        />
      )}
      {backendOpen && (
        <BackendPanel
          project={project}
          onClose={() => setBackendOpen(false)}
          onProjectRestored={update}
        />
      )}
      {exportError && (
        <div className="storage-error" role="alert">
          {exportError}
          <button onClick={() => setExportError("")}>Dismiss</button>
        </div>
      )}
      {library && (
        <SectionLibrary
          onClose={() => setLibrary(false)}
          onAdd={(section) => {
            updatePage({ ...page, sections: [...page.sections, section] });
            setLibrary(false);
            selectSection(section.id);
          }}
        />
      )}
      {refine && (
        <RefinePanel
          key={`${page.id}-${refine}`}
          project={project}
          page={page}
          section={page.sections.find((s) => s.id === refine)}
          onClose={() => setRefine(null)}
          onApply={(sections) =>
            updatePage({
              ...page,
              sections:
                refine === "page"
                  ? sections
                  : page.sections.map((s) =>
                      s.id === refine ? sections[0] : s,
                    ),
            })
          }
        />
      )}
      {settings && (
        <div className="modal-backdrop">
          <div
            className="modal settings-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Site settings"
          >
            <button
              className="modal-close"
              onClick={() => setSettings(false)}
              aria-label="Close site settings"
            >
              ✕
            </button>
            <h2>Site settings</h2>
            <p>Shared contact details and export checks.</p>
            <label>
              Contact email
              <input
                type="email"
                value={project.settings.email}
                onChange={(e) =>
                  update({
                    ...project,
                    settings: { ...project.settings, email: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Contact phone
              <input
                value={project.settings.phone}
                onChange={(e) =>
                  update({
                    ...project,
                    settings: { ...project.settings, phone: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Footer text
              <textarea
                value={project.settings.footer}
                onChange={(e) =>
                  update({
                    ...project,
                    settings: { ...project.settings, footer: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Live website URL
              <input
                placeholder="https://example.com"
                value={project.settings.siteUrl}
                onChange={(e) =>
                  update({
                    ...project,
                    settings: { ...project.settings, siteUrl: e.target.value },
                  })
                }
              />
            </label>
            <h3>Before you publish</h3>
            {projectIssues(project).length ? (
              <ul className="publish-checks">
                {projectIssues(project).map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : (
              <p>
                No content issues detected. Review the site before publishing.
              </p>
            )}
            <p className="field-help">
              Contact forms work when the included Node server runs. Messages
              are saved privately; email delivery is not configured.
            </p>
            <button
              className="dark-button full"
              onClick={() => setSettings(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
      {preview && (
        <div className="preview-overlay">
          <header>
            <button className="secondary" onClick={() => setPreview(false)}>
              <X size={16} />
              Close preview
            </button>
            <select
              aria-label="Preview page"
              value={page.id}
              onChange={(e) => setSelected(e.target.value)}
            >
              {project.pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button className="secondary" onClick={() => setMobile(!mobile)}>
              {mobile ? <Monitor size={16} /> : <Smartphone size={16} />}{" "}
              {mobile ? "Desktop" : "Mobile"}
            </button>
          </header>
          <div
            className={`preview-site ${mobile ? "mobile" : ""}`}
            onClick={project.app ? undefined : navigateSite}
            onSubmit={(e) => {
              e.preventDefault();
              setPreviewNotice(
                "Preview only. Export and run the included server to collect messages.",
              );
            }}
          >
            {previewNotice && (
              <p className="preview-notice" role="status">
                {previewNotice}
              </p>
            )}
            {project.app ? (
              <AppDesignPreview project={project} />
            ) : (
              <SitePage project={project} page={page} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
function Chevron() {
  return <span className="chevron">⌄</span>;
}
