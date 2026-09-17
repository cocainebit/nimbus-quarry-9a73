import { useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { sourceTemplates } from "../shared/source-templates.mjs";
import { demoProject, type Project } from "./model";
import "./source-templates.css";
type SourceTemplate = {
  id: string;
  collection?: string;
  framework?: string;
  adaptationLabel?: string;
  designNotes?: string[];
  name: string;
  category: string;
  description: string;
  sourceUrl: string;
  license: string;
  entry: string;
  pages: string[];
  files: string[];
};
const templates = sourceTemplates as SourceTemplate[];
export default function SourceTemplateCatalogue({
  onCreated,
}: {
  onCreated: (project: Project) => void;
}) {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState("studio");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<SourceTemplate | null>(null);
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const [name, setName] = useState("");
  const collectionTemplates = templates.filter(
    (t) => (t.collection || "contemporary") === collection,
  );
  const filtered = collectionTemplates.filter(
    (t) =>
      (category === "All" || t.category === category) &&
      `${t.name} ${t.description} ${t.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  function create(template: SourceTemplate) {
    const project = demoProject(
      name.trim() || template.name,
      `Website based on the original ${template.name} template. ${template.description}`,
    );
    Object.assign(project, {
      nativeTemplate: { id: template.id, page: template.entry, edits: {} },
    });
    onCreated(project);
  }
  return (
    <section
      className="source-collection"
      aria-label="Original open-source templates"
    >
      <header>
        <div>
          <span className="source-eyebrow">DESIGN, WITH A POINT OF VIEW</span>
          <h2>Find your direction.</h2>
          <p>
            Original source. Distinct composition, typography, and interaction.
            Preview the complete design before making it yours.
          </p>
        </div>
        <span className="source-total">
          {collectionTemplates.length}{" "}
          {collection === "motion"
            ? "motion studies"
            : collection === "studio"
              ? "studio editions"
              : "original designs"}
        </span>
      </header>
      <div
        className="source-collection-tabs"
        role="group"
        aria-label="Design collection"
      >
        {[
          ["studio", "Studio editions"],
          ["contemporary", "Contemporary"],
          ["motion", "Motion studies"],
          ["developer", "Developer & publishing"],
          ["classic", "Classic archive"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={collection === id}
            onClick={() => {
              setCollection(id);
              setCategory("All");
              setQuery("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {collection === "studio" && (
        <p className="source-collection-context">
          Complete designs developed from licensed open-source foundations. Each
          edition identifies its original source and includes the adapted code.
        </p>
      )}
      {collection === "classic" && (
        <p className="source-collection-context">
          The earlier collection, retained for existing projects. These designs
          are not the contemporary selection.
        </p>
      )}
      {collection === "motion" && (
        <p className="source-collection-context">
          Original interactive design experiments. These are focused starting
          points for motion and composition, not complete business websites.
        </p>
      )}
      <div className="source-toolbar">
        <label>
          <Search size={17} />
          <input
            type="search"
            aria-label="Search original templates"
            placeholder="Find an editorial, portfolio, agency…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Original template category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {["All", ...new Set(collectionTemplates.map((t) => t.category))].map(
            (c) => (
              <option key={c}>{c}</option>
            ),
          )}
        </select>
      </div>
      <div className="source-grid">
        {filtered.map((t, i) => (
          <article className="source-card" key={t.id}>
            <button
              className="source-cover"
              aria-label={`Explore ${t.name}`}
              onClick={() => {
                setSelected(t);
                setName(t.name);
              }}
            >
              <img
                loading="lazy"
                src={`/templates/${t.id}/plotform-preview.jpg`}
                alt={`${t.name} original website design`}
              />
              <span>
                Explore template <ArrowUpRight size={16} />
              </span>
            </button>
            <div className="source-card-meta">
              <div>
                <small>
                  {String(i + 1).padStart(2, "0")} / {t.category}
                </small>
                <h3>{t.name}</h3>
              </div>
              <span>
                {t.pages.length} {t.pages.length === 1 ? "page" : "pages"}
              </span>
            </div>
            <p>{t.description}</p>
            {t.adaptationLabel && (
              <small className="source-adaptation">{t.adaptationLabel}</small>
            )}
            <footer>
              <a href={t.sourceUrl} target="_blank" rel="noreferrer">
                Original source ↗
              </a>
              <span>
                {t.framework ? `${t.framework} · ` : ""}
                {t.license}
              </span>
            </footer>
          </article>
        ))}
      </div>
      {!filtered.length && <p>No templates match this search.</p>}
      <p className="source-note">
        These website templates preserve their original design and license
        credits. Demo contact forms and service buttons need a backend
        connection; installing a design does not add accounts or payments.
      </p>
      {selected && (
        <div className="source-dialog-backdrop">
          <section
            className="source-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.name} original template`}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSelected(null);
            }}
          >
            <header>
              <div>
                <strong>{selected.name}</strong>
                <span>
                  {selected.category} · {selected.license}
                </span>
              </div>
              <div role="group" aria-label="Template preview size">
                <button
                  aria-pressed={device === "desktop"}
                  onClick={() => setDevice("desktop")}
                >
                  Desktop
                </button>
                <button
                  aria-pressed={device === "phone"}
                  onClick={() => setDevice("phone")}
                >
                  Phone
                </button>
              </div>
              <button
                autoFocus
                aria-label="Close original template"
                onClick={() => setSelected(null)}
              >
                <X size={20} />
              </button>
            </header>
            <div className={`source-preview-device source-device-${device}`}>
              <iframe
                title={`${selected.name} website preview`}
                sandbox="allow-scripts"
                src={`/templates/${selected.id}/${selected.entry}`}
              />
            </div>
            <footer>
              <div>
                <label>
                  Project name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                  />
                </label>
                <small>
                  {selected.adaptationLabel
                    ? selected.adaptationLabel.replace(/\.?$/, ".")
                    : "Original design preserved."}{" "}
                  Required credits included.
                  {/^GPL/i.test(selected.license) &&
                    " GPL-3.0: a website published from this design must be distributed with its source and this license."}
                </small>
              </div>
              <button className="source-use" onClick={() => create(selected)}>
                Use this design <ArrowUpRight size={17} />
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}
