import { useEffect, useState } from "react";
import type { Project } from "./model";
import AccountForm from "./AccountForm";
import BackendAI from "./BackendAI";
import AutomationPanel from "./AutomationPanel";
import CollectionSchemaEditor from "./CollectionSchemaEditor";
import MembersPanel from "./MembersPanel";
import ProjectHistory from "./ProjectHistory";
import {
  saveServerProject,
  acceptServerProject,
  seedCloudProject,
  resetCloudAccount,
} from "./cloud-projects";
import {
  api,
  type Collection,
  type Field,
  type DataRecord,
} from "./backend-api";
type Backend = {
  collections: Collection[];
  publication: { slug: string; revision: number } | null;
  members: number;
  submissions: { id: string; name: string; email: string; message: string }[];
};
export default function BackendPanel({
  project,
  onClose,
  onProjectRestored,
}: {
  project: Project;
  onClose: () => void;
  onProjectRestored: (project: Project) => void;
}) {
  const [user, setUser] = useState<any>(undefined);
  const [backend, setBackend] = useState<Backend | null>(null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [slug, setSlug] = useState(
    project.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 45) || "my-app",
  );
  const [fields, setFields] = useState<Field[]>([
    { name: "title", label: "Title", type: "text", required: true },
  ]);
  const [schemaCollection, setSchemaCollection] = useState<Collection | null>(
    null,
  );
  const [records, setRecords] = useState<DataRecord[] | null>(null);
  const refresh = async () => {
    const b = await api<Backend>(`/api/projects/${project.id}/backend`);
    setBackend(b);
    if (b.publication) setSlug(b.publication.slug);
  };
  const session = async () => {
    try {
      const s = await api("/api/auth/get-session");
      if (s?.user) resetCloudAccount(s.user.id);
      setUser(s?.user || null);
    } catch (e) {
      setError((e as Error).message);
      setUser(null);
    }
  };
  useEffect(() => {
    void session();
  }, []);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const projects =
          await api<{ document: Project; revision: number }[]>("/api/projects");
        const saved = projects.find((p) => p.document.id === project.id);
        if (cancelled) return;
        if (saved) seedCloudProject(saved);
        setRevision(saved?.revision || 0);
        if (saved) await refresh();
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    const next = await saveServerProject(project, revision);
    setRevision(next);
    return next;
  };
  return (
    <div className="modal-backdrop">
      <section
        className="backend-panel"
        role="dialog"
        aria-modal="true"
        aria-label="App backend"
      >
        <header className="backend-actions">
          <h2>App backend</h2>
          <button onClick={onClose}>Close</button>
        </header>
        <p>
          Publish this website with member accounts and a persistent database.
          Each collection gets a form and record list in the app’s Data &
          account area.
        </p>
        {error && (
          <p role="alert" className="backend-error">
            {error}
          </p>
        )}
        {user === undefined ? (
          <p>Connecting…</p>
        ) : !user ? (
          <>
            <p>
              Sign in as the app owner to configure and publish its backend.
            </p>
            <AccountForm onDone={() => void session()} />
          </>
        ) : (
          <>
            <div className="backend-actions">
              <span>Owner: {user.email}</span>
              {localStorage.getItem("studio-workspace-mode") !== "server" && (
                <button
                  onClick={() =>
                    void run(async () => {
                      await api("/api/auth/sign-out", {});
                      setUser(null);
                      setBackend(null);
                      setRevision(0);
                    })
                  }
                >
                  Sign out
                </button>
              )}
            </div>
            <p>
              The editor saves locally. “Save backend project” uploads the
              current version; publishing updates the live site. Database
              records persist across publishes.
            </p>
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await save();
                  await refresh();
                })
              }
            >
              Save backend project
            </button>
            {backend && (
              <>
                <ProjectHistory
                  projectId={project.id}
                  beforeRestore={async () => {
                    await save();
                  }}
                  onRestored={async (snapshot) => {
                    await acceptServerProject(snapshot);
                    setRevision(snapshot.revision);
                    onProjectRestored(snapshot.document);
                    await refresh();
                  }}
                />
                <BackendAI projectId={project.id} onApplied={refresh} />
                <h3>Database collections</h3>
                <p>
                  Private collections show members only their own records.
                  Public collections expose every record to visitors. The app
                  owner can inspect all records.
                </p>
                {backend.collections.map((c) => (
                  <div className="backend-collection" key={c.id}>
                    <strong>{c.name}</strong>
                    <span>
                      {c.public_read
                        ? "Public reads"
                        : "Private member records"}{" "}
                      · {c.fields.length} fields
                    </span>
                    <button onClick={() => setSchemaCollection(c)}>
                      Edit schema & rules
                    </button>
                    <button
                      onClick={() =>
                        void run(async () =>
                          setRecords(
                            await api(
                              `/api/projects/${project.id}/collections/${c.id}/records`,
                            ),
                          ),
                        )
                      }
                    >
                      Inspect records
                    </button>
                  </div>
                ))}
                {schemaCollection && (
                  <CollectionSchemaEditor
                    projectId={project.id}
                    collection={schemaCollection}
                    collections={backend.collections}
                    onApplied={async () => {
                      setSchemaCollection(null);
                      await refresh();
                    }}
                  />
                )}
                {records && (
                  <div>
                    <h4>Most recent records (up to 100)</h4>
                    <pre>{JSON.stringify(records, null, 2)}</pre>
                    <button onClick={() => setRecords(null)}>
                      Hide records
                    </button>
                  </div>
                )}
                <form
                  className="backend-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const f = new FormData(form);
                    void run(async () => {
                      await api(`/api/projects/${project.id}/collections`, {
                        name: f.get("name"),
                        fields,
                        publicRead: f.get("publicRead") === "on",
                        memberCreate: true,
                      });
                      await refresh();
                      form.reset();
                      setFields([
                        {
                          name: "title",
                          label: "Title",
                          type: "text",
                          required: true,
                        },
                      ]);
                    });
                  }}
                >
                  <label>
                    Collection name
                    <input
                      name="name"
                      placeholder="Tasks, requests, bookings…"
                      required
                      maxLength={80}
                    />
                  </label>
                  {fields.map((field, i) => (
                    <fieldset key={i}>
                      <legend>Field {i + 1}</legend>
                      <label>
                        Field key
                        <input
                          aria-label={`Field ${i + 1} key`}
                          value={field.name}
                          required
                          pattern="[a-z][a-z0-9_]{0,39}"
                          onChange={(e) =>
                            setFields((fs) =>
                              fs.map((f, j) =>
                                j === i ? { ...f, name: e.target.value } : f,
                              ),
                            )
                          }
                        />
                      </label>
                      <label>
                        Label
                        <input
                          value={field.label}
                          required
                          onChange={(e) =>
                            setFields((fs) =>
                              fs.map((f, j) =>
                                j === i ? { ...f, label: e.target.value } : f,
                              ),
                            )
                          }
                        />
                      </label>
                      <label>
                        Type
                        <select
                          value={field.type}
                          onChange={(e) =>
                            setFields((fs) =>
                              fs.map((f, j) =>
                                j === i
                                  ? {
                                      ...f,
                                      type: e.target.value as Field["type"],
                                    }
                                  : f,
                              ),
                            )
                          }
                        >
                          {["text", "number", "boolean", "email", "date"].map(
                            (t) => (
                              <option key={t}>{t}</option>
                            ),
                          )}
                        </select>
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) =>
                            setFields((fs) =>
                              fs.map((f, j) =>
                                j === i
                                  ? { ...f, required: e.target.checked }
                                  : f,
                              ),
                            )
                          }
                        />{" "}
                        Required
                      </label>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setFields((fs) => fs.filter((_, j) => j !== i))
                          }
                        >
                          Remove field
                        </button>
                      )}
                    </fieldset>
                  ))}
                  <button
                    type="button"
                    disabled={fields.length >= 20}
                    onClick={() =>
                      setFields((fs) => [
                        ...fs,
                        {
                          name: `field_${fs.length + 1}`,
                          label: "New field",
                          type: "text",
                          required: false,
                        },
                      ])
                    }
                  >
                    Add field
                  </button>
                  <label>
                    <input name="publicRead" type="checkbox" /> Allow anyone to
                    read this collection
                  </label>
                  <button disabled={busy}>Create collection</button>
                </form>
                <MembersPanel projectId={project.id} />
                <AutomationPanel projectId={project.id} />
                <h3>Publish</h3>
                <label>
                  Site address
                  <input
                    aria-label="Site address"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </label>
                <div className="backend-actions">
                  <button
                    disabled={busy}
                    className="dark-button"
                    onClick={() =>
                      void run(async () => {
                        const rev = await save();
                        await api(`/api/projects/${project.id}/publish`, {
                          slug,
                          revision: rev,
                        });
                        await refresh();
                      })
                    }
                  >
                    Publish app
                  </button>
                  {backend.publication && (
                    <>
                      <a
                        href={`/sites/${backend.publication.slug}/`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open published app
                      </a>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await api(
                              `/api/projects/${project.id}/publish`,
                              undefined,
                              "DELETE",
                            );
                            await refresh();
                          })
                        }
                      >
                        Unpublish
                      </button>
                    </>
                  )}
                </div>
                <p>
                  {backend.members} app members. Member accounts are separate
                  from your builder login; members use one identity across apps
                  on this host, with separate memberships and data.
                </p>
                <h3>Contact submissions</h3>
                {backend.submissions.length ? (
                  backend.submissions.map((s) => (
                    <article key={s.id}>
                      <strong>
                        {s.name} · {s.email}
                      </strong>
                      <p>{s.message}</p>
                    </article>
                  ))
                ) : (
                  <p>No messages yet.</p>
                )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
