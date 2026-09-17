import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { connectDatabase, migrate } from "../server/db.mjs";
import { createAuth } from "../server/auth.mjs";
import { createApp } from "../server/app.mjs";
import { projectSchema } from "../shared/schema.mjs";

test("schema runtime: safe migrations, references, roles, constraints, concurrency and archive", async (t) => {
  const admin = connectDatabase();
  const name = `studio_test_${randomUUID().replaceAll("-", "")}`;
  await admin.query(`CREATE DATABASE ${name}`);
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `/${name}`;
  const pool = connectDatabase(url.toString());
  let server;
  t.after(async () => {
    if (server)
      await new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
      });
    await pool.end();
    await admin.query(`DROP DATABASE ${name}`);
    await admin.end();
  });
  const origin = "http://127.0.0.1:5173";
  const mail = [];
  const auth = createAuth(pool, {
    origin,
    secret: randomUUID() + randomUUID(),
    production: false,
    mailer: { sendMail: async (m) => mail.push(m) },
  });
  await migrate(pool, auth);
  server = createApp({ pool, auth, origin, model: "" }).listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  const client = () => {
    let cookie = "";
    return async (
      path,
      body,
      method = body === undefined ? "GET" : "POST",
      customOrigin = origin,
    ) => {
      const r = await fetch(base + path, {
        method,
        headers: {
          origin: customOrigin,
          ...(cookie ? { cookie } : {}),
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      const cookies = r.headers.getSetCookie();
      if (cookies.length)
        cookie = cookies.map((c) => c.split(";")[0]).join("; ");
      const data = await r.json();
      return { status: r.status, data };
    };
  };
  const owner = client(),
    otherOwner = client(),
    alice = client(),
    bob = client(),
    anon = client();
  const register = async (c, member, email) => {
    const r = await c(`/api/${member ? "member-auth" : "auth"}/sign-up/email`, {
      name: "Test user",
      email,
      password: "Safe-test-password-123",
    });
    assert.equal(r.status, 200, JSON.stringify(r.data));
  };
  await register(owner, false, "owner@example.com");
  await register(otherOwner, false, "other@example.com");
  await register(alice, true, "alice@example.com");
  await register(bob, true, "bob@example.com");
  const doc = projectSchema.parse({
    id: randomUUID(),
    name: "Task app",
    brief: "Manage personal tasks",
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
          {
            id: "hero",
            kind: "hero",
            title: "Tasks",
            body: "Manage your work",
          },
        ],
      },
    ],
  });
  const path = `/api/projects/${doc.id}`;
  assert.equal(
    (await anon(path, { project: doc, revision: 0 }, "PUT")).status,
    401,
  );
  assert.equal(
    (
      await owner(
        path,
        { project: doc, revision: 0 },
        "PUT",
        "https://evil.example",
      )
    ).status,
    403,
  );
  assert.equal(
    (await owner(path, { project: doc, revision: 0 }, "PUT")).data.revision,
    1,
  );
  assert.equal((await otherOwner(path)).status, 404);
  assert.equal(
    (await otherOwner(path, { project: doc, revision: 1 }, "PUT")).status,
    409,
  );
  assert.equal(
    (await owner(path, { project: doc, revision: 0 }, "PUT")).status,
    409,
  );
  assert.equal(
    (await owner(path, { project: doc, revision: 1 }, "PUT")).data.revision,
    2,
  );
  assert.equal(
    (await alice(path)).status,
    401,
    "Member credentials must not grant builder access",
  );
  const fields = [
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
      unique: true,
      immutable: true,
    },
    {
      name: "status",
      label: "Status",
      type: "enum",
      required: true,
      options: ["todo", "done"],
      transitions: { todo: ["done"], done: [] },
    },
  ];
  const def = { name: "Tasks", fields, editorAccess: false };
  const c = (await owner(`${path}/collections`, def)).data;
  assert.equal(c.schema_version, 1);
  await owner(`${path}/publish`, { slug: "task-app", revision: 2 });
  await alice("/api/apps/task-app/join", {});
  await bob("/api/apps/task-app/join", {});
  const route = `/api/apps/task-app/collections/${c.id}/records`;
  const r = (await alice(route, { data: { title: "one", status: "todo" } }))
    .data;
  assert.ok(r.id);
  assert.equal(
    (await bob(route, { data: { title: "one", status: "todo" } })).status,
    409,
    "unique values global to collection",
  );
  assert.equal(
    (
      await alice(
        `${route}/${r.id}`,
        { data: { title: "changed", status: "todo" }, version: 1 },
        "PATCH",
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await alice(
        `${route}/${r.id}`,
        { data: { title: "one", status: "done" }, version: 1 },
        "PATCH",
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await alice(
        `${route}/${r.id}`,
        { data: { title: "one", status: "todo" }, version: 2 },
        "PATCH",
      )
    ).status,
    400,
  );
  const members = (await owner(`${path}/members`)).data;
  const bobId = members.find((m) => m.email === "bob@example.com").user_id;
  assert.equal(
    (await owner(`${path}/members/${bobId}`, { role: "editor" }, "PATCH"))
      .status,
    200,
  );
  assert.equal(
    (await bob(route)).data.length,
    0,
    "role does not override default private policy",
  );
  const schema = `${path}/collections/${c.id}/schema`;
  assert.equal(
    (await owner(`${schema}/preview`, { ...def, fields: [fields[0]] })).data
      .safe,
    false,
  );
  assert.equal(
    (
      await owner(
        schema,
        { ...def, fields: [fields[0]], schemaVersion: 1 },
        "PUT",
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await owner(`${schema}/preview`, {
        ...def,
        fields: [
          ...fields,
          { name: "required", label: "Required", type: "text", required: true },
        ],
      })
    ).data.safe,
    false,
  );
  const expanded = {
    ...def,
    editorAccess: true,
    fields: [...fields, { name: "notes", label: "Notes", type: "text" }],
  };
  assert.equal((await owner(`${schema}/preview`, expanded)).data.safe, true);
  assert.equal(
    (await owner(schema, { ...expanded, schemaVersion: 1 }, "PUT")).data
      .schema_version,
    2,
  );
  assert.equal(
    (await owner(schema, { ...expanded, schemaVersion: 1 }, "PUT")).status,
    409,
  );
  assert.equal(
    (await bob(route)).data.length,
    1,
    "explicit editorAccess enables team access",
  );
  assert.equal(
    (
      await bob(
        `${route}/${r.id}`,
        { data: { title: "one", status: "done", notes: "team" }, version: 2 },
        "PATCH",
      )
    ).status,
    200,
  );
  const refDef = {
    name: "Comments",
    fields: [
      {
        name: "task",
        label: "Task",
        type: "reference",
        referenceCollectionId: c.id,
        required: true,
      },
    ],
  };
  const ref = (await owner(`${path}/collections`, refDef)).data;
  const refRoute = `/api/apps/task-app/collections/${ref.id}/records`;
  const rr = (await alice(refRoute, { data: { task: r.id } })).data;
  assert.ok(rr.id);
  assert.equal(
    (await alice(`${route}/${r.id}`, { version: 3 }, "DELETE")).status,
    409,
    "restrict deleting referenced record",
  );
  const second = { ...doc, id: randomUUID() };
  await owner(
    `/api/projects/${second.id}`,
    { project: second, revision: 0 },
    "PUT",
  );
  assert.equal(
    (await owner(`/api/projects/${second.id}/collections`, refDef)).status,
    400,
    "cross-app reference schema blocked",
  );
  await owner(`${path}/members/${bobId}`, { role: "member" }, "PATCH");
  assert.equal(
    (await bob(refRoute, { data: { task: r.id } })).status,
    400,
    "cannot reference another users private record",
  );
  await alice(`${refRoute}/${rr.id}`, { version: 1 }, "DELETE");
  assert.equal(
    (await alice(`${route}/${r.id}`, { version: 3 }, "DELETE")).status,
    200,
  );
  // Both concurrent writers serialize before checking unique values.
  const results = await Promise.all([
    alice(route, { data: { title: "race", status: "todo" } }),
    bob(route, { data: { title: "race", status: "todo" } }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  assert.equal((await otherOwner(`${schema}/preview`, expanded)).status, 404);
  assert.equal((await owner(path, { revision: 1 }, "DELETE")).status, 409);
  assert.equal((await owner(path, { revision: 2 }, "DELETE")).status, 200);
  assert.equal((await owner(path)).status, 404);
  assert.equal((await anon("/api/apps/task-app")).status, 404);
});
