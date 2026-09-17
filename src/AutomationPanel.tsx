import { useEffect, useState } from "react";
import { api } from "./backend-api";
type Action = {
  type: string;
  message?: string;
  userId?: string;
  url?: string;
  secretRef?: string;
  field?: string;
  value?: unknown;
};
type Condition = { field: string; operator: string; value?: unknown };
type Workflow = {
  id: string;
  name: string;
  collection_id: string;
  event: string;
  action: Action;
  actions: Action[];
  conditions: Condition[];
  enabled: boolean;
  schedule?: { at: string; intervalMinutes?: number };
  next_run_at?: string;
};
type Collection = {
  id: string;
  name: string;
  fields: { name: string; label: string; type: string }[];
};
type Job = {
  id: string;
  status: string;
  attempts: number;
  last_error: string | null;
  completed_steps: number;
  total_steps: number;
};
const initialAction = (): Action => ({ type: "notification", message: "" });
export default function AutomationPanel({ projectId }: { projectId: string }) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]),
    [jobs, setJobs] = useState<Job[]>([]),
    [collections, setCollections] = useState<Collection[]>([]);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState(""),
    [name, setName] = useState(""),
    [collectionId, setCollectionId] = useState(""),
    [event, setEvent] = useState("record.created"),
    [enabled, setEnabled] = useState(true),
    [actions, setActions] = useState<Action[]>([initialAction()]),
    [conditions, setConditions] = useState<Condition[]>([]),
    [at, setAt] = useState(""),
    [interval, setInterval] = useState("");
  const base = `/api/projects/${projectId}`,
    fields = collections.find((c) => c.id === collectionId)?.fields || [];
  async function refresh() {
    const [w, j, b] = await Promise.all([
      api<Workflow[]>(base + "/workflows"),
      api<Job[]>(base + "/jobs"),
      api<{ collections: Collection[] }>(base + "/backend"),
    ]);
    setWorkflows(w);
    setJobs(j);
    setCollections(b.collections);
    setCollectionId((old) => old || b.collections[0]?.id || "");
  }
  useEffect(() => {
    void refresh().catch((e) => setError(e.message));
  }, [projectId]);
  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function edit(w: Workflow) {
    setEditing(w.id);
    setName(w.name);
    setCollectionId(w.collection_id);
    setEvent(w.event);
    setEnabled(w.enabled);
    setActions(w.actions?.length ? w.actions : [w.action]);
    setConditions(w.conditions || []);
    setAt(
      w.schedule?.at
        ? new Date(
            new Date(w.schedule.at).getTime() -
              new Date(w.schedule.at).getTimezoneOffset() * 60000,
          )
            .toISOString()
            .slice(0, 16)
        : "",
    );
    setInterval(String(w.schedule?.intervalMinutes || ""));
  }
  function patchAction(index: number, patch: Partial<Action>) {
    setActions((old) =>
      old.map((a, i) => (i === index ? { ...a, ...patch } : a)),
    );
  }
  function scalar(value: string) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return (
    <section className="backend-card">
      <h3>Workflow builder</h3>
      <p>
        Run ordered steps after a record change or on a schedule. Completed
        steps are preserved when a failed job is retried.
      </p>
      {error && <p role="alert">{error}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await api(
              base + "/workflows" + (editing ? "/" + editing : ""),
              {
                name,
                collectionId,
                event,
                enabled,
                actions,
                conditions: event === "schedule" ? [] : conditions,
                ...(event === "schedule"
                  ? {
                      schedule: {
                        at: new Date(at).toISOString(),
                        ...(interval
                          ? { intervalMinutes: Number(interval) }
                          : {}),
                      },
                    }
                  : {}),
              },
              editing ? "PUT" : "POST",
            );
            setEditing("");
            setName("");
            setActions([initialAction()]);
            setConditions([]);
          });
        }}
      >
        <label>
          Workflow name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Collection
          <select
            required
            value={collectionId}
            onChange={(e) => {
              setCollectionId(e.target.value);
              setConditions([]);
            }}
          >
            <option value="">Choose collection</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          When
          <select value={event} onChange={(e) => setEvent(e.target.value)}>
            {[
              "record.created",
              "record.updated",
              "record.deleted",
              "schedule",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        {event === "schedule" ? (
          <>
            <label>
              First run (your local time)
              <input
                required
                type="datetime-local"
                value={at}
                onChange={(e) => setAt(e.target.value)}
              />
            </label>
            <label>
              Repeat every minutes (blank for once)
              <input
                type="number"
                min="1"
                max="525600"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
              />
            </label>
            <p>
              Scheduled notifications require the recipient’s app member ID.
              Record updates require a record trigger.
            </p>
          </>
        ) : (
          <>
            <h4>Only when all conditions match</h4>
            {conditions.map((c, i) => (
              <div key={i}>
                <select
                  aria-label="Condition field"
                  value={c.field}
                  onChange={(e) =>
                    setConditions((old) =>
                      old.map((v, n) =>
                        n === i ? { ...v, field: e.target.value } : v,
                      ),
                    )
                  }
                >
                  {fields.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Condition operator"
                  value={c.operator}
                  onChange={(e) =>
                    setConditions((old) =>
                      old.map((v, n) =>
                        n === i ? { ...v, operator: e.target.value } : v,
                      ),
                    )
                  }
                >
                  {[
                    "equals",
                    "notEquals",
                    "greaterThan",
                    "lessThan",
                    "contains",
                    "exists",
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
                {c.operator !== "exists" && (
                  <input
                    aria-label="Condition value"
                    value={
                      typeof c.value === "string"
                        ? c.value
                        : JSON.stringify(c.value ?? "")
                    }
                    onChange={(e) =>
                      setConditions((old) =>
                        old.map((v, n) =>
                          n === i ? { ...v, value: scalar(e.target.value) } : v,
                        ),
                      )
                    }
                  />
                )}
                <button
                  type="button"
                  onClick={() =>
                    setConditions((old) => old.filter((_, n) => n !== i))
                  }
                >
                  Remove condition
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={!fields.length || conditions.length >= 20}
              onClick={() =>
                setConditions((old) => [
                  ...old,
                  { field: fields[0].name, operator: "equals", value: "" },
                ])
              }
            >
              Add condition
            </button>
          </>
        )}
        <h4>Ordered actions</h4>
        {actions.map((a, i) => (
          <fieldset key={i}>
            <legend>Step {i + 1}</legend>
            <label>
              Action
              <select
                value={a.type}
                onChange={(e) =>
                  setActions((old) =>
                    old.map((v, n) => (n === i ? { type: e.target.value } : v)),
                  )
                }
              >
                <option value="notification">Member notification</option>
                <option value="webhook">HTTPS webhook</option>
                {event !== "schedule" && event !== "record.deleted" && (
                  <option value="updateRecord">Update triggering record</option>
                )}
              </select>
            </label>
            {a.type === "notification" ? (
              <>
                <label>
                  Message
                  <input
                    required
                    value={a.message || ""}
                    onChange={(e) =>
                      patchAction(i, { message: e.target.value })
                    }
                  />
                </label>
                <label>
                  Recipient member ID (blank = triggering member)
                  <input
                    required={event === "schedule"}
                    value={a.userId || ""}
                    onChange={(e) =>
                      patchAction(i, { userId: e.target.value || undefined })
                    }
                  />
                </label>
              </>
            ) : a.type === "webhook" ? (
              <>
                <label>
                  Webhook URL
                  <input
                    required
                    type="url"
                    value={a.url || ""}
                    onChange={(e) => patchAction(i, { url: e.target.value })}
                  />
                </label>
                <label>
                  Secret reference
                  <input
                    value={a.secretRef || ""}
                    onChange={(e) =>
                      patchAction(i, { secretRef: e.target.value || undefined })
                    }
                  />
                </label>
                <p>The server operator must allow the destination hostname.</p>
              </>
            ) : (
              <>
                <label>
                  Field
                  <select
                    required
                    value={a.field || ""}
                    onChange={(e) => patchAction(i, { field: e.target.value })}
                  >
                    <option value="">Choose field</option>
                    {fields.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  New value
                  <input
                    required
                    value={
                      typeof a.value === "string"
                        ? a.value
                        : JSON.stringify(a.value ?? "")
                    }
                    onChange={(e) =>
                      patchAction(i, { value: scalar(e.target.value) })
                    }
                  />
                </label>
                <small>
                  Use a number or true/false for typed fields. Existing
                  validation and transition rules apply.
                </small>
              </>
            )}
            <button
              type="button"
              disabled={i === 0}
              onClick={() =>
                setActions((old) => {
                  const next = [...old];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  return next;
                })
              }
            >
              Move up
            </button>
            <button
              type="button"
              disabled={actions.length === 1}
              onClick={() => setActions((old) => old.filter((_, n) => n !== i))}
            >
              Remove step
            </button>
          </fieldset>
        ))}
        <button
          type="button"
          disabled={actions.length >= 10}
          onClick={() => setActions((old) => [...old, initialAction()])}
        >
          Add step
        </button>
        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Enabled
        </label>
        <button disabled={busy || !collectionId}>
          {editing ? "Save workflow" : "Add workflow"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => {
              setEditing("");
              setName("");
              setActions([initialAction()]);
            }}
          >
            Cancel editing
          </button>
        )}
      </form>
      {workflows.map((w) => (
        <p key={w.id}>
          <strong>{w.name}</strong> · {w.event} ·{" "}
          {w.enabled ? "Enabled" : "Disabled"}{" "}
          {w.next_run_at &&
            `· Next ${new Date(w.next_run_at).toLocaleString()}`}{" "}
          <button disabled={busy} onClick={() => edit(w)}>
            Edit
          </button>{" "}
          <button
            disabled={busy}
            onClick={() =>
              void run(() =>
                api(base + "/workflows/" + w.id, undefined, "DELETE"),
              )
            }
          >
            Delete
          </button>
        </p>
      ))}
      <h4>Execution history</h4>
      <button disabled={busy} onClick={() => void run(async () => {})}>
        Refresh jobs
      </button>
      {!jobs.length && <p>No jobs yet.</p>}
      {jobs.map((j) => (
        <p key={j.id}>
          {j.status} · {j.completed_steps}/{j.total_steps} steps · {j.attempts}{" "}
          attempts {j.last_error}{" "}
          {j.status === "failed" && (
            <button
              disabled={busy}
              onClick={() =>
                void run(() => api(base + "/jobs/" + j.id + "/retry", {}))
              }
            >
              Retry remaining steps
            </button>
          )}
        </p>
      ))}
    </section>
  );
}
