import { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "./model";
import { sourceTemplates } from "../shared/source-templates.mjs";
import {
  exportSourceTemplate,
  templatePreview,
  validTemplateUrl,
  type NativeElement,
  type SourceTemplate,
} from "./source-template-html";
import "./native-template-editor.css";
import TemplateTypography from "./TemplateTypography";
import { editableStyleProperties } from "./template-typography";
export default function NativeTemplateEditor({
  project,
  onChange,
  onBack,
  saveStatus,
}: {
  project: Project;
  onChange: (project: Project) => void;
  onBack: () => void;
  saveStatus: string;
}) {
  const native = project.nativeTemplate!,
    template = sourceTemplates.find(
      (t: SourceTemplate) => t.id === native.id,
    ) as SourceTemplate | undefined;
  const [html, setHtml] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState(""),
    [device, setDevice] = useState("desktop"),
    [interactionMode, setInteractionMode] = useState("edit"),
    [undo, setUndo] = useState<NonNullable<Project["nativeTemplate"]>[]>([]),
    [draft, setDraft] = useState({ text: "", href: "", src: "", alt: "" }),
    [css, setCss] = useState(native.customCss || "");
  useEffect(() => setCss(native.customCss || ""), [native.customCss]);
  const previewHash = useRef("");
  const iframe = useRef<HTMLIFrameElement>(null),
    nonce = useMemo(() => crypto.randomUUID(), [native.id, native.page]);
  function syncInteractionMode() {
    iframe.current?.contentWindow?.postMessage(
      {
        type: "studio-template-mode",
        nonce,
        editing: interactionMode === "edit",
        hash: previewHash.current,
      },
      "*",
    );
  }
  useEffect(syncInteractionMode, [interactionMode, nonce]);
  useEffect(() => {
    let alive = true;
    previewHash.current = "";
    setHtml("");
    setSelected("");
    setError("");
    if (!template || !template.pages.includes(native.page)) {
      setError("This source template or page is unavailable.");
      return;
    }
    fetch(`/templates/${template.id}/${native.page}`)
      .then((r) => {
        if (!r.ok) throw Error("Could not load the source template.");
        return r.text();
      })
      .then((text) => {
        if (alive) setHtml(text);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [template, native.page]);
  const preview = useMemo(
    () =>
      html && template
        ? templatePreview(
            html,
            native.page,
            native.edits,
            new URL(
              `/templates/${template.id}/${native.page.replace(/[^/]+$/, "")}`,
              location.origin,
            ).href,
            nonce,
            native.customCss,
          )
        : { html: "", elements: [] },
    [html, template, native.page, native.edits, native.customCss, nonce],
  );
  const element = preview.elements.find(
    (e: NativeElement) => e.id === selected,
  );
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (
        event.source !== iframe.current?.contentWindow ||
        event.data?.nonce !== nonce
      )
        return;
      if (
        event.data.type === "studio-template-location" &&
        typeof event.data.hash === "string" &&
        (!event.data.hash || event.data.hash.startsWith("#"))
      ) {
        previewHash.current = event.data.hash.slice(0, 500);
        return;
      }
      if (
        event.data.type === "studio-template-select" &&
        preview.elements.some((e: NativeElement) => e.id === event.data.id)
      )
        setSelected(event.data.id);
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [preview.elements, nonce]);
  useEffect(() => {
    setDraft({
      text: element?.text || "",
      href: element?.href || "",
      src: element?.src || "",
      alt: element?.alt || "",
    });
  }, [element?.id, element?.text, element?.href, element?.src, element?.alt]);
  function apply() {
    if (!element) return;
    setError("");
    if (
      element.href !== undefined &&
      draft.href &&
      !validTemplateUrl(draft.href)
    ) {
      setError(
        "Use a relative page, section anchor, https, mailto or tel destination.",
      );
      return;
    }
    if (element.src !== undefined && !validTemplateUrl(draft.src, true)) {
      setError("Use a relative image path or an https image URL.");
      return;
    }
    const edits = { ...native.edits };
    for (const field of ["text", "href", "src", "alt"] as const) {
      if (
        (field === "text" && element.canText) ||
        (field === "href" && element.href !== undefined) ||
        (["src", "alt"].includes(field) && element.src !== undefined)
      )
        edits[`${native.page}::${element.id}::${field}`] = draft[field];
    }
    setUndo((all) => [...all.slice(-29), native]);
    onChange({ ...project, nativeTemplate: { ...native, edits } });
  }
  return (
    <div className="native-editor">
      <header>
        <button onClick={onBack}>← Projects</button>
        <label>
          Project name
          <input
            value={project.name}
            maxLength={100}
            onChange={(e) => onChange({ ...project, name: e.target.value })}
          />
        </label>
        <span role="status">{saveStatus}</span>
        <button
          disabled={!undo.length}
          onClick={() => {
            const previous = undo[undo.length - 1];
            setUndo(undo.slice(0, -1));
            onChange({
              ...project,
              nativeTemplate: {
                ...native,
                edits: previous.edits,
                customCss: previous.customCss,
              },
            });
          }}
        >
          Undo
        </button>
        <button
          disabled={busy || !template}
          onClick={async () => {
            if (!template) return;
            setBusy(true);
            setError("");
            try {
              await exportSourceTemplate(project, template);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy
            ? "Preparing ZIP…"
            : template?.collection === "studio"
              ? "Export website source"
              : "Export original website"}
        </button>
      </header>
      <div className="native-editor-body">
        <aside>
          <h1>{template?.name || "Source website"}</h1>
          <p>
            Edit the actual template’s text, links, and images. Its original
            structure, styling, and assets stay intact.
          </p>
          {template?.adaptationLabel && <p>{template.adaptationLabel}</p>}
          {template && (
            <a href={template.sourceUrl} target="_blank" rel="noreferrer">
              Original source · {template.license}
            </a>
          )}
          <label>
            Template page
            <select
              value={native.page}
              onChange={(e) =>
                onChange({
                  ...project,
                  nativeTemplate: { ...native, page: e.target.value },
                })
              }
            >
              {template?.pages.map((page) => (
                <option key={page}>{page}</option>
              ))}
            </select>
          </label>
          <label>
            Preview mode
            <select
              value={interactionMode}
              onChange={(e) => setInteractionMode(e.target.value)}
            >
              <option value="edit">Edit content</option>
              <option value="interact">Interact · menus & sections</option>
            </select>
          </label>
          <p>
            Use Interact to open menus or sections, then switch to Edit content.
            External navigation and form submissions are disabled in this
            preview.
          </p>
          <label>
            Preview width
            <select value={device} onChange={(e) => setDevice(e.target.value)}>
              <option value="desktop">Desktop</option>
              <option value="tablet">Tablet · 768px</option>
              <option value="mobile">Mobile · 390px</option>
            </select>
          </label>
          <label>
            Editable element
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Click content in the preview</option>
              {preview.elements.map((e: NativeElement) => (
                <option key={e.id} value={e.id}>
                  {e.tag}: {(e.text || e.alt || e.src || e.id).slice(0, 70)}
                </option>
              ))}
            </select>
          </label>
          {element && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                apply();
              }}
            >
              {element.canText && (
                <label>
                  Text
                  <textarea
                    aria-label="Text"
                    value={draft.text}
                    maxLength={6000}
                    onChange={(e) =>
                      setDraft({ ...draft, text: e.target.value })
                    }
                  />
                </label>
              )}
              {element.href !== undefined && (
                <label>
                  Link destination
                  <input
                    value={draft.href}
                    maxLength={2000}
                    onChange={(e) =>
                      setDraft({ ...draft, href: e.target.value })
                    }
                  />
                </label>
              )}
              {element.src !== undefined && (
                <>
                  <label>
                    Image URL or path
                    <input
                      value={draft.src}
                      maxLength={2000}
                      onChange={(e) =>
                        setDraft({ ...draft, src: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Image description
                    <input
                      value={draft.alt}
                      maxLength={200}
                      onChange={(e) =>
                        setDraft({ ...draft, alt: e.target.value })
                      }
                    />
                  </label>
                </>
              )}
              <button>Apply edit</button>
            </form>
          )}
          {element?.canText && (
            <TemplateTypography
              elementId={element.id}
              values={Object.fromEntries(
                editableStyleProperties.map((key) => [
                  key,
                  native.edits[`${native.page}::${element.id}::style.${key}`] ||
                    "",
                ]),
              )}
              onApply={(values) => {
                const edits = { ...native.edits };
                for (const key of editableStyleProperties) {
                  const path = `${native.page}::${element.id}::style.${key}`;
                  if (values[key]) edits[path] = values[key];
                  else delete edits[path];
                }
                setUndo((all) => [...all.slice(-29), native]);
                onChange({ ...project, nativeTemplate: { ...native, edits } });
              }}
            />
          )}
          <details>
            <summary>Custom CSS</summary>
            <p>
              Customize the original template’s colors, typography, spacing, and
              layout. Changes are included in the ZIP.
            </p>
            <label>
              Template CSS
              <textarea
                value={css}
                maxLength={50000}
                onChange={(e) => setCss(e.target.value)}
                spellCheck={false}
              />
            </label>
            <button
              onClick={() => {
                setUndo((all) => [...all.slice(-29), native]);
                onChange({
                  ...project,
                  nativeTemplate: { ...native, customCss: css },
                });
              }}
            >
              Apply CSS
            </button>
          </details>
          {error && <p role="alert">{error}</p>}
          <p className="native-note">
            Original licensing credits are protected. This is a static website:
            source forms and buttons do not gain a database, payments, or
            booking backend automatically.
          </p>
        </aside>
        <main>
          <div className={`native-preview native-device-${device}`}>
            {preview.html ? (
              <iframe
                key={`${native.id}/${native.page}`}
                ref={iframe}
                onLoad={syncInteractionMode}
                title="Original template preview"
                sandbox="allow-scripts"
                srcDoc={preview.html}
              />
            ) : (
              <p>Loading original source…</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
