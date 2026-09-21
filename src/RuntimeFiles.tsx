import { confirmDialog } from "./dialogs";
import { useEffect, useState, useRef } from "react";
import { api } from "./backend-api";
export default function RuntimeFiles({ base }: { base: string }) {
  const [files, setFiles] = useState<
    { id: string; name: string; size: number }[]
  >([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const context = useRef(base);
  context.current = base;
  const mounted = useRef(true);
  const load = async () => {
    const source = base;
    const data = await api(`${base}/files`);
    if (mounted.current && source === context.current) setFiles(data);
  };
  useEffect(() => {
    mounted.current = true;
    setFiles([]);
    void load().catch((e) => mounted.current && setError(e.message));
    return () => {
      mounted.current = false;
    };
  }, [base]);
  return (
    <section className="runtime-files">
      <div className="app-section-heading">
        <div>
          <h2>Your files</h2>
          <p>Private attachments for your work. Up to 5 MB each.</p>
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      <label className="file-drop">
        {busy ? "Uploading…" : "Upload a file"}
        <input
          type="file"
          disabled={busy}
          accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.csv"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            setError("");
            try {
              if (f.size > 5 * 1024 * 1024)
                throw Error("Maximum file size is 5 MB.");
              const base64 = await new Promise<string>((resolve, reject) => {
                const r = new FileReader();
                r.onload = () => resolve(String(r.result).split(",")[1]);
                r.onerror = () => reject(Error("Cannot read file."));
                r.readAsDataURL(f);
              });
              await api(`${base}/files`, {
                name: f.name,
                mime:
                  (
                    {
                      png: "image/png",
                      jpg: "image/jpeg",
                      jpeg: "image/jpeg",
                      webp: "image/webp",
                      pdf: "application/pdf",
                      txt: "text/plain",
                      csv: "text/csv",
                    } as Record<string, string>
                  )[f.name.split(".").at(-1)?.toLowerCase() || ""] || f.type,
                base64,
              });
              await load();
              e.target.value = "";
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {files.length ? (
        <div className="file-list">
          {files.map((f) => (
            <div key={f.id}>
              <span>↗</span>
              <a href={`${base}/files/${f.id}`}>{f.name}</a>
              <small>{Math.ceil(f.size / 1024)} KB</small>
              <button
                disabled={busy}
                onClick={async () => {
                  if (
                    !(await confirmDialog(`Delete ${f.name}?`, {
                      confirmLabel: "Delete",
                      danger: true,
                    }))
                  )
                    return;
                  try {
                    await api(`${base}/files/${f.id}`, undefined, "DELETE");
                    await load();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="app-empty">
          <h3>A place for your project files</h3>
          <p>
            Upload a document, then attach it to a record using a file field.
          </p>
        </div>
      )}
    </section>
  );
}
