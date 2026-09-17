import { useState } from "react";
import type { Project } from "./model";
import { api } from "./backend-api";
import AppDesignPreview from "./AppDesignPreview";
type Draft = {
  summary: string;
  app: NonNullable<Project["app"]>;
  unsupported: string[];
  baseFingerprint: string;
};
export default function AppDesignAI({
  project,
  onChange,
  onClose,
}: {
  project: Project;
  onChange: (p: Project) => void;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [original, setOriginal] = useState("");
  return (
    <div className="modal-backdrop">
      <section
        className="design-ai-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Develop app design with AI"
      >
        <header className="backend-actions">
          <div>
            <span className="app-eyebrow">DESIGN DEVELOPMENT</span>
            <h2>Shape the way your app works.</h2>
          </div>
          <button disabled={busy} onClick={onClose}>
            Close
          </button>
        </header>
        <p>
          Describe the visual direction, screens, metrics and charts you need.
          Review the rendered draft before applying it to your project.
        </p>
        <label>
          Design instructions
          <textarea
            rows={4}
            maxLength={8000}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="An editorial client portal with warm paper colors, top navigation, compact request table, a request-status chart and a project count."
          />
        </label>
        <button
          className="dark-button"
          disabled={busy || prompt.trim().length < 10}
          onClick={async () => {
            setBusy(true);
            setError("");
            setDraft(null);
            const snapshot = JSON.stringify(project);
            try {
              const result = await api<Draft>(
                `/api/projects/${project.id}/design-ai/preview`,
                { prompt, project },
              );
              setOriginal(snapshot);
              setDraft(result);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Developing design…" : "Generate design preview"}
        </button>
        {error && <p role="alert">{error}</p>}
        {draft && (
          <>
            <h3>{draft.summary}</h3>
            {draft.unsupported.length > 0 && (
              <div>
                <strong>Outside this draft</strong>
                <ul>
                  {draft.unsupported.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="design-ai-preview">
              <AppDesignPreview project={{ ...project, app: draft.app }} />
            </div>
            <div className="backend-actions">
              <span>
                This changes app screens and styling. Existing records remain
                intact.
              </span>
              <button
                className="dark-button"
                onClick={() => {
                  if (JSON.stringify(project) !== original) {
                    setError(
                      "The project changed while you reviewed this draft. Generate a new preview to preserve those edits.",
                    );
                    return;
                  }
                  onChange({ ...project, app: draft.app });
                  onClose();
                }}
              >
                Apply design draft
              </button>
              <button onClick={() => setDraft(null)}>Discard</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
