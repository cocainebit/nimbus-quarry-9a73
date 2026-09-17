import { useMemo, useState } from "react";
import { X, Monitor, Smartphone } from "lucide-react";
import {
  websiteStarters,
  createWebsiteStarterProject,
} from "../shared/website-starters.mjs";
import { normalizeProject, type Project, type Section } from "./model";
import { SitePage } from "./blocks";
import "./WebsiteDesignPicker.css";

export default function WebsiteDesignPicker({
  project,
  onApply,
  onClose,
}: {
  project: Project;
  onApply: (next: Project) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(websiteStarters[0].id),
    [replaceContent, setReplaceContent] = useState(false),
    [pageIndex, setPageIndex] = useState(0),
    [mobile, setMobile] = useState(false);
  const draft = useMemo(() => {
    const generated = normalizeProject(
      createWebsiteStarterProject(
        project.name,
        project.brief,
        selected,
        project.pages.map((p) => p.name),
      ),
    );
    const map = new Map(
      generated.pages.map((p, i) => [p.id, project.pages[i]?.id || p.id]),
    );
    const remap = (href: string) =>
      href.startsWith("page:")
        ? `page:${map.get(href.slice(5)) || href.slice(5)}`
        : href;
    return normalizeProject({
      ...project,
      theme: generated.theme,
      pages: project.pages.map((page, i) => {
        const source = generated.pages[i] || generated.pages[0];
        if (replaceContent)
          return {
            ...page,
            sections: source.sections.map((s) => ({
              ...s,
              buttonHref: remap(s.buttonHref),
              items: s.items.map((item) => ({
                ...item,
                href: remap(item.href),
              })),
            })),
          };
        return {
          ...page,
          sections: page.sections.map((section, j) => {
            const style =
              source.sections.find((s) => s.kind === section.kind) ||
              source.sections[j % source.sections.length];
            return {
              ...section,
              variant: style.variant,
              tone: style.tone,
              spacing: style.spacing,
            } as Section;
          }),
        };
      }),
    });
  }, [project, selected, replaceContent]);
  const active = websiteStarters.find((s) => s.id === selected)!;
  return (
    <div
      className="website-design-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Change website design"
    >
      <header className="website-design-heading">
        <div>
          <span>WEBSITE DESIGN LIBRARY</span>
          <h2>Give your website a different starting point.</h2>
          <p>Choose a direction, review your pages, then apply it.</p>
        </div>
        <button
          className="icon-btn"
          aria-label="Close website design picker"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      <div className="website-design-body">
        <aside className="website-design-choices">
          <h3>Starting designs</h3>
          {websiteStarters.map((starter) => (
            <button
              key={starter.id}
              className={`website-starter-card ${selected === starter.id ? "selected" : ""}`}
              aria-pressed={selected === starter.id}
              onClick={() => setSelected(starter.id)}
            >
              <span
                className="website-starter-swatch"
                style={{
                  background: starter.theme.background,
                  borderColor: starter.theme.accent,
                }}
              >
                <span style={{ background: starter.theme.accent }} />
              </span>
              <strong>{starter.name}</strong>
              <span>{starter.description}</span>
            </button>
          ))}
        </aside>
        <section className="website-design-review">
          <div className="website-design-preview-toolbar">
            <div>
              <strong>{active.name}</strong>
              <small>
                {replaceContent
                  ? "Starter content preview"
                  : "Your content with the selected visual style"}
              </small>
            </div>
            <label>
              Preview page
              <select
                value={pageIndex}
                onChange={(e) => setPageIndex(Number(e.target.value))}
              >
                {draft.pages.map((p, i) => (
                  <option key={p.id} value={i}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              aria-label="Desktop preview"
              aria-pressed={!mobile}
              onClick={() => setMobile(false)}
            >
              <Monitor size={16} />
            </button>
            <button
              aria-label="Mobile preview"
              aria-pressed={mobile}
              onClick={() => setMobile(true)}
            >
              <Smartphone size={16} />
            </button>
          </div>
          <div className="website-design-preview-scroll">
            <div
              className={`website-design-artboard ${mobile ? "is-mobile" : ""}`}
              inert
            >
              <SitePage
                project={draft}
                page={draft.pages[pageIndex] || draft.pages[0]}
              />
            </div>
          </div>
        </section>
      </div>
      <footer className="website-design-footer">
        <div>
          <label className="website-replace-choice">
            <input
              type="checkbox"
              checked={replaceContent}
              onChange={(e) => setReplaceContent(e.target.checked)}
            />
            Replace page sections with starter content
          </label>
          <p>
            {replaceContent
              ? "This replaces section text, images and links on every page with the previewed starter. Page names, page IDs and project settings stay. Undo is available in the canvas."
              : "Visual style keeps your existing pages, sections, text, images and links. It updates colors, type, corners and section arrangement."}
          </p>
        </div>
        <button className="secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="dark-button" onClick={() => onApply(draft)}>
          {replaceContent
            ? "Apply reviewed starter content"
            : "Apply visual style"}
        </button>
      </footer>
    </div>
  );
}
