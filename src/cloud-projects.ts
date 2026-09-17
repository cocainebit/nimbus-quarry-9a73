import { normalizeProject, type Project } from "./model";
type Snapshot = { document: Project; revision: number };
const snapshots = new Map<string, Snapshot>();
let queue: Promise<unknown> = Promise.resolve();
let account = "";
let epoch = 0;
export function resetCloudAccount(id: string) {
  if (id !== account) {
    account = id;
    epoch++;
    snapshots.clear();
  }
}
function guard(identity: string, version: number) {
  if (!identity || identity !== account || version !== epoch)
    throw Error("The signed-in account changed. Reopen your workspace.");
}
async function request<T>(
  path: string,
  identity: string,
  version: number,
  body?: unknown,
  method = body === undefined ? "GET" : "PUT",
): Promise<T> {
  guard(identity, version);
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: {
      "X-Studio-Account": identity,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  guard(identity, version);
  if (!response.ok)
    throw Error(
      result.error?.message || result.error || "Project request failed.",
    );
  return result;
}
export function seedCloudProject(snapshot: Snapshot) {
  if (!snapshots.has(snapshot.document.id))
    snapshots.set(snapshot.document.id, structuredClone(snapshot));
}
export function cloudRevision(id: string) {
  return snapshots.get(id)?.revision || 0;
}
export async function listServerProjects(accept: () => boolean = () => true) {
  const identity = account,
    version = epoch;
  const all: Snapshot[] = [];
  for (let offset = 0; ; offset += 100) {
    const rows = await request<Snapshot[]>(
      `/api/projects?offset=${offset}`,
      identity,
      version,
    );
    all.push(...rows);
    if (rows.length < 100) break;
    if (offset >= 10000) throw Error("Too many projects to load.");
  }
  guard(identity, version);
  if (!accept())
    throw Error(
      "Your workspace changed while loading. Your edits are preserved; try again.",
    );
  snapshots.clear();
  for (const row of all)
    snapshots.set(row.document.id, {
      ...row,
      document: normalizeProject(row.document),
    });
  return all.map((row) => normalizeProject(row.document));
}
export function saveServerProject(
  project: Project,
  expectedRevision?: number,
): Promise<number> {
  const identity = account,
    version = epoch,
    document = normalizeProject(structuredClone(project));
  const task = queue
    .catch(() => {})
    .then(async () => {
      guard(identity, version);
      const current = snapshots.get(document.id);
      if (
        current &&
        JSON.stringify(current.document) === JSON.stringify(document)
      )
        return current.revision;
      const revision = current?.revision ?? expectedRevision ?? 0;
      const result = await request<{ revision: number }>(
        `/api/projects/${document.id}`,
        identity,
        version,
        { project: document, revision },
      );
      snapshots.set(document.id, { document, revision: result.revision });
      return result.revision;
    });
  queue = task;
  return task;
}
export async function archiveServerProject(id: string) {
  const identity = account,
    version = epoch;
  await queue;
  await request(
    `/api/projects/${id}`,
    identity,
    version,
    { revision: cloudRevision(id) },
    "DELETE",
  );
  snapshots.delete(id);
}
export async function flushServerProjects() {
  await queue;
}

export async function acceptServerProject(snapshot: {
  document: Project;
  revision: number;
}) {
  const identity = account,
    version = epoch;
  await queue;
  guard(identity, version);
  const session = await fetch("/api/auth/get-session", {
    credentials: "same-origin",
  }).then((r) => {
    if (!r.ok)
      throw Error("Could not verify your account. Reload before restoring.");
    return r.json();
  });
  guard(identity, version);
  if (session?.user?.id !== identity)
    throw Error("Your account changed. Reload before restoring.");
  snapshots.set(snapshot.document.id, {
    document: normalizeProject(snapshot.document),
    revision: snapshot.revision,
  });
}
