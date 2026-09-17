import { useEffect, useState } from "react";
import { Check, Layers, LayoutGrid, Plus, X } from "lucide-react";
import type { Project } from "./model";
import { demoProject } from "./model";
import AppDesignPreview from "./AppDesignPreview";
import { api } from "./backend-api";
import "./catalogue.css";
type Template = {
  id: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  limitations: string[];
  collectionCount: number;
  runtime: NonNullable<Project["app"]>["template"];
  design: NonNullable<Project["app"]>["design"];
  screens: {
    key: string;
    label: string;
    view: "table" | "cards" | "board";
    statusField?: string;
  }[];
};
function previewProject(template: Template): Project {
  const project = demoProject(template.name, template.description);
  project.app = {
    template: template.runtime,
    title: template.name,
    description: template.description,
    design: template.design,
    navigation: template.screens.map((s) => ({
      collectionId: s.key,
      label: s.label,
      view: s.view,
      ...(s.statusField ? { statusField: s.statusField } : {}),
    })),
  };
  return project;
}
export default function AppCatalogue({
  onInstalled,
  onSignIn,
}: {
  onInstalled: (project: Project) => void | Promise<void>;
  onSignIn?: (resume: () => Promise<void>) => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [preview, setPreview] = useState<Template | null>(null);
  useEffect(() => {
    let active = true;
    api<Template[]>("/api/catalog")
      .then((items) => {
        if (active) setTemplates(items);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function install(template: Template, authenticated = false) {
    if (onSignIn && !authenticated) {
      onSignIn(() => install(template, true));
      return;
    }
    setBusy(template.id);
    setError("");
    try {
      const result = await api<{ project: Project }>(
        `/api/catalog/${template.id}/install`,
        {},
      );
      await onInstalled(result.project);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  const filtered = templates.filter(
    (t) =>
      (category === "All" || t.category === category) &&
      `${t.name} ${t.description} ${t.features.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <section className="app-catalogue">
      <header>
        <div>
          <span className="catalog-kicker">
            <Layers size={14} /> THE APP COLLECTION
          </span>
          <h2>A workspace built around your work.</h2>
          <p>
            Explore complete starting points, then make the design and data your
            own.
          </p>
        </div>
        <span className="catalog-count">
          <LayoutGrid size={15} /> {templates.length} app starters
        </span>
      </header>
      <div className="catalog-controls">
        <label>
          Find an app
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search portals, approvals, events…"
          />
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {["All", ...new Set(templates.map((t) => t.category))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <p role="alert" className="catalog-error">
          {error}
        </p>
      )}
      {!filtered.length && (
        <p>
          {templates.length
            ? "No matching apps. Try another search."
            : "Loading app collection…"}
        </p>
      )}
      <div className="catalog-grid">
        {filtered.map((template) => (
          <article className="catalog-card" key={template.id}>
            <button
              className="catalog-render-preview"
              onClick={() => setPreview(template)}
              aria-label={`Preview ${template.name}`}
            >
              <div className="catalog-preview-scaled" inert>
                <AppDesignPreview project={previewProject(template)} />
              </div>
              <span className="catalog-preview-label">
                Explore design · sample data
              </span>
            </button>
            <div className="catalog-card-body">
              <div className="catalog-card-title">
                <div>
                  <span>{template.category}</span>
                  <h3>{template.name}</h3>
                </div>
              </div>
              <p>{template.description}</p>
              <ul>
                {template.features.map((f) => (
                  <li key={f}>
                    <Check size={12} />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="catalog-screens">
                {template.screens.map((s) => (
                  <span key={s.key}>
                    {s.label} <small>{s.view}</small>
                  </span>
                ))}
              </div>
              <details>
                <summary>Included functionality & limits</summary>
                <p>
                  {template.collectionCount} connected collections. Member
                  accounts, private records, and create/edit/delete screens. New
                  apps start empty; preview totals are illustrative.
                </p>
                {template.limitations.map((l) => (
                  <p key={l}>{l}</p>
                ))}
              </details>
              <button disabled={!!busy} onClick={() => void install(template)}>
                <Plus size={15} />
                {busy === template.id ? "Creating your app…" : "Use this app"}
              </button>
            </div>
          </article>
        ))}
      </div>
      {preview && (
        <div
          className="catalog-modal-backdrop"
          onClick={() => setPreview(null)}
        >
          <section
            className="catalog-preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={`${preview.name} preview`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setPreview(null);
            }}
          >
            <header>
              <div>
                <h2>{preview.name}</h2>
                <p>
                  {preview.screens.map((s) => s.label).join(" · ")} · Sample
                  content
                </p>
              </div>
              <button
                aria-label="Close app preview"
                autoFocus
                onClick={() => setPreview(null)}
              >
                <X />
              </button>
            </header>
            <div className="catalog-full-preview" inert>
              <AppDesignPreview project={previewProject(preview)} />
            </div>
            <footer>
              <p>
                Installs this design with connected collections. Your records
                start empty.
              </p>
              <button disabled={!!busy} onClick={() => void install(preview)}>
                {busy ? "Creating your app…" : "Use this app"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}
