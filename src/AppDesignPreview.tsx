import type { Project } from "./model";
import { designVariables, getAppDesign } from "../shared/app-design.mjs";
import "./app-workspace.css";
import AppOverviewLayout from "./AppOverviewLayout";
export default function AppDesignPreview({ project }: { project: Project }) {
  const app = project.app!,
    design = getAppDesign(app);
  return (
    <div
      className={`design-live-preview application-shell app-composition-shell app-nav-${design.navigation} app-density-${design.density} app-layout-${design.layout || "dashboard"}`}
      style={designVariables(design) as React.CSSProperties}
      aria-label="Live design preview"
    >
      <aside className="application-sidebar">
        <div className="application-brand">
          <span className="application-mark">◈</span>
          <strong>{project.name}</strong>
        </div>
        <button className="active">Overview</button>
        {app.navigation.slice(0, 4).map((n) => (
          <button key={n.collectionId}>{n.label}</button>
        ))}
      </aside>
      <main className="application-main">
        <div className="application-topbar">
          Workspace <small>Sample content · design preview</small>
        </div>
        <div className="application-content">
          <AppOverviewLayout
            layout={design.layout}
            slots={{
              heading: (
                <header className="app-page-heading">
                  <div>
                    <span className="app-eyebrow">OVERVIEW</span>
                    <h1>{design.heading}</h1>
                    <p>{app.description}</p>
                  </div>
                </header>
              ),
              widgets: (
                <div className="design-preview-metrics app-dashboard-widgets">
                  {(design.widgets.length
                    ? design.widgets
                    : app.navigation.map((n, i) => ({
                        id: String(i),
                        title: n.label,
                      }))
                  )
                    .slice(0, 3)
                    .map((w, i) => (
                      <div className="app-panel" key={w.id}>
                        <small>{w.title}</small>
                        <strong>{[24, 128, 8][i]}</strong>
                        <span>Illustrative data</span>
                      </div>
                    ))}
                </div>
              ),
              stats: (
                <div className="app-stats">
                  {(app.navigation.length
                    ? app.navigation.slice(0, 3).map((n) => n.label)
                    : ["Records"]
                  ).map((label, i) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{[24, 8, 12][i]}</strong>
                      <small>Illustrative total</small>
                    </div>
                  ))}
                </div>
              ),
              recent: (
                <div className="app-panel">
                  <div className="app-section-heading">
                    <h2>{app.navigation[0]?.label || "Recent work"}</h2>
                    <button className="app-primary">+ Add record</button>
                  </div>
                  {[
                    "Website experience",
                    "Brand direction",
                    "Next milestone",
                  ].map((s, i) => (
                    <div className="recent-row" key={s}>
                      <span className="work-avatar">0{i + 1}</span>
                      <strong>{s}</strong>
                      <span className="app-status-pill">
                        {i === 1 ? "Complete" : "In progress"}
                      </span>
                    </div>
                  ))}
                </div>
              ),
              actions: (
                <aside className="app-highlight">
                  <span className="app-eyebrow">UP NEXT</span>
                  <h2>Your next milestone</h2>
                  <p>
                    Keep requests, decisions, and priorities in one clear
                    workspace.
                  </p>
                  <span className="app-status-pill">Sample content</span>
                </aside>
              ),
            }}
          />
        </div>
      </main>
    </div>
  );
}
