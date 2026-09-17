import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import {
  backendPlanSchema,
  orderCollections,
  schemaFingerprint,
  createDraftSigner,
  applyBackendPlan,
  mountBackendAI,
} from "../server/backend-ai.mjs";
const collection = (
  key,
  fields = [{ name: "title", label: "Title", type: "text", required: true }],
) => ({
  key,
  definition: { name: key, fields, publicRead: false, memberCreate: true },
});
const plan = (collections = [collection("projects")]) => ({
  summary: "Project tracker",
  collections,
  unsupported: ["Booking availability is not generated."],
});
test("rejects executable code, extra permissions, unsafe identifiers and invalid rules", () => {
  for (const invalid of [
    { ...plan(), sql: "DROP TABLE projects" },
    plan([collection("__proto__")]),
    plan([
      collection("p", [{ name: "constructor", label: "Bad", type: "text" }]),
    ]),
    plan([
      collection("p", [
        {
          name: "status",
          label: "Status",
          type: "enum",
          options: ["todo"],
          transitions: { todo: ["paid"] },
        },
      ]),
    ]),
    plan([collection("p"), collection("p")]),
  ])
    assert.equal(backendPlanSchema.safeParse(invalid).success, false);
  assert.equal(backendPlanSchema.safeParse(plan()).success, true);
});
test("references sort topologically and reject cycles or absent/cross-app targets", () => {
  const c = collection("tasks", [
    {
      name: "project",
      label: "Project",
      type: "reference",
      referenceCollectionId: "projects",
    },
  ]);
  assert.deepEqual(
    orderCollections(plan([c, collection("projects")])).map((c) => c.key),
    ["projects", "tasks"],
  );
  assert.throws(() => orderCollections(plan([c])), /missing reference/);
  assert.throws(
    () =>
      orderCollections(
        plan([
          collection("a", [
            {
              name: "b",
              label: "B",
              type: "reference",
              referenceCollectionId: "b",
            },
          ]),
          collection("b", [
            {
              name: "a",
              label: "A",
              type: "reference",
              referenceCollectionId: "a",
            },
          ]),
        ]),
      ),
    /cyclic/,
  );
});
test("draft signing rejects modification and expiry", () => {
  const signer = createDraftSigner("test secret");
  const token = signer.issue({ projectId: "p", ownerId: "u" });
  assert.equal(signer.read(token).projectId, "p");
  assert.throws(() => signer.read(token + "x"), /modified/);
  const now = Date.now;
  try {
    Date.now = () => now() + 31 * 60 * 1000;
    assert.throws(() => signer.read(token), /expired/);
  } finally {
    Date.now = now;
  }
});
function fakeDB({ existing = [], owner = true } = {}) {
  const calls = [];
  const staged = [];
  let released = false;
  const db = {
    query: async (sql) => {
      calls.push(sql);
      if (sql.startsWith("SELECT id FROM projects"))
        return { rows: owner ? [{ id: "p" }] : [] };
      if (sql.startsWith("SELECT * FROM collections"))
        return { rows: existing };
      if (sql === "ROLLBACK") staged.length = 0;
      return { rows: [] };
    },
    release: () => {
      released = true;
    },
  };
  return {
    pool: { connect: async () => db },
    calls,
    staged,
    get released() {
      return released;
    },
  };
}
test("apply rechecks ownership and stale fingerprint before mutation", async () => {
  for (const options of [
    { owner: false },
    { existing: [{ id: "x", name: "New", fields: [] }] },
  ]) {
    const fake = fakeDB(options);
    let writes = 0;
    await assert.rejects(
      applyBackendPlan(
        fake.pool,
        {
          projectId: "p",
          ownerId: "u",
          fingerprint: schemaFingerprint([]),
          plan: plan(),
        },
        {
          lockProject: async () => {},
          createCollection: async () => {
            writes++;
          },
        },
      ),
    );
    assert.equal(writes, 0);
    assert.ok(fake.calls.includes("ROLLBACK"));
    assert.ok(fake.released);
  }
});
test("apply resolves symbolic relationships and atomically rolls back failures", async () => {
  const proposed = plan([
    collection("tasks", [
      {
        name: "project",
        label: "Project",
        type: "reference",
        referenceCollectionId: "projects",
      },
    ]),
    collection("projects"),
  ]);
  const fake = fakeDB();
  let i = 0;
  const result = await applyBackendPlan(
    fake.pool,
    {
      projectId: "p",
      ownerId: "u",
      fingerprint: schemaFingerprint([]),
      plan: proposed,
    },
    {
      lockProject: async () => {},
      createCollection: async (_db, _p, input) => {
        if (i === 1)
          assert.equal(input.fields[0].referenceCollectionId, "id-0");
        return { id: `id-${i++}`, ...input };
      },
    },
  );
  assert.equal(result.length, 2);
  assert.ok(fake.calls.includes("COMMIT"));
  assert.ok(fake.released);
  const broken = fakeDB();
  let writes = 0;
  await assert.rejects(
    applyBackendPlan(
      broken.pool,
      {
        projectId: "p",
        ownerId: "u",
        fingerprint: schemaFingerprint([]),
        plan: proposed,
      },
      {
        lockProject: async () => {},
        createCollection: async () => {
          if (writes++) throw new Error("Constraint violation");
          broken.staged.push("first");
          return { id: "first" };
        },
      },
    ),
    /Constraint/,
  );
  assert.deepEqual(broken.staged, []);
  assert.ok(broken.calls.includes("ROLLBACK"));
  assert.ok(!broken.calls.includes("COMMIT"));
});
test("preview uses provider without writes and discloses limits; apply rejects token from another owner", async () => {
  const queries = [];
  let modelCalls = 0;
  const app = express();
  app.use(express.json());
  mountBackendAI(app, {
    pool: {
      query: async (sql) => {
        queries.push(sql);
        return { rows: [] };
      },
    },
    owner: async (req) => ({
      id: req.params.id,
      owner_id: req.get("x-owner") || "u",
    }),
    provider: {
      configured: true,
      complete: async (system, user) => {
        modelCalls++;
        assert.match(system, /unsupported/);
        assert.match(user, /tracker/);
        return JSON.stringify(plan());
      },
    },
    secret: "test",
  });
  app.use((err, _req, res, _next) =>
    res.status(err.status || 400).json({ error: err.message }),
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    const response = await fetch(url + "/api/projects/p/backend-ai/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "A project tracker please" }),
    });
    assert.equal(response.status, 200);
    const draft = await response.json();
    assert.equal(modelCalls, 1);
    assert.equal(queries.length, 1);
    assert.ok(queries[0].startsWith("SELECT"));
    assert.ok(draft.limits.some((l) => l.includes("Payments")));
    assert.equal(draft.plan.unsupported.length, 1);
    const applied = await fetch(url + "/api/projects/p/backend-ai/apply", {
      method: "POST",
      headers: { "content-type": "application/json", "x-owner": "other" },
      body: JSON.stringify({ token: draft.token }),
    });
    assert.equal(applied.status, 403);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
