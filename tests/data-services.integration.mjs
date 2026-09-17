import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { connectDatabase } from "../server/db.mjs";
import { mountRecordQueries } from "../server/record-queries.mjs";
import {
  mountProjectHistory,
  saveProjectRevision,
} from "../server/project-history.mjs";
import { projectSchema } from "../shared/schema.mjs";

test("PostgreSQL queries and history: full dataset aggregates, private scopes, typed filters, stable pagination and atomic restoration", async (t) => {
  const admin = connectDatabase(),
    name = `data_test_${randomUUID().replaceAll("-", "")}`;
  await admin.query(`CREATE DATABASE ${name}`);
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `/${name}`;
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
    "005-project-archive.sql",
    "007-history.sql",
  ])
    await pool.query(
      await readFile(
        new URL(`../server/migrations/${file}`, import.meta.url),
        "utf8",
      ),
    );
  const document = projectSchema.parse({
    id: "project",
    name: "Original",
    brief: "Example",
    updated: new Date().toISOString(),
    source: "demo",
    theme: {
      accent: "#abcdef",
      background: "#ffffff",
      font: "sans-serif",
      radius: 8,
    },
    pages: [
      {
        id: "home",
        name: "Home",
        position: { x: 0, y: 0 },
        sections: [
          { id: "hero", kind: "hero", title: "Hello", body: "Welcome" },
        ],
      },
    ],
  });
  await pool.query(
    "INSERT INTO projects(id,owner_id,document) VALUES($1,$2,$3)",
    ["project", "owner", document],
  );
  await pool.query(
    "INSERT INTO collections(id,project_id,name,fields) VALUES($1,$2,$3,$4)",
    [
      "tasks",
      "project",
      "Tasks",
      JSON.stringify([
        { name: "title", type: "text" },
        { name: "amount", type: "number" },
        { name: "status", type: "enum" },
      ]),
    ],
  );
  await pool.query(
    "INSERT INTO records(id,collection_id,owner_id,data) SELECT 'r'||lpad(i::text,4,'0'),'tasks',CASE WHEN i<=150 THEN 'alice' ELSE 'bob' END,jsonb_build_object('title','Task '||i,'amount',i,'status',CASE WHEN i%2=0 THEN 'open' ELSE 'closed' END) FROM generate_series(1,220) i",
  );
  const app = express();
  app.use(express.json());
  const fail = (status) => Object.assign(Error("Denied"), { status });
  const session = async (req) => {
    if (!req.get("x-user")) throw fail(401);
    return { id: req.get("x-user") };
  };
  mountRecordQueries(app, {
    pool,
    publication: async (req) => {
      if (req.params.slug !== "demo") throw fail(404);
      return { project_id: "project" };
    },
    member: async (req) => {
      const u = await session(req);
      if (!["alice", "bob", "editor"].includes(u.id)) throw fail(403);
      return { ...u, role: u.id === "editor" ? "editor" : "member" };
    },
    auth: { member: { api: { getSession: async () => null } } },
  });
  mountProjectHistory(app, { pool, session });
  app.use((e, req, res, next) =>
    res
      .status(e.status || (e.name === "ZodError" ? 400 : 500))
      .json({ error: e.message }),
  );
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, body, user = "alice") => {
    const r = await fetch(base + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(user ? { "x-user": user } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: r.status, data: await r.json() };
  };
  const query = "/api/apps/demo/collections/tasks/query",
    summary = "/api/apps/demo/collections/tasks/summary";
  await t.test(
    "totals and aggregates cover >100 accessible rows only",
    async () => {
      let r = await request(query, {
        sort: { field: "amount", direction: "asc" },
        limit: 100,
      });
      assert.equal(r.status, 200);
      assert.equal(r.data.total, 150);
      assert.equal(r.data.records.length, 100);
      assert.equal(r.data.records[0].data.amount, 1);
      r = await request(query, {
        sort: { field: "amount", direction: "asc" },
        offset: 100,
        limit: 100,
      });
      assert.equal(r.data.records.length, 50);
      assert.equal(r.data.records[0].data.amount, 101);
      r = await request(summary, {
        metrics: [
          { name: "total", op: "count" },
          { name: "amount", op: "sum", field: "amount" },
        ],
      });
      assert.equal(r.data.total, 150);
      assert.deepEqual(r.data.groups, [
        { key: null, metrics: { total: 150, amount: 11325 } },
      ]);
      r = await request(summary, {
        groupBy: "status",
        metrics: [{ name: "count", op: "count" }],
      });
      assert.equal(r.data.groups.length, 2);
      assert.equal(r.data.groups[0].metrics.count, 75);
      r = await request(query, {
        filters: [{ field: "amount", op: "gt", value: 140 }],
        search: "Task",
      });
      assert.equal(r.data.total, 10);
      assert.equal((await request(query, {}, null)).status, 401);
      assert.equal(
        (
          await request(
            summary,
            { metrics: [{ name: "total", op: "count" }] },
            "intruder",
          )
        ).status,
        403,
      );
      assert.equal(
        (await request("/api/apps/demo/collections/other/query", {})).status,
        404,
      );
    },
  );
  await t.test(
    "allowlisted fields/operators and role-based access",
    async () => {
      assert.equal(
        (
          await request(query, {
            sort: {
              field: "amount) ; DROP TABLE records;--",
              direction: "asc",
            },
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await request(query, {
            filters: [{ field: "amount", op: "gt", value: "0 OR 1=1" }],
          })
        ).status,
        400,
      );
      assert.equal(
        (await request(query, { search: "' OR 1=1 --" })).data.total,
        0,
      );
      assert.equal((await request(query, { search: "%" })).data.total, 0);
      assert.equal(
        (
          await request(summary, {
            metrics: [{ name: "total", op: "sum", field: "title" }],
          })
        ).status,
        400,
      );
      await pool.query(
        "UPDATE collections SET editor_access=true WHERE id='tasks'",
      );
      assert.equal((await request(query, {}, "editor")).data.total, 220);
      await pool.query(
        "UPDATE collections SET public_read=true WHERE id='tasks'",
      );
      const r = await request(query, {}, null);
      assert.equal(r.data.total, 220);
      assert.equal(r.data.records[0].canEdit, false);
    },
  );
  await t.test(
    "owner-only revision inspection, conflicts and restoration leave records unchanged",
    async () => {
      await saveProjectRevision(pool, {
        projectId: "project",
        revision: 1,
        document,
        actorId: "owner",
      });
      const changed = { ...document, name: "Changed" };
      await pool.query(
        "UPDATE projects SET document=$1,revision=2 WHERE id='project'",
        [changed],
      );
      await saveProjectRevision(pool, {
        projectId: "project",
        revision: 2,
        document: changed,
        actorId: "owner",
      });
      const path = "/api/projects/project/history";
      assert.equal((await request(path, undefined, "bob")).status, 404);
      assert.equal(
        (await request(path, undefined, "owner")).data.revisions.length,
        2,
      );
      assert.equal(
        (await request(path + "/1/restore", { expectedRevision: 1 }, "owner"))
          .status,
        409,
      );
      const r = await request(
        path + "/1/restore",
        { expectedRevision: 2 },
        "owner",
      );
      assert.equal(r.status, 200);
      assert.equal(r.data.revision, 3);
      assert.equal(r.data.document.name, "Original");
      assert.equal(
        (await pool.query("SELECT count(*)::int n FROM records")).rows[0].n,
        220,
      );
      assert.equal(
        (await request(path + "/2", undefined, "owner")).data.document.name,
        "Changed",
      );
      const broken = {
        ...document,
        app: {
          template: "portal",
          title: "App",
          description: "App",
          navigation: [
            { collectionId: "foreign", label: "Foreign", view: "table" },
          ],
        },
      };
      await saveProjectRevision(pool, {
        projectId: "project",
        revision: 4,
        document: broken,
      });
      assert.equal(
        (await request(path + "/4/restore", { expectedRevision: 3 }, "owner"))
          .status,
        400,
      );
      assert.equal(
        (await pool.query("SELECT revision FROM projects WHERE id='project'"))
          .rows[0].revision,
        3,
      );
    },
  );
});
