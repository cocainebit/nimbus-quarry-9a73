import type { CSSProperties } from "react";
import type { Project, Section, Page } from "./model";
import { safeImage, resolveLink, pageFiles } from "../shared/schema.mjs";
function Artwork() {
  return (
    <div
      className="architecture-art"
      aria-label="Decorative architectural illustration"
    >
      <i />
      <i />
      <i />
    </div>
  );
}
export function Block({
  section: s,
  project,
  heading = false,
}: {
  section: Section;
  project?: Project;
  heading?: boolean;
}) {
  const Heading = heading ? "h1" : "h2";
  const link = (href: string) =>
    project
      ? resolveLink(href, project)
      : href.startsWith("page:")
        ? "#"
        : resolveLink(href, { pages: [] });
  const cta = link(s.buttonHref);
  const isList = [
    "features",
    "pricing",
    "gallery",
    "team",
    "stats",
    "logos",
    "testimonials",
  ].includes(s.kind);
  return (
    <section
      id={`section-${s.id}`}
      className={`site-block block-${s.kind} variant-${s.variant} tone-${s.tone} spacing-${s.spacing}`}
    >
      <div className="block-copy">
        {s.eyebrow && <span className="eyebrow">{s.eyebrow}</span>}
        <Heading>{s.title}</Heading>
        {s.body && <p>{s.body}</p>}
        {s.buttonLabel && cta && (
          <a className="site-button" href={cta}>
            {s.buttonLabel} <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
      {["hero", "story"].includes(s.kind) &&
        (safeImage(s.image) ? (
          <img
            className="section-image"
            src={safeImage(s.image)}
            alt={s.imageAlt}
            loading={heading ? "eager" : "lazy"}
          />
        ) : (
          <Artwork />
        ))}
      {isList && (
        <div className={`content-grid grid-${s.kind}`}>
          {s.items.map((item, i) => (
            <article key={i}>
              {safeImage(item.image) && (
                <img
                  src={safeImage(item.image)}
                  alt={item.alt}
                  loading="lazy"
                />
              )}
              {s.kind === "features" && (
                <span className="item-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}
              {s.kind === "testimonials" ? (
                <blockquote>{item.body}</blockquote>
              ) : null}
              <h3>{item.title}</h3>
              {s.kind === "pricing" && (
                <strong className="price">{item.price}</strong>
              )}
              {s.kind !== "testimonials" && <p>{item.body}</p>}
              {item.label && link(item.href) && (
                <a className="site-button" href={link(item.href)}>
                  {item.label}
                </a>
              )}
            </article>
          ))}
        </div>
      )}
      {s.kind === "faq" && (
        <div className="faq-list">
          {s.items.map((item, i) => (
            <details key={i}>
              <summary>{item.title}</summary>
              <p>{item.body}</p>
            </details>
          ))}
        </div>
      )}
      {s.kind === "contact" && (
        <form
          className="site-contact-form"
          method="post"
          action="/api/contact"
          data-contact-form="true"
        >
          <input type="hidden" name="page" value={project?.name || "Website"} />
          <label>
            Your name
            <input name="name" autoComplete="name" required maxLength={100} />
          </label>
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={200}
            />
          </label>
          <label>
            How can we help?
            <textarea name="message" required minLength={10} maxLength={5000} />
          </label>
          <label className="form-honeypot" aria-hidden="true">
            Leave empty
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
          <button className="site-button" type="submit">
            Send message
          </button>
          <p role="status" aria-live="polite" className="form-status" />
        </form>
      )}
    </section>
  );
}
export function SitePage({
  project,
  page,
  wireframe = false,
  onSelectSection,
}: {
  project: Project;
  page: Page;
  wireframe?: boolean;
  onSelectSection?: (id: string) => void;
}) {
  const files = pageFiles(project);
  return (
    <div
      className={`site-page ${wireframe ? "wireframe" : ""}`}
      style={
        {
          "--site-accent": project.theme.accent,
          "--site-bg": project.theme.background,
          "--site-radius": `${project.theme.radius}px`,
          fontFamily: project.theme.font,
        } as CSSProperties
      }
    >
      <a className="skip-link" href="#site-main">
        Skip to content
      </a>
      <nav className="site-nav" aria-label="Main navigation">
        <a className="site-brand" href={files[0]}>
          {project.name}
        </a>
        <div>
          {project.pages.map(
            (p, i) =>
              !p.hideNav && (
                <a
                  key={p.id}
                  href={files[i]}
                  aria-current={p.id === page.id ? "page" : undefined}
                >
                  {p.name}
                </a>
              ),
          )}
        </div>
      </nav>
      <main id="site-main">
        {page.sections.map((s, i) => (
          <div key={s.id} className={onSelectSection ? "editable-block" : ""}>
            {onSelectSection && (
              <button
                className="edit-section-button"
                onClick={() => onSelectSection(s.id)}
              >
                Edit {s.kind}
              </button>
            )}
            <Block section={s} project={project} heading={i === 0} />
          </div>
        ))}
      </main>
      <footer id="site-contact">
        <strong>{project.name}</strong>
        <div>
          {project.settings.email && (
            <a href={`mailto:${project.settings.email}`}>
              {project.settings.email}
            </a>
          )}
          {project.settings.phone && (
            <a href={`tel:${project.settings.phone.replace(/[^+\d]/g, "")}`}>
              {project.settings.phone}
            </a>
          )}
          <p>
            {project.settings.footer ||
              `© ${new Date().getFullYear()} ${project.name}`}
          </p>
        </div>
      </footer>
    </div>
  );
}
