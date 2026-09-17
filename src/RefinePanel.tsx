import { useState, useEffect } from "react";
import type { Page, Project, Section } from "./model";
import { sectionSchema } from "../shared/schema.mjs";
import { readJson } from "./read-json";
export default function RefinePanel({
  project,
  page,
  section,
  onApply,
  onClose,
}: {
  project: Project;
  page: Page;
  section?: Section;
  onApply: (sections: Section[]) => void;
  onClose: () => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Section[] | null>(null);
  const [status, setStatus] = useState<{
    configured: boolean;
    model?: string;
  }>();
  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() =>
        setError("The local API is not running. Start npm run dev."),
      );
  }, []);
  async function refine() {
    setError("");
    setBusy(true);
    try {
      const contextPage = {
        ...page,
        sections: page.sections.map((s) => ({
          ...s,
          image: s.image.startsWith("data:") ? "" : s.image,
          items: s.items.map((item) => ({
            ...item,
            image: item.image.startsWith("data:") ? "" : item.image,
          })),
        })),
      };
      const response = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: project.name,
          brief: project.brief,
          pages: project.pages.map((p) => ({ id: p.id, name: p.name })),
          page: contextPage,
          sectionId: section?.id,
          instruction,
        }),
      });
      const result = await readJson(response);
      if (!response.ok) throw new Error(result.error);
      setDraft(
        result.sections.map((value: unknown) => {
          const s = sectionSchema.parse(value);
          const original = page.sections.find((x) => x.id === s.id);
          return {
            ...s,
            image: s.image || original?.image || "",
            items: s.items.map((item, i) => ({
              ...item,
              image: item.image || original?.items[i]?.image || "",
            })),
          };
        }),
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not refine this content.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <div
        className="modal refine-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Refine with AI"
      >
        <button
          className="modal-close"
          disabled={busy}
          onClick={onClose}
          aria-label="Close AI editor"
        >
          ✕
        </button>
        <h2>Develop {section ? section.kind : page.name} with AI</h2>
        <p>
          {section
            ? "Change this section while keeping the rest of the site intact."
            : "Develop this page using the site brief and existing content."}
        </p>
        {status && !status.configured && (
          <div className="connection-note">
            No model is configured. Set OLLAMA_MODEL in .env and restart the
            API. Manual editing and export work without AI.
          </div>
        )}
        <label>
          What should change?
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Make the hero speak to small architecture firms. Add a clear project enquiry button and keep the tone direct."
            maxLength={4000}
          />
        </label>
        <button
          className="primary full"
          disabled={busy || instruction.trim().length < 5}
          onClick={() => void refine()}
        >
          {busy
            ? "Developing your draft…"
            : draft
              ? "Revise draft"
              : "Generate a draft"}
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {draft && (
          <div className="draft-review">
            <h3>Review proposed changes</h3>
            <p>Your current page stays unchanged until you apply this draft.</p>
            {draft.map((s) => (
              <article key={s.id}>
                <small>{s.kind}</small>
                <h4>{s.title}</h4>
                <p>{s.body}</p>
                {s.items.length > 0 && (
                  <ul>
                    {s.items.map((item, i) => (
                      <li key={i}>
                        <strong>{item.title}</strong> {item.body}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
            <button
              className="dark-button full"
              onClick={() => {
                onApply(draft);
                onClose();
              }}
            >
              Apply draft
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
