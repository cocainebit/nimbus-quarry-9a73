import { useState } from "react";
import { api } from "./backend-api";
type Draft = {
  token: string;
  limits: string[];
  plan: {
    summary: string;
    unsupported: string[];
    collections: {
      key: string;
      definition: {
        name: string;
        publicRead: boolean;
        memberCreate: boolean;
        editorAccess?: boolean;
        fields: {
          name: string;
          label: string;
          type: string;
          required?: boolean;
          referenceCollectionId?: string;
          options?: string[];
          unique?: boolean;
          immutable?: boolean;
          transitions?: Record<string, string[]>;
          min?: number;
          max?: number;
        }[];
      };
    }[];
  };
};
export default function BackendAI({
  projectId,
  onApplied,
}: {
  projectId: string;
  onApplied: () => void | Promise<void>;
}) {
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function generate() {
    setBusy(true);
    setError("");
    setMessage("");
    setDraft(null);
    try {
      setDraft(
        await api<Draft>(`/api/projects/${projectId}/backend-ai/preview`, {
          prompt,
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function apply() {
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/projects/${projectId}/backend-ai/apply`, {
        token: draft.token,
      });
      setDraft(null);
      setMessage(
        "Backend collections created. Connect them to data sections in your pages.",
      );
      await onApplied();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="backend-ai">
      <h3>Generate a backend</h3>
      <p>
        Describe the data your app needs, relationships, access permissions, and
        validation rules. Review the draft before applying it.
      </p>
      <label>
        Backend requirements
        <textarea
          aria-label="Backend requirements"
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setDraft(null);
          }}
          rows={5}
          maxLength={8000}
          disabled={busy}
          placeholder="A private project tracker: projects with unique names, tasks belonging to projects, and todo → in_progress → done status transitions."
        />
      </label>
      <button
        disabled={busy || prompt.trim().length < 10}
        onClick={() => void generate()}
      >
        {busy ? "Working…" : "Preview backend"}
      </button>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {draft && (
        <div>
          <h4>Review backend draft</h4>
          <p>{draft.plan.summary}</p>
          {draft.plan.collections.map((c) => (
            <article key={c.key}>
              <h4>{c.definition.name}</h4>
              <p>
                {c.definition.publicRead
                  ? "Public reading"
                  : "Private member records"}{" "}
                ·{" "}
                {c.definition.memberCreate
                  ? "Members can create"
                  : "Owner creates records"}
                {c.definition.editorAccess
                  ? " · Editors can access all records"
                  : ""}
              </p>
              <ul>
                {c.definition.fields.map((f) => (
                  <li key={f.name}>
                    <strong>{f.label}</strong> ({f.name}): {f.type}
                    {f.required ? " · required" : ""}
                    {f.referenceCollectionId
                      ? ` → ${f.referenceCollectionId}`
                      : ""}
                    {f.options ? ` · ${f.options.join(", ")}` : ""}
                    {f.unique ? " · unique" : ""}
                    {f.immutable ? " · immutable" : ""}
                    {f.min !== undefined ? ` · minimum ${f.min}` : ""}
                    {f.max !== undefined ? ` · maximum ${f.max}` : ""}
                    {f.transitions
                      ? ` · transitions ${JSON.stringify(f.transitions)}`
                      : ""}
                  </li>
                ))}
              </ul>
            </article>
          ))}
          {draft.plan.unsupported.length > 0 && (
            <>
              <h4>Requested capabilities not implemented by this draft</h4>
              <ul>
                {draft.plan.unsupported.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}
          <details>
            <summary>Generation limits</summary>
            <ul>
              {draft.limits.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </details>
          <p>
            Applying adds {draft.plan.collections.length} collections. Review
            public access and field rules above. This draft expires after 30
            minutes.
          </p>
          <button
            disabled={busy || draft.plan.collections.length === 0}
            onClick={() => void apply()}
          >
            Apply backend draft
          </button>
          <button disabled={busy} onClick={() => setDraft(null)}>
            Discard draft
          </button>
        </div>
      )}
    </section>
  );
}
