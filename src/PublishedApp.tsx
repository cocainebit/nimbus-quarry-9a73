import { useEffect, useState } from "react";
import { SitePage } from "./blocks";
import type { Project } from "./model";
import { pageFiles } from "../shared/schema.mjs";
import AccountForm from "./AccountForm";
import AppWorkspace from "./AppWorkspace";
import { RecordFields } from "./RecordFields";
import RuntimeFiles from "./RuntimeFiles";
import { api, type Collection, type DataRecord } from "./backend-api";
function CollectionView({
  collection,
  base,
  signedIn,
}: {
  collection: Collection;
  base: string;
  signedIn: boolean;
}) {
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [editing, setEditing] = useState<DataRecord | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [offset, setOffset] = useState(0);
  const path = `${base}/collections/${collection.id}/records`;
  const load = async () => {
    try {
      setRecords(await api(`${path}?offset=${offset}`));
      setError("");
    } catch (e) {
      setRecords([]);
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    void load();
  }, [path, signedIn, offset]);
  const visibleRecords = signedIn || collection.public_read ? records : [];
  return (
    <section className="backend-collection-view">
      <h2>{collection.name}</h2>
      <p>
        {collection.public_read
          ? "Visible to everyone."
          : "Your private records."}
      </p>
      {error && <p role="alert">{error}</p>}
      {signedIn && (collection.member_create || editing) && (
        <form
          className="backend-form"
          key={editing?.id || "new"}
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const form = e.currentTarget;
            const fd = new FormData(form);
            const data: Record<string, unknown> = {};
            for (const f of collection.fields) {
              const value = fd.get(f.name);
              if (f.type === "boolean") data[f.name] = value === "on";
              else if (value !== null && value !== "")
                data[f.name] = f.type === "number" ? Number(value) : value;
            }
            try {
              await api(
                editing ? `${path}/${editing.id}` : path,
                editing ? { data, version: editing.version } : { data },
                editing ? "PATCH" : "POST",
              );
              form.reset();
              setEditing(null);
              await load();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h3>{editing ? "Edit record" : "New record"}</h3>
          <RecordFields
            fields={collection.fields}
            base={base}
            record={editing}
          />
          <button disabled={busy}>
            {busy ? "Saving…" : editing ? "Save record" : "Add record"}
          </button>
          {editing && (
            <button type="button" onClick={() => setEditing(null)}>
              Cancel edit
            </button>
          )}
        </form>
      )}
      {!visibleRecords.length && <p>No records to display.</p>}
      {visibleRecords.map((r) => (
        <article className="backend-record" key={r.id}>
          <dl>
            {collection.fields.map((f) => (
              <div key={f.name}>
                <dt>{f.label}</dt>
                <dd>{String(r.data[f.name] ?? "—")}</dd>
              </div>
            ))}
          </dl>
          {signedIn && r.canEdit && (
            <div className="backend-actions">
              <button onClick={() => setEditing(r)}>Edit record</button>
              <button
                disabled={busy}
                onClick={async () => {
                  if (!confirm("Delete this record?")) return;
                  setBusy(true);
                  try {
                    await api(
                      `${path}/${r.id}`,
                      { version: r.version },
                      "DELETE",
                    );
                    if (editing?.id === r.id) setEditing(null);
                    await load();
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Delete record
              </button>
            </div>
          )}
        </article>
      ))}
      <div className="backend-actions">
        <button
          disabled={offset === 0}
          onClick={() => setOffset((v) => Math.max(0, v - 100))}
        >
          Previous
        </button>
        <button
          disabled={records.length < 100}
          onClick={() => setOffset((v) => v + 100)}
        >
          Next
        </button>
        <button onClick={() => void load()}>Refresh records</button>
      </div>
    </section>
  );
}
export default function PublishedApp() {
  const parts = location.pathname.split("/").filter(Boolean);
  const slug = parts[1];
  const base = `/api/apps/${encodeURIComponent(slug)}`;
  const [data, setData] = useState<{
    project: Project;
    collections: Collection[];
  } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const session = async () => {
    const s = await api("/api/member-auth/get-session");
    if (s?.user) await api(`${base}/join`, {});
    setUser(s?.user || null);
  };
  useEffect(() => {
    if (location.pathname === `/sites/${slug}`) {
      location.replace(`/sites/${slug}/`);
      return;
    }
    (async () => {
      try {
        setData(await api(base));
        await session();
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [base]);
  if (!data)
    return (
      <main className="backend-page">
        <h1>{error ? "App unavailable" : "Loading app…"}</h1>
        <p>{error}</p>
      </main>
    );
  if (data.project.app)
    return (
      <AppWorkspace
        project={data.project}
        collections={data.collections}
        base={base}
        user={user}
        onSession={session}
      />
    );
  const filename = parts[2] || "index.html";
  const index = pageFiles(data.project).indexOf(filename);
  const dataPage = filename === "account";
  if (index === -1 && !dataPage)
    return (
      <main className="backend-page">
        <h1>Page not found</h1>
        <a href={`/sites/${slug}/`}>Return home</a>
      </main>
    );
  return (
    <>
      <div className="runtime-toolbar">
        <a href={`/sites/${slug}/`}>{data.project.name}</a>
        <a href={`/sites/${slug}/account`}>Data & account</a>
      </div>
      {error && <p role="alert">{error}</p>}
      {dataPage ? (
        <main className="backend-page">
          <h1>Data & account</h1>
          {user ? (
            <div className="backend-actions">
              <p>Signed in as {user.email}</p>
              <button
                onClick={async () => {
                  try {
                    await api("/api/member-auth/sign-out", {});
                    setUser(null);
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <>
              <p>
                Sign in to create and manage your records. Your account works
                across apps on this host; each app keeps its own membership and
                data.
              </p>
              <AccountForm
                member
                onDone={() => {
                  void session().catch((e) => setError(e.message));
                }}
              />
            </>
          )}
          {data.collections.map((c) => (
            <CollectionView
              key={c.id}
              collection={c}
              base={base}
              signedIn={!!user}
            />
          ))}
          {!data.collections.length && (
            <p>This app has no data collections yet.</p>
          )}
        </main>
      ) : (
        <div
          onSubmit={async (e) => {
            const form = e.target as HTMLFormElement;
            if (!form.matches("[data-contact-form]")) return;
            e.preventDefault();
            const fd = new FormData(form);
            const button = form.querySelector("button");
            if (button) button.disabled = true;
            setNotice("Sending…");
            try {
              await api(
                `${base}/contact`,
                Object.fromEntries(
                  ["name", "email", "message", "website"].map((k) => [
                    k,
                    fd.get(k) || "",
                  ]),
                ),
              );
              setNotice("Your message has been received.");
              form.reset();
            } catch (e) {
              setNotice((e as Error).message);
            } finally {
              if (button) button.disabled = false;
            }
          }}
        >
          <SitePage project={data.project} page={data.project.pages[index]} />
          <p className="backend-page" role="status">
            {notice}
          </p>
        </div>
      )}
    </>
  );
}
