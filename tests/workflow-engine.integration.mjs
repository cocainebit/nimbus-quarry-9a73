import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { connectDatabase } from "../server/db.mjs";
import {
  enqueueRecordEvent,
  enqueueScheduledJobs,
  runNextJob,
  mountAutomation,
} from "../server/automation.mjs";
import { workflowSchema } from "../shared/workflow-schema.mjs";
import express from "express";
import { once } from "node:events";

test("workflow engine: conditional ordered steps, durable retries, schedule concurrency, permissions and validation", async (t) => {
  const admin = connectDatabase(),
    name = "workflow_test_" + randomUUID().replaceAll("-", "");
  await admin.query(`CREATE DATABASE ${name}`);
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = "/" + name;
  const pool = connectDatabase(url.toString());
  let server;
  t.after(async () => {
    if (server) {
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
    }
    await pool.end();
    await admin.query(`DROP DATABASE ${name}`);
    await admin.end();
  });
  for (const f of [
    "001-platform.sql",
    "002-schema.sql",
    "003-automation.sql",
    "005-project-archive.sql",
    "006-workflow-engine.sql",
    "008-workflow-compatibility.sql",
  ])
    await pool.query(
      await readFile(
        new URL("../server/migrations/" + f, import.meta.url),
        "utf8",
      ),
    );
  const fields = [
    {
      name: "status",
      label: "Status",
      type: "enum",
      required: true,
      options: ["new", "ready", "done"],
      transitions: { new: ["ready"], ready: ["done"] },
    },
    { name: "score", label: "Score", type: "number" },
  ];
  await pool.query(
    "INSERT INTO projects(id,owner_id,document) VALUES('app','builder','{}'),('other','other-builder','{}')",
  );
  await pool.query(
    "INSERT INTO collections(id,project_id,name,fields) VALUES('tasks','app','Tasks',$1)",
    [JSON.stringify(fields)],
  );
  await pool.query(
    "INSERT INTO app_members(project_id,user_id) VALUES('app','alice'),('other','bob')",
  );
  await pool.query(
    "INSERT INTO records(id,collection_id,owner_id,data) VALUES('record','tasks','alice',$1)",
    [{ status: "new", score: 2 }],
  );
  const app = express();
  app.use(express.json());
  mountAutomation(app, {
    pool,
    owner: async (req) => {
      if (req.headers.authorization !== "builder" || req.params.id !== "app")
        throw Object.assign(Error("Forbidden"), { status: 403 });
    },
  });
  app.use((e, _q, r, _n) =>
    r.status(e.status || 400).json({ error: e.message }),
  );
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const save = async (body) => {
    const r = await fetch(
      `http://127.0.0.1:${server.address().port}/api/projects/app/workflows`,
      {
        method: "POST",
        headers: {
          authorization: "builder",
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    return { status: r.status, data: await r.json() };
  };
  const base = {
    name: "Advance ready tasks",
    collectionId: "tasks",
    event: "record.created",
  };
  for (const body of [
    {
      ...base,
      actions: [{ type: "updateRecord", field: "missing", value: "x" }],
    },
    {
      ...base,
      actions: [{ type: "updateRecord", field: "score", value: "wrong type" }],
    },
    { ...base, action: { type: "notification", message: "x", userId: "bob" } },
    {
      ...base,
      conditions: [{ field: "missing", operator: "exists" }],
      action: { type: "notification", message: "x" },
    },
  ])
    assert.equal((await save(body)).status, 400);
  const draft = {
    ...base,
    conditions: [{ field: "score", operator: "greaterThan", value: 1 }],
    actions: [
      { type: "updateRecord", field: "status", value: "ready" },
      { type: "notification", message: "Ready" },
    ],
  };
  const created = await save(draft);
  assert.equal(created.status, 201, JSON.stringify(created.data));
  const event = {
    projectId: "app",
    collectionId: "tasks",
    event: "record.created",
    actorId: "alice",
    record: { id: "record", version: 1, data: { status: "new", score: 0 } },
  };
  await enqueueRecordEvent(pool, event);
  assert.equal((await pool.query("SELECT * FROM jobs")).rowCount, 0);
  await enqueueRecordEvent(pool, {
    ...event,
    record: { ...event.record, data: { status: "new", score: 2 } },
  });
  // Inject a later failing transport into the snapshot, leaving completed database steps intact.
  await pool.query("UPDATE jobs SET actions=actions || $1::jsonb", [
    JSON.stringify([{ type: "webhook", url: "https://example.com/hook" }]),
  ]);
  await runNextJob(pool, {
    transport: async () => {
      throw Error("secret");
    },
  });
  assert.equal(
    (await pool.query("SELECT data->>'status' AS status FROM records")).rows[0]
      .status,
    "ready",
  );
  assert.equal((await pool.query("SELECT * FROM job_steps")).rowCount, 2);
  assert.equal(
    (await pool.query("SELECT * FROM app_notifications")).rowCount,
    1,
  );
  let job = (await pool.query("SELECT * FROM jobs")).rows[0];
  assert.equal(job.status, "queued");
  assert.ok(!job.last_error.includes("secret"));
  await pool.query("UPDATE jobs SET available_at=now()");
  let calls = 0;
  await runNextJob(pool, {
    transport: async (_a, _p, key) => {
      calls++;
      assert.equal(key, `${job.id}:2`);
    },
  });
  assert.equal(calls, 1);
  assert.equal(
    (await pool.query("SELECT version FROM records")).rows[0].version,
    2,
  );
  assert.equal((await pool.query("SELECT * FROM jobs")).rowCount, 1);
  assert.equal((await pool.query("SELECT * FROM job_steps")).rowCount, 3);
  // Revoking record ownership must prevent a queued mutation.
  await enqueueRecordEvent(pool, {
    ...event,
    eventId: "revoked",
    record: { ...event.record, data: { status: "ready", score: 2 } },
  });
  await pool.query("UPDATE records SET owner_id='different'");
  await runNextJob(pool);
  assert.equal(
    (await pool.query("SELECT version FROM records")).rows[0].version,
    2,
  );
  const schedule = {
    name: "Reminder",
    collectionId: "tasks",
    event: "schedule",
    schedule: { at: new Date(Date.now() - 60000).toISOString() },
    actions: [
      { type: "notification", message: "Scheduled reminder", userId: "alice" },
    ],
  };
  assert.equal(
    (
      await save({
        ...schedule,
        actions: [{ type: "notification", message: "No target" }],
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await save({
        ...schedule,
        actions: [{ type: "updateRecord", field: "score", value: 3 }],
      })
    ).status,
    400,
  );
  assert.equal((await save(schedule)).status, 201);
  await Promise.all([
    enqueueScheduledJobs(pool),
    enqueueScheduledJobs(pool),
    enqueueScheduledJobs(pool),
  ]);
  await enqueueScheduledJobs(pool);
  assert.equal(
    (await pool.query("SELECT * FROM jobs WHERE payload->>'event'='schedule'"))
      .rowCount,
    1,
  );
  await runNextJob(pool);
  assert.equal(
    (
      await pool.query(
        "SELECT * FROM app_notifications WHERE message='Scheduled reminder'",
      )
    ).rowCount,
    1,
  );
  assert.equal(
    (
      await save({
        ...schedule,
        name: "Recurring",
        schedule: { ...schedule.schedule, intervalMinutes: 10 },
      })
    ).status,
    201,
  );
  await Promise.all([enqueueScheduledJobs(pool), enqueueScheduledJobs(pool)]);
  const recurring = (
    await pool.query("SELECT * FROM workflows WHERE name='Recurring'")
  ).rows[0];
  assert.ok(recurring.next_run_at > new Date());
  await enqueueScheduledJobs(pool);
  assert.equal(
    (
      await pool.query("SELECT * FROM jobs WHERE workflow_id=$1", [
        recurring.id,
      ])
    ).rowCount,
    1,
  );
  await pool.query(
    "UPDATE workflows SET next_run_at=now()-interval '1 minute' WHERE id=$1",
    [recurring.id],
  );
  await pool.query("UPDATE projects SET archived_at=now() WHERE id='app'");
  assert.equal(await enqueueScheduledJobs(pool), 0);
  assert.equal(await runNextJob(pool), false);
  await pool.query("UPDATE projects SET archived_at=NULL WHERE id='app'");
  assert.equal(await enqueueScheduledJobs(pool), 1);
  const restarted = connectDatabase(url.toString());
  try {
    assert.equal(await enqueueScheduledJobs(restarted), 0);
  } finally {
    await restarted.end();
  }
  assert.equal(
    workflowSchema.safeParse({
      ...base,
      event: "record.deleted",
      actions: [{ type: "updateRecord", field: "score", value: 1 }],
    }).success,
    false,
  );
});
