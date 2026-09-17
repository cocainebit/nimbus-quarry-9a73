import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import express from "express";
import { connectDatabase, migrate } from "../server/db.mjs";
import { createAuth } from "../server/auth.mjs";
import { mountAppCatalogue } from "../server/app-catalog.mjs";
import { appCatalog } from "../shared/app-catalog.mjs";
import { applyBackendPlan, schemaFingerprint } from "../server/backend-ai.mjs";

test("real PostgreSQL catalogue installation and AI plans: references, replay rejection, isolation and atomic rollback", async (t) => {
  const admin = connectDatabase();
  const name = `catalog_test_${randomUUID().replaceAll("-", "")}`;
  await admin.query(`CREATE DATABASE ${name}`);
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `/${name}`;
  const pool = connectDatabase(url.toString());
  let server;
  t.after(async () => {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    await pool.end();
    await admin.query(`DROP DATABASE ${name}`);
    await admin.end();
  });
  const auth = createAuth(pool, {
    origin: "http://127.0.0.1:5173",
    secret: randomUUID() + randomUUID(),
    production: false,
    mailer: { sendMail: async () => {} },
  });
  await migrate(pool, auth);
  const app = express();
  app.use(express.json());
  mountAppCatalogue(app, { pool, session: async () => ({ id: "test-owner" }) });
  app.use((e, _req, res, _next) =>
    res.status(e.status || 500).json({ error: e.message }),
  );
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const starter of appCatalog) {
    const template = starter.id;
    const response = await fetch(`${base}/api/catalog/${template}/install`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: `Custom ${template}` }),
    });
    const installed = await response.json();
    assert.equal(response.status, 201, JSON.stringify(installed));
    const p = installed.project;
    assert.equal(p.name, `Custom ${template}`);
    assert.equal(p.app.navigation.length, starter.collections.length);
    assert.equal(p.app.template, starter.runtime || template);
    const { rows } = await pool.query(
      "SELECT * FROM collections WHERE project_id=$1",
      [p.id],
    );
    assert.equal(rows.length, starter.collections.length);
    for (const widget of p.app.design.widgets) {
      const target = rows.find((c) => c.id === widget.collectionId);
      assert.ok(
        target,
        "Installed dashboard must point to its actual database collection",
      );
      if (widget.field)
        assert.ok(target.fields.some((f) => f.name === widget.field));
    }
    for (const c of rows)
      for (const f of c.fields.filter((f) => f.type === "reference"))
        assert.ok(rows.find((r) => r.id === f.referenceCollectionId));
    assert.equal(
      (
        await pool.query(
          "SELECT count(*)::int n FROM records WHERE collection_id=ANY($1)",
          [rows.map((r) => r.id)],
        )
      ).rows[0].n,
      0,
    );
    const definition = {
      name: "New collection",
      fields: [{ name: "title", label: "Title", type: "text", required: true }],
    };
    const draft = {
      projectId: p.id,
      ownerId: "test-owner",
      fingerprint: schemaFingerprint(rows),
      plan: {
        summary: "Add related data",
        unsupported: [],
        collections: [{ key: "new", definition }],
      },
    };
    await assert.rejects(
      applyBackendPlan(pool, { ...draft, ownerId: "other-owner" }),
      /not found/,
    );
    const created = await applyBackendPlan(pool, draft);
    assert.equal(created.length, 1);
    await assert.rejects(applyBackendPlan(pool, draft), /changed after/);
    const current = (
      await pool.query("SELECT * FROM collections WHERE project_id=$1", [p.id])
    ).rows;
    const failing = {
      ...draft,
      fingerprint: schemaFingerprint(current),
      plan: {
        summary: "Conflicting name after valid insert",
        unsupported: [],
        collections: [
          {
            key: "first",
            definition: { ...definition, name: "Should roll back" },
          },
          { key: "second", definition: { ...definition, name: rows[0].name } },
        ],
      },
    };
    await assert.rejects(applyBackendPlan(pool, failing));
    assert.equal(
      (
        await pool.query(
          "SELECT count(*)::int n FROM collections WHERE project_id=$1",
          [p.id],
        )
      ).rows[0].n,
      rows.length + 1,
    );
    assert.equal(
      (
        await pool.query(
          "SELECT count(*)::int n FROM collections WHERE project_id=$1 AND name=$2",
          [p.id, "Should roll back"],
        )
      ).rows[0].n,
      0,
    );
  }
});
