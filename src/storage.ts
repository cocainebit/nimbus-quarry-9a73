import { useEffect, useState, useRef, useCallback } from "react";
import { initialProjects, normalizeProject, type Project } from "./model";
import { api } from "./backend-api";
import {
  listServerProjects,
  saveServerProject,
  resetCloudAccount,
  archiveServerProject,
  flushServerProjects,
} from "./cloud-projects";
const KEY = "site-studio-projects-v1";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("site-studio", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("workspace");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function read() {
  const db = await database();
  try {
    return await new Promise<unknown>((resolve, reject) => {
      const req = db
        .transaction("workspace")
        .objectStore("workspace")
        .get("projects");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}
async function write(projects: Project[]) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("workspace", "readwrite");
      tx.objectStore("workspace").put(projects, "projects");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [workspace, setWorkspace] = useState<"local" | "server">("local");
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const pending = useRef(Promise.resolve());
  const generation = useRef(0);
  const changing = useRef(false);
  const initialized = useRef(false);
  const mode = useRef(workspace);
  mode.current = workspace;
  const lastSaved = useRef("");
  const current = useRef(projects);
  current.current = projects;
  const loadLocal = async () => {
    const saved = await read();
    const legacy = localStorage.getItem(KEY);
    const value = saved ?? (legacy ? JSON.parse(legacy) : initialProjects());
    if (!Array.isArray(value))
      throw Error("Saved workspace is not a project list.");
    return value.map(normalizeProject);
  };
  const connectServer = useCallback(async () => {
    if (changing.current) return;
    changing.current = true;
    setStorageError("");
    try {
      generation.current++;
      const before = JSON.stringify(current.current);
      await pending.current;
      if (initialized.current) {
        if (mode.current === "local")
          await write(current.current.map(normalizeProject));
        else {
          for (const project of current.current)
            await saveServerProject(project);
          await flushServerProjects();
        }
      }
      const session = await api("/api/auth/get-session");
      if (!session?.user) throw Error("Sign in to open server projects.");
      resetCloudAccount(session.user.id);
      const loaded = await listServerProjects(
        () => before === JSON.stringify(current.current),
      );
      if (before !== JSON.stringify(current.current))
        throw Error(
          "Your workspace changed while connecting. Try again; your edits are preserved.",
        );
      generation.current++;
      lastSaved.current = JSON.stringify(loaded);
      initialized.current = true;
      setUser(session.user);
      setProjects(loaded);
      mode.current = "server";
      setWorkspace("server");
      setReady(true);
      setSaving(false);
      localStorage.setItem("studio-workspace-mode", "server");
    } catch (e) {
      setStorageError((e as Error).message);
      throw e;
    } finally {
      changing.current = false;
    }
  }, []);
  useEffect(() => {
    let stopped = false;
    (async () => {
      try {
        if (localStorage.getItem("studio-workspace-mode") === "server") {
          const session = await api("/api/auth/get-session");
          if (!session?.user)
            throw Error(
              "Your server session expired. Sign in again to load your projects.",
            );
          resetCloudAccount(session.user.id);
          const loaded = await listServerProjects();
          if (stopped) return;
          lastSaved.current = JSON.stringify(loaded);
          initialized.current = true;
          setProjects(loaded);
          setUser(session.user);
          setWorkspace("server");
          setReady(true);
          return;
        }
        const loaded = await loadLocal();
        if (!stopped) {
          initialized.current = true;
          setProjects(loaded);
          setReady(true);
        }
      } catch (e) {
        if (!stopped) {
          setStorageError((e as Error).message);
          setReady(true);
        }
      }
    })();
    return () => {
      stopped = true;
    };
  }, []);
  useEffect(() => {
    if (
      !initialized.current ||
      !ready ||
      changing.current ||
      JSON.stringify(projects) === lastSaved.current
    )
      return;
    const g = generation.current;
    const serialized = JSON.stringify(projects);
    setSaving(true);
    const timer = setTimeout(
      () => {
        pending.current = pending.current
          .catch(() => {})
          .then(async () => {
            if (
              g !== generation.current ||
              serialized !== JSON.stringify(current.current)
            )
              return;
            if (workspace === "server") {
              for (const p of projects) await saveServerProject(p);
            } else await write(projects.map(normalizeProject));
            if (g === generation.current) {
              lastSaved.current = serialized;
              setStorageError("");
              setSaving(false);
            }
          })
          .catch((e) => {
            if (g === generation.current) {
              setSaving(false);
              setStorageError(
                `Not saved: ${(e as Error).message}. Your changes remain in this tab; export a backup before reloading.`,
              );
            }
          });
      },
      workspace === "server" ? 450 : 0,
    );
    return () => clearTimeout(timer);
  }, [projects, ready, workspace]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (saving || storageError) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saving, storageError]);
  const saveNow = async () => {
    generation.current++;
    await pending.current;
    const snapshot = structuredClone(current.current),
      serialized = JSON.stringify(snapshot);
    if (mode.current === "server") {
      for (const p of snapshot) await saveServerProject(p);
      await flushServerProjects();
    } else await write(snapshot.map(normalizeProject));
    if (serialized !== JSON.stringify(current.current))
      throw Error(
        "Your workspace changed while saving. Save again before switching workspaces.",
      );
    lastSaved.current = serialized;
    setSaving(false);
    setStorageError("");
  };
  const disconnect = async () => {
    if (changing.current) return;
    changing.current = true;
    try {
      await saveNow();
      const serialized = JSON.stringify(current.current);
      const loaded = await loadLocal();
      if (serialized !== JSON.stringify(current.current))
        throw Error("Your workspace changed. Save again before signing out.");
      await api("/api/auth/sign-out", {});
      generation.current++;
      resetCloudAccount("");
      lastSaved.current = JSON.stringify(loaded);
      setProjects(loaded);
      setUser(null);
      mode.current = "local";
      setWorkspace("local");
      localStorage.removeItem("studio-workspace-mode");
    } finally {
      changing.current = false;
    }
  };
  const importLocal = async () => {
    if (workspace !== "server") return;
    const local = await loadLocal();
    const imported = local.map((p) => ({
      ...p,
      id: crypto.randomUUID(),
      name: `${p.name} (local import)`,
    }));
    setProjects((all) => [...imported, ...all]);
  };
  const removeProject = async (id: string) => {
    if (workspace === "server") {
      await saveNow();
      await archiveServerProject(id);
    }
    setProjects((all) => all.filter((p) => p.id !== id));
  };
  const retry = () => {
    lastSaved.current = "";
    setProjects((all) => [...all]);
  };
  return {
    projects,
    setProjects,
    ready,
    storageError,
    saving,
    workspace,
    user,
    connectServer,
    disconnect,
    importLocal,
    removeProject,
    retry,
    saveNow,
  };
}
