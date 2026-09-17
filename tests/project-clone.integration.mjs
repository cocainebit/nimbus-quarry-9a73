import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { connectDatabase, migrate } from "../server/db.mjs";
import { createAuth } from "../server/auth.mjs";
import { cloneProject } from "../server/project-clone.mjs";
import { catalogProject } from "../server/app-catalog.mjs";
import { getAppDesign } from "../shared/app-design.mjs";
import { appCatalog } from "../shared/app-catalog.mjs";
import { createCollection, transaction } from "../server/backend-data.mjs";
test("duplicate remaps the entire app graph, excludes private data, and rejects foreign/archived owners atomically", async (t) => {
  const admin = connectDatabase();
  const name = `clone_test_${randomUUID().replaceAll("-", "")}`;
  await admin.query(`CREATE DATABASE ${name}`);
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `/${name}`;
  const pool = connectDatabase(url.toString());
  t.after(async () => {
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
  const template = appCatalog[0];
  const id = randomUUID();
  const ids = new Map();
  await transaction(pool, async (db) => {
    const initial = catalogProject(template, { id });
    await db.query(
      "INSERT INTO projects(id,owner_id,document) VALUES($1,$2,$3)",
      [id, "owner", JSON.stringify(initial)],
    );
    for (const c of template.collections) {
      const row = await createCollection(db, id, {
        ...c.definition,
        fields: c.definition.fields.map((f) =>
          f.type === "reference"
            ? { ...f, referenceCollectionId: ids.get(f.referenceCollectionId) }
            : f,
        ),
      });
      ids.set(c.key, row.id);
    }
    const final = catalogProject(template, { id, collectionIds: ids });
    final.app.design = getAppDesign(final.app);
    final.app.design.widgets = [
      {
        id: "projects-total",
        title: "Projects",
        type: "count",
        collectionId: ids.get("projects"),
        limit: 5,
      },
    ];
    await db.query("UPDATE projects SET document=$2 WHERE id=$1", [
      id,
      JSON.stringify(final),
    ]);
  });
  await pool.query(
    "INSERT INTO app_members(project_id,user_id) VALUES($1,$2)",
    [id, "private-member"],
  );
  await pool.query(
    "INSERT INTO records(id,collection_id,owner_id,data) VALUES($1,$2,$3,$4)",
    [
      randomUUID(),
      ids.get("projects"),
      "private-member",
      JSON.stringify({ name: "Secret customer project", status: "active" }),
    ],
  );
  await pool.query(
    "INSERT INTO app_files(id,project_id,owner_id,name,mime,size,content) VALUES($1,$2,$3,$4,$5,1,$6)",
    [
      randomUUID(),
      id,
      "private-member",
      "secret.txt",
      "text/plain",
      Buffer.from("x"),
    ],
  );
  await pool.query(
    "INSERT INTO workflows(id,project_id,name,collection_id,event,action) VALUES($1,$2,$3,$4,$5,$6)",
    [
      randomUUID(),
      id,
      "Private notification",
      ids.get("projects"),
      "record.created",
      JSON.stringify({ type: "notification", message: "Private" }),
    ],
  );
  await assert.rejects(cloneProject(pool, id, "other-owner"), /not found/);
  const cloned = await cloneProject(pool, id, "owner");
  assert.notEqual(cloned.project.id, id);
  assert.equal(cloned.revision, 1);
  assert.equal(cloned.collections.length, 3);
  const freshIds = cloned.collections.map((c) => c.id);
  assert.equal(cloned.project.app.design.widgets.length, 1);
  assert.ok(
    freshIds.includes(cloned.project.app.design.widgets[0].collectionId),
  );
  assert.notEqual(
    cloned.project.app.design.widgets[0].collectionId,
    ids.get("projects"),
  );
  for (const newId of freshIds) assert.ok(![...ids.values()].includes(newId));
  for (const n of cloned.project.app.navigation)
    assert.ok(freshIds.includes(n.collectionId));
  for (const c of cloned.collections)
    for (const f of c.fields.filter((f) => f.type === "reference"))
      assert.ok(freshIds.includes(f.referenceCollectionId));
  assert.equal(
    (
      await pool.query(
        "SELECT count(*)::int n FROM records WHERE collection_id=ANY($1)",
        [freshIds],
      )
    ).rows[0].n,
    0,
  );
  for (const table of ["app_members", "app_files", "workflows", "publications"])
    assert.equal(
      (
        await pool.query(
          `SELECT count(*)::int n FROM ${table} WHERE project_id=$1`,
          [cloned.project.id],
        )
      ).rows[0].n,
      0,
    );
  assert.equal(
    (
      await pool.query(
        "SELECT count(*)::int n FROM records WHERE collection_id=$1",
        [ids.get("projects")],
      )
    ).rows[0].n,
    1,
  );
  await pool.query("UPDATE projects SET archived_at=now() WHERE id=$1", [id]);
  await assert.rejects(cloneProject(pool, id, "owner"), /not found/);
  await pool.query("UPDATE projects SET archived_at=NULL WHERE id=$1", [id]);
  const badFields = [
    {
      name: "bad",
      label: "Bad",
      type: "reference",
      referenceCollectionId: "foreign-collection",
      required: false,
    },
  ];
  await pool.query("UPDATE collections SET fields=$2 WHERE id=$1", [
    ids.get("documents"),
    JSON.stringify(badFields),
  ]);
  await assert.rejects(cloneProject(pool, id, "owner"), /missing or cross-app/);
  assert.equal(
    (await pool.query("SELECT count(*)::int n FROM projects")).rows[0].n,
    2,
    "failed graph copy must not leave a partial project",
  );
});
