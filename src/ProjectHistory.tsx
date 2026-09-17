import { useEffect, useState } from "react";
import { api } from "./backend-api";
import type { Project } from "./model";
type Snapshot = { document: Project; revision: number };
type History = {
  currentRevision: number;
  revisions: { revision: number; created_at: string; name: string }[];
};
export default function ProjectHistory({
  projectId,
  onRestored,
  beforeRestore,
}: {
  projectId: string;
  onRestored: (snapshot: Snapshot) => void | Promise<void>;
  beforeRestore?: () => Promise<void>;
}) {
  const [history, setHistory] = useState<History | null>(null),
    [selected, setSelected] = useState<Snapshot | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [offset, setOffset] = useState(0);
  async function load() {
    setHistory(
      await api<History>(`/api/projects/${projectId}/history?offset=${offset}`),
    );
  }
  useEffect(() => {
    let active = true;
    setSelected(null);
    api<History>(`/api/projects/${projectId}/history?offset=${offset}`)
      .then((h) => {
        if (active) setHistory(h);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [projectId, offset]);
  async function inspect(revision: number) {
    setBusy(true);
    setError("");
    try {
      setSelected(
        await api<Snapshot>(`/api/projects/${projectId}/history/${revision}`),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function restore() {
    if (!selected || !history) return;
    setBusy(true);
    setError("");
    try {
      await beforeRestore?.();
      const latest = await api<History>(`/api/projects/${projectId}/history`);
      if (latest.currentRevision !== history.currentRevision) {
        setHistory(latest);
        setOffset(0);
        throw Error(
          "The project changed. Review the latest history and confirm again.",
        );
      }
      const result = await api<Snapshot>(
        `/api/projects/${projectId}/history/${selected.revision}/restore`,
        { expectedRevision: history.currentRevision },
      );
      await onRestored(result);
      setSelected(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="backend-section">
      <h3>Project history</h3>
      <p>
        Inspect saved versions and restore page designs. Collections, records,
        users, and the published version remain unchanged.
      </p>
      {error && <p role="alert">{error}</p>}
      {!history && <p>Loading history…</p>}
      <div>
        {history?.revisions.map((r) => (
          <button
            key={r.revision}
            disabled={busy}
            onClick={() => void inspect(r.revision)}
          >
            Version {r.revision} · {r.name} ·{" "}
            {new Date(r.created_at).toLocaleString()}
          </button>
        ))}
      </div>
      <div>
        <button
          disabled={busy || offset === 0}
          onClick={() => setOffset(Math.max(0, offset - 50))}
        >
          Newer versions
        </button>
        <button
          disabled={busy || (history?.revisions.length || 0) < 50}
          onClick={() => setOffset(offset + 50)}
        >
          Older versions
        </button>
      </div>
      {selected && (
        <div>
          <h4>Restore version {selected.revision}?</h4>
          <p>
            {selected.document.name} · {selected.document.pages.length} pages
            {selected.document.app
              ? ` · ${selected.document.app.navigation.length} app screens`
              : ""}
          </p>
          <details>
            <summary>Inspect saved document</summary>
            <pre
              style={{
                maxHeight: 250,
                overflow: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {JSON.stringify(selected.document, null, 2)}
            </pre>
          </details>
          <p>
            This creates a new saved version. You can restore the current
            version later.
          </p>
          <button
            disabled={busy || selected.revision === history?.currentRevision}
            onClick={() => void restore()}
          >
            {busy ? "Working…" : "Confirm restore"}
          </button>
          <button disabled={busy} onClick={() => setSelected(null)}>
            Cancel
          </button>
        </div>
      )}
    </section>
  );
}
