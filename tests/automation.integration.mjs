import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import express from "express";
import { connectDatabase } from "../server/db.mjs";
import {
  enqueueRecordEvent,
  runNextJob,
  mountAutomation,
  isPublicAddress,
  validateWebhookUrl,
  resolveWebhookSecret,
} from "../server/automation.mjs";
import { mountFiles } from "../server/files.mjs";

test("webhook policy rejects private networks and unapproved destinations", () => {
  for (const ip of [
    "127.0.0.1",
    "10.0.0.5",
    "169.254.169.254",
    "172.16.1.2",
    "192.168.0.1",
    "100.64.1.1",
    "::1",
    "::ffff:127.0.0.1",
  ])
    assert.equal(isPublicAddress(ip), false, ip);
  assert.equal(isPublicAddress("8.8.8.8"), true);
  for (const url of [
    "http://example.com",
    "https://example.com:444",
    "https://user:pass@example.com",
    "https://other.com",
    "https://127.0.0.1",
  ])
    assert.throws(() => validateWebhookUrl(url, "example.com,127.0.0.1"));
  assert.equal(
    validateWebhookUrl("https://example.com/hook", "example.com").hostname,
    "example.com",
  );
});
test("durable jobs: rollback, idempotency, retries, concurrent claim, lease recovery; private app files", async (t) => {
  const admin = connectDatabase(),
    name = `automation_test_${randomUUID().replaceAll("-", "")}`;
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
  for (const file of [
    "001-platform.sql",
    "002-schema.sql",
    "003-automation.sql",
    "005-project-archive.sql",
    "006-workflow-engine.sql",
    "008-workflow-compatibility.sql",
  ])
    await pool.query(
      await readFile(
        new URL("../server/migrations/" + file, import.meta.url),
        "utf8",
      ),
    );
  for (const id of ["app-a", "app-b"]) {
    await pool.query(
      "INSERT INTO projects(id,owner_id,document) VALUES($1,$2,$3)",
      [id, "builder", {}],
    );
    await pool.query(
      "INSERT INTO publications(project_id,slug,document,revision) VALUES($1,$1,$2,1)",
      [id, {}],
    );
  }
  await pool.query(
    "INSERT INTO collections(id,project_id,name,fields) VALUES('collection','app-a','Tasks','[]')",
  );
  await pool.query(
    "INSERT INTO workflows(id,project_id,name,collection_id,event,action) VALUES('notify','app-a','Notify','collection','record.created',$1)",
    [{ type: "notification", message: "Saved" }],
  );
  await pool.query(
    "INSERT INTO app_members(project_id,user_id) VALUES('app-a','alice')",
  );
  const event = {
    projectId: "app-a",
    collectionId: "collection",
    event: "record.created",
    record: { id: "one", version: 1, data: { title: "Test" } },
    actorId: "alice",
  };
  const tx = await pool.connect();
  await tx.query("BEGIN");
  await enqueueRecordEvent(tx, event);
  await tx.query("ROLLBACK");
  tx.release();
  assert.equal((await pool.query("SELECT * FROM jobs")).rowCount, 0);
  await enqueueRecordEvent(pool, event);
  await enqueueRecordEvent(pool, event);
  assert.equal((await pool.query("SELECT * FROM jobs")).rowCount, 1);
  await Promise.all([runNextJob(pool), runNextJob(pool)]);
  assert.equal(
    (await pool.query("SELECT * FROM app_notifications")).rowCount,
    1,
  );
  await pool.query(
    "UPDATE jobs SET status='running',attempts=1,lease_until=now()-interval '1 minute'",
  );
  await runNextJob(pool);
  assert.equal(
    (await pool.query("SELECT * FROM app_notifications")).rowCount,
    1,
  );
  await pool.query("UPDATE workflows SET action=$1 WHERE id='notify'", [
    { type: "webhook", url: "https://example.com" },
  ]);
  await enqueueRecordEvent(pool, {
    ...event,
    record: { ...event.record, id: "two" },
  });
  await runNextJob(pool, {
    transport: async () => {
      throw Error("secret content must not leak");
    },
  });
  let job = (await pool.query("SELECT * FROM jobs WHERE status='queued'"))
    .rows[0];
  assert.equal(job.attempts, 1);
  assert.ok(!job.last_error.includes("secret content"));
  assert.ok(job.available_at > new Date());
  await pool.query("UPDATE jobs SET available_at=now() WHERE id=$1", [job.id]);
  let deliveries = 0;
  await runNextJob(pool, {
    transport: async (_a, p, id) => {
      deliveries++;
      assert.equal(id, `${job.id}:0`);
      assert.equal(p.record.id, "two");
    },
  });
  assert.equal(deliveries, 1);
  await pool.query(
    "UPDATE jobs SET status='running',attempts=5,lease_until=now()-interval '1 minute' WHERE id=$1",
    [job.id],
  );
  await runNextJob(pool);
  assert.equal(
    (await pool.query("SELECT status FROM jobs WHERE id=$1", [job.id])).rows[0]
      .status,
    "failed",
  );
  const app = express();
  app.use(express.json({ limit: "8mb" }));
  const helpers = {
    pool,
    owner: async (req) => {
      if (req.headers["x-test-user"] !== "builder")
        throw Object.assign(Error("Forbidden"), { status: 403 });
    },
    publication: async (req) => {
      const p = (
        await pool.query("SELECT * FROM publications WHERE slug=$1", [
          req.params.slug,
        ])
      ).rows[0];
      if (!p) throw Object.assign(Error("Missing"), { status: 404 });
      return p;
    },
    member: async (req) => {
      if (!req.headers["x-test-user"])
        throw Object.assign(Error("Sign in"), { status: 401 });
      return { id: req.headers["x-test-user"] };
    },
  };
  mountFiles(app, helpers);
  mountAutomation(app, helpers);
  app.use((err, _req, res, _next) =>
    res.status(err.status || 400).json({ error: err.message }),
  );
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, user, body, method = body ? "POST" : "GET") =>
    fetch(base + path, {
      method,
      headers: {
        ...(user ? { "x-test-user": user } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  const upload = await request("/api/apps/app-a/files", "alice", {
    name: "notes.txt",
    mime: "text/plain",
    base64: Buffer.from("private notes").toString("base64"),
  });
  assert.equal(upload.status, 201);
  const file = await upload.json();
  assert.equal(
    (await request(`/api/apps/app-a/files/${file.id}`, "bob")).status,
    404,
  );
  assert.equal(
    (await request(`/api/apps/app-b/files/${file.id}`, "alice")).status,
    404,
  );
  assert.equal(
    (await request(`/api/apps/app-a/files/${file.id}`, null)).status,
    401,
  );
  const download = await request(`/api/apps/app-a/files/${file.id}`, "alice");
  assert.equal(await download.text(), "private notes");
  assert.ok(
    download.headers.get("content-disposition").startsWith("attachment"),
  );
  assert.equal(
    (
      await request("/api/apps/app-a/files", "alice", {
        name: "../bad.txt",
        mime: "text/plain",
        base64: "YQ==",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/api/apps/app-a/files", "alice", {
        name: "bad.png",
        mime: "image/png",
        base64: "YQ==",
      })
    ).status,
    400,
  );
  assert.equal(
    (await request(`/api/apps/app-a/files/${file.id}`, "bob", null, "DELETE"))
      .status,
    404,
  );
  assert.equal(
    (await request(`/api/apps/app-a/files/${file.id}`, "alice", null, "DELETE"))
      .status,
    200,
  );
  assert.equal(
    (await request("/api/projects/app-a/jobs", "alice")).status,
    403,
  );
  assert.equal(
    (await request("/api/projects/app-a/jobs", "builder")).status,
    200,
  );
  assert.equal(
    (
      await request("/api/apps/app-a/notifications", "bob").then((r) =>
        r.json(),
      )
    ).length,
    0,
  );
  assert.equal(
    (
      await request("/api/apps/app-a/notifications", "alice").then((r) =>
        r.json(),
      )
    ).length,
    1,
  );
});

test("webhook secret references bind both project and exact endpoint", () => {
  const action = { secretRef: "CRM", url: "https://example.com/hook" };
  const env = {
    WEBHOOK_SECRET_CRM: "test-secret",
    WEBHOOK_SECRET_URL_CRM: action.url,
    WEBHOOK_SECRET_PROJECT_CRM: "app-a",
  };
  assert.equal(resolveWebhookSecret(action, "app-a", env), "test-secret");
  assert.throws(() => resolveWebhookSecret(action, "app-b", env));
  assert.throws(() =>
    resolveWebhookSecret(
      { ...action, url: "https://example.com/other" },
      "app-a",
      env,
    ),
  );
  assert.throws(() => resolveWebhookSecret(action, "app-a", {}));
});
