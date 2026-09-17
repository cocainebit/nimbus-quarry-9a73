import { randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import https from "node:https";
import net from "node:net";
import {
  actionSchema,
  workflowSchema,
  matchesConditions,
} from "../shared/workflow-schema.mjs";
import { transaction, lockProject, validateRecord } from "./backend-data.mjs";
import { recordData } from "../shared/backend-schema.mjs";
export { actionSchema };
const fail = (status, message) => Object.assign(new Error(message), { status });
// IPv6 is deliberately excluded until a comprehensive global-address policy is added.
export function isPublicAddress(address) {
  if (net.isIP(address) !== 4) return false;
  const [a, b] = address.split(".").map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0 || b === 2)) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}
export function validateWebhookUrl(
  raw,
  allowed = process.env.WEBHOOK_ALLOWED_HOSTS || "",
) {
  const url = new URL(raw);
  const hosts = allowed
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.hash ||
    (url.port && url.port !== "443") ||
    !hosts.includes(url.hostname.toLowerCase())
  )
    throw fail(
      400,
      "Webhook requires an HTTPS hostname configured in WEBHOOK_ALLOWED_HOSTS.",
    );
  if (net.isIP(url.hostname) && !isPublicAddress(url.hostname))
    throw fail(400, "Webhook address is not public.");
  return url;
}
export function resolveWebhookSecret(
  action,
  projectId,
  environment = process.env,
) {
  const secret = action.secretRef
    ? environment[`WEBHOOK_SECRET_${action.secretRef}`]
    : undefined;
  if (
    action.secretRef &&
    (!secret ||
      environment[`WEBHOOK_SECRET_URL_${action.secretRef}`] !==
        new URL(action.url).href ||
      environment[`WEBHOOK_SECRET_PROJECT_${action.secretRef}`] !== projectId)
  )
    throw Error(
      "Webhook secret is not configured for this project and destination.",
    );
  return secret;
}
export async function sendWebhook(action, payload, jobId) {
  const url = validateWebhookUrl(action.url);
  let dnsTimer;
  const addresses = await Promise.race([
    lookup(url.hostname, { all: true, verbatim: true }),
    new Promise((_, reject) => {
      dnsTimer = setTimeout(
        () => reject(Error("Webhook DNS timed out.")),
        5000,
      );
    }),
  ]).finally(() => clearTimeout(dnsTimer));
  if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address)))
    throw Error("Webhook DNS address is not allowed.");
  const chosen = addresses[0];
  const secret = resolveWebhookSecret(action, payload.projectId);
  const body = JSON.stringify(payload);
  await new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "Idempotency-Key": jobId,
          ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
        },
        lookup: (_hostname, options, callback) =>
          options.all
            ? callback(null, [chosen])
            : callback(null, chosen.address, chosen.family),
      },
      (response) => {
        clearTimeout(deadline);
        response.destroy();
        if (response.statusCode >= 200 && response.statusCode < 300) resolve();
        else reject(Error(`Webhook returned HTTP ${response.statusCode}.`));
      },
    );
    const deadline = setTimeout(
      () => request.destroy(Error("Webhook timed out.")),
      10000,
    );
    request.once("error", (error) => {
      clearTimeout(deadline);
      reject(error);
    });
    request.end(body);
  });
}
export async function enqueueRecordEvent(
  client,
  { projectId, collectionId, event, record, actorId, eventId },
) {
  const workflows = (
    await client.query(
      "SELECT * FROM workflows WHERE project_id=$1 AND collection_id=$2 AND event=$3 AND enabled=true",
      [projectId, collectionId, event],
    )
  ).rows;
  for (const w of workflows) {
    if (!matchesConditions(w.conditions || [], record.data)) continue;
    const key = `${w.id}:${eventId || `${event}:${record.id}:${record.version}`}`;
    await client.query(
      "INSERT INTO jobs(id,project_id,workflow_id,event_key,payload,action,actions) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(event_key) DO NOTHING",
      [
        randomUUID(),
        projectId,
        w.id,
        key,
        { projectId, event, collectionId, record, actorId },
        w.action,
        JSON.stringify(w.actions?.length ? w.actions : [w.action]),
      ],
    );
  }
}
export async function runNextJob(pool, { transport = sendWebhook } = {}) {
  const token = randomUUID();
  const { rows } = await pool.query(
    `WITH due AS (SELECT id FROM jobs WHERE ((status='queued' AND available_at<=now()) OR (status='running' AND lease_until<now())) AND attempts<5 AND EXISTS (SELECT 1 FROM projects p WHERE p.id=jobs.project_id AND p.archived_at IS NULL) ORDER BY available_at FOR UPDATE SKIP LOCKED LIMIT 1) UPDATE jobs SET status='running',attempts=attempts+1,lease_until=now()+interval '60 seconds',lease_token=$1 FROM due WHERE jobs.id=due.id RETURNING jobs.*`,
    [token],
  );
  const job = rows[0];
  if (!job) {
    await pool.query(
      "UPDATE jobs SET status='failed',last_error='Worker lease expired after final attempt.',lease_token=NULL WHERE status='running' AND lease_until<now() AND attempts>=5",
    );
    return false;
  }
  try {
    const actions = job.actions?.length ? job.actions : [job.action];
    for (let step = 0; step < actions.length; step++) {
      await transaction(pool, async (db) => {
        // Hold the job row throughout the step; another worker cannot reclaim its lease.
        const current = await db.query(
          "SELECT lease_token FROM jobs WHERE id=$1 FOR UPDATE",
          [job.id],
        );
        if (current.rows[0]?.lease_token !== token) throw Error("Lease lost.");
        if (
          (
            await db.query(
              "SELECT 1 FROM job_steps WHERE job_id=$1 AND step=$2",
              [job.id, step],
            )
          ).rowCount
        )
          return;
        const action = actionSchema.parse(actions[step]);
        if (action.type === "notification") {
          const userId = action.userId || job.payload.actorId;
          if (
            !(
              await db.query(
                "SELECT 1 FROM app_members WHERE project_id=$1 AND user_id=$2",
                [job.project_id, userId],
              )
            ).rowCount
          )
            throw Error("Recipient is no longer an app member.");
          await db.query(
            "INSERT INTO app_notifications(id,job_id,project_id,user_id,message,step) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(job_id,step) DO NOTHING",
            [
              randomUUID(),
              job.id,
              job.project_id,
              userId,
              action.message,
              step,
            ],
          );
        } else if (action.type === "webhook") {
          await transport(action, job.payload, `${job.id}:${step}`);
        } else {
          await lockProject(db, job.project_id);
          const c = (
            await db.query(
              "SELECT * FROM collections WHERE id=$1 AND project_id=$2",
              [job.payload.collectionId, job.project_id],
            )
          ).rows[0];
          const r = (
            await db.query(
              "SELECT * FROM records WHERE id=$1 AND collection_id=$2 FOR UPDATE",
              [job.payload.record?.id, c?.id],
            )
          ).rows[0];
          if (!c || !r) throw Error("Record unavailable.");
          const membership = (
            await db.query(
              "SELECT role FROM app_members WHERE project_id=$1 AND user_id=$2",
              [job.project_id, job.payload.actorId],
            )
          ).rows[0];
          if (
            !membership ||
            membership.role === "viewer" ||
            (r.owner_id !== job.payload.actorId &&
              !(
                c.editor_access && ["admin", "editor"].includes(membership.role)
              ))
          )
            throw Error("Actor no longer has write access.");
          const data = await validateRecord(
            db,
            c,
            { ...r.data, [action.field]: action.value },
            {
              previous: r.data,
              userId: job.payload.actorId,
              recordId: r.id,
              privileged:
                c.editor_access &&
                ["admin", "editor"].includes(membership.role),
            },
          );
          await db.query(
            "UPDATE records SET data=$2,version=version+1,updated_at=now() WHERE id=$1",
            [r.id, data],
          );
          // Deliberately do not enqueue another record event: workflow updates cannot recurse.
        }
        await db.query("INSERT INTO job_steps(job_id,step) VALUES($1,$2)", [
          job.id,
          step,
        ]);
      });
    }
    await pool.query(
      "UPDATE jobs SET status='completed',completed_at=now(),lease_until=NULL,lease_token=NULL,last_error=NULL WHERE id=$1 AND lease_token=$2",
      [job.id, token],
    );
  } catch (error) {
    // Persist bounded generic failures; provider messages may contain credentials or payloads.
    await pool.query(
      "UPDATE jobs SET status=$3,available_at=now()+($4*interval '1 second'),lease_until=NULL,lease_token=NULL,last_error=$5 WHERE id=$1 AND lease_token=$2",
      [
        job.id,
        token,
        job.attempts >= 5 ? "failed" : "queued",
        Math.min(3600, 2 ** job.attempts * 5),
        job.action.type === "webhook"
          ? "Webhook delivery failed. Check allowlist, secret and receiver."
          : "Workflow execution failed.",
      ],
    );
  }
  return true;
}
export async function enqueueScheduledJobs(pool) {
  return transaction(pool, async (db) => {
    const { rows } = await db.query(
      "SELECT * FROM workflows WHERE event='schedule' AND enabled=true AND next_run_at<=now() AND EXISTS (SELECT 1 FROM projects p WHERE p.id=workflows.project_id AND p.archived_at IS NULL) ORDER BY next_run_at FOR UPDATE SKIP LOCKED LIMIT 50",
    );
    for (const w of rows) {
      const slot = w.next_run_at.toISOString();
      await db.query(
        "INSERT INTO jobs(id,project_id,workflow_id,event_key,payload,action,actions) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(event_key) DO NOTHING",
        [
          randomUUID(),
          w.project_id,
          w.id,
          `${w.id}:schedule:${slot}`,
          {
            projectId: w.project_id,
            event: "schedule",
            collectionId: w.collection_id,
            scheduledAt: slot,
          },
          w.actions[0],
          JSON.stringify(w.actions),
        ],
      );
      // Skip missed interval ticks after downtime, retaining the original cadence.
      await db.query(
        "UPDATE workflows SET next_run_at=CASE WHEN $2::integer IS NULL THEN NULL ELSE next_run_at + (floor(extract(epoch from (now()-next_run_at))/($2*60))+1)*($2*interval '1 minute') END WHERE id=$1",
        [w.id, w.schedule.intervalMinutes || null],
      );
    }
    return rows.length;
  });
}
export function startJobWorker(pool) {
  let stopped = false,
    running = false;
  const timer = setInterval(async () => {
    if (stopped || running) return;
    running = true;
    try {
      await enqueueScheduledJobs(pool);
      await runNextJob(pool);
    } catch {
      console.error("Background worker database operation failed.");
    } finally {
      running = false;
    }
  }, 1000);
  timer.unref();
  return async () => {
    stopped = true;
    clearInterval(timer);
    while (running) await new Promise((r) => setTimeout(r, 20));
  };
}
export function mountAutomation(app, { pool, owner, publication, member }) {
  app.get("/api/projects/:id/workflows", async (req, res) => {
    await owner(req);
    res.json(
      (
        await pool.query(
          "SELECT * FROM workflows WHERE project_id=$1 ORDER BY created_at",
          [req.params.id],
        )
      ).rows,
    );
  });
  const save = async (req, res) => {
    await owner(req);
    const input = workflowSchema.parse(req.body);
    const actions = input.actions || [input.action];
    for (const action of actions)
      if (action.type === "webhook") validateWebhookUrl(action.url);
    const result = await transaction(pool, async (db) => {
      await lockProject(db, req.params.id);
      const c = (
        await db.query(
          "SELECT * FROM collections WHERE id=$1 AND project_id=$2",
          [input.collectionId, req.params.id],
        )
      ).rows[0];
      if (!c) throw fail(404, "Collection not found.");
      for (const condition of input.conditions)
        if (!c.fields.some((f) => f.name === condition.field))
          throw fail(400, "Condition field does not exist.");
      for (const action of actions) {
        if (
          action.type === "notification" &&
          action.userId &&
          !(
            await db.query(
              "SELECT 1 FROM app_members WHERE project_id=$1 AND user_id=$2",
              [req.params.id, action.userId],
            )
          ).rowCount
        )
          throw fail(400, "Recipient must belong to this app.");
        if (action.type === "updateRecord") {
          const field = c.fields.find((f) => f.name === action.field);
          if (!field || field.immutable)
            throw fail(400, "Action field must exist and be editable.");
          recordData([field], { [field.name]: action.value });
        }
      }
      const values = [
        req.params.workflowId || randomUUID(),
        req.params.id,
        input.name,
        input.collectionId,
        input.event,
        actions[0],
        input.enabled,
        JSON.stringify(actions),
        JSON.stringify(input.conditions),
        input.schedule || null,
        input.schedule?.at || null,
      ];
      return req.params.workflowId
        ? db.query(
            "UPDATE workflows SET name=$3,collection_id=$4,event=$5,action=$6,enabled=$7,actions=$8,conditions=$9,schedule=$10,next_run_at=CASE WHEN schedule IS NOT DISTINCT FROM $10::jsonb AND enabled=$7 THEN next_run_at ELSE $11::timestamptz END WHERE id=$1 AND project_id=$2 RETURNING *",
            values,
          )
        : db.query(
            "INSERT INTO workflows(id,project_id,name,collection_id,event,action,enabled,actions,conditions,schedule,next_run_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *",
            values,
          );
    });
    if (!result.rowCount) throw fail(404, "Workflow not found.");
    res.status(req.params.workflowId ? 200 : 201).json(result.rows[0]);
  };
  app.post("/api/projects/:id/workflows", save);
  app.put("/api/projects/:id/workflows/:workflowId", save);
  app.delete("/api/projects/:id/workflows/:workflowId", async (req, res) => {
    await owner(req);
    await pool.query("DELETE FROM workflows WHERE id=$1 AND project_id=$2", [
      req.params.workflowId,
      req.params.id,
    ]);
    res.json({ ok: true });
  });
  app.get("/api/projects/:id/jobs", async (req, res) => {
    await owner(req);
    res.json(
      (
        await pool.query(
          "SELECT id,workflow_id,status,attempts,last_error,created_at,completed_at,jsonb_array_length(actions) AS total_steps,(SELECT count(*)::integer FROM job_steps s WHERE s.job_id=jobs.id) AS completed_steps FROM jobs WHERE project_id=$1 ORDER BY created_at DESC LIMIT 100",
          [req.params.id],
        )
      ).rows,
    );
  });
  app.post("/api/projects/:id/jobs/:jobId/retry", async (req, res) => {
    await owner(req);
    const r = await pool.query(
      "UPDATE jobs SET status='queued',attempts=0,available_at=now(),last_error=NULL WHERE id=$1 AND project_id=$2 AND status='failed' RETURNING id",
      [req.params.jobId, req.params.id],
    );
    if (!r.rowCount) throw fail(409, "Only failed jobs can be retried.");
    res.json({ ok: true });
  });
  app.get("/api/apps/:slug/notifications", async (req, res) => {
    const p = await publication(req);
    const u = await member(req, p.project_id);
    res.json(
      (
        await pool.query(
          "SELECT id,message,created_at FROM app_notifications WHERE project_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT 100",
          [p.project_id, u.id],
        )
      ).rows,
    );
  });
}
