import { useEffect, useState } from "react";
import { api } from "./backend-api";
type Member = {
  user_id: string;
  name: string;
  email: string;
  role: "member" | "editor" | "admin";
};
export default function MembersPanel({ projectId }: { projectId: string }) {
  const [members, setMembers] = useState<Member[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    api<Member[]>(`/api/projects/${projectId}/members`)
      .then((rows) => {
        if (active) setMembers(rows);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [projectId]);
  const assign = async (userId: string, role: Member["role"]) => {
    setBusy(true);
    setError("");
    try {
      await api(
        `/api/projects/${projectId}/members/${userId}`,
        { role },
        "PATCH",
      );
      setMembers((ms) =>
        ms.map((m) => (m.user_id === userId ? { ...m, role } : m)),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section aria-label="App member roles">
      <h3>Member roles</h3>
      <p>
        Only you can assign roles. Editors and admins can manage all records
        only in collections where editor access is enabled. Private collections
        stay private.
      </p>
      {error && <p role="alert">{error}</p>}
      {members.length === 0 ? (
        <p>No members have joined this app yet.</p>
      ) : (
        members.map((m) => (
          <label key={m.user_id}>
            {m.name} ({m.email})
            <select
              aria-label={`Role for ${m.email}`}
              value={m.role}
              disabled={busy}
              onChange={(e) =>
                void assign(m.user_id, e.target.value as Member["role"])
              }
            >
              <option value="member">Member</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        ))
      )}
    </section>
  );
}
