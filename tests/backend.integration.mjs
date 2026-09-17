import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { connectDatabase, migrate } from "../server/db.mjs";
import { createAuth } from "../server/auth.mjs";
import { createApp } from "../server/app.mjs";
import { projectSchema } from "../shared/schema.mjs";

test("real PostgreSQL app runtime: accounts, publishing, ownership, CRUD, recovery, contacts and unpublishing", async (t) => {
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
    { name: "title", label: "Title", type: "text", required: true },
    { name: "done", label: "Done", type: "boolean", required: false },
  ];
  const create = await owner(`${path}/collections`, {
    name: "Tasks",
    fields,
    publicRead: false,
    memberCreate: true,
  });
  assert.equal(create.status, 201, JSON.stringify(create.data));
  const id = create.data.id;
  assert.equal(
    (await otherOwner(`${path}/collections`, { name: "Attack", fields }))
      .status,
    404,
  );
  assert.equal(
    (await owner(`${path}/publish`, { slug: "task-app", revision: 1 })).status,
    409,
  );
  assert.equal(
    (await owner(`${path}/publish`, { slug: "task-app", revision: 2 })).status,
    200,
  );
  const app = "/api/apps/task-app";
  const records = `${app}/collections/${id}/records`;
  assert.equal((await anon(app)).data.project.name, "Task app");
  assert.equal(
    (await owner(records)).status,
    401,
    "Builder cookie must not grant member access",
  );
  assert.equal((await alice(records)).status, 403);
  await alice(`${app}/join`, {});
  await bob(`${app}/join`, {});
  assert.equal((await anon(records)).status, 401);
  assert.equal(
    (await alice(records, { data: { title: "One", owner_id: "forged" } }))
      .status,
    400,
  );
  assert.equal(
    (await alice(records, { data: { title: "One" }, owner_id: "forged" }))
      .status,
    400,
  );
  assert.equal(
    (await alice(records, { data: { title: "One", done: "yes" } })).status,
    400,
  );
  const created = await alice(records, {
    data: { title: "Private task", done: false },
  });
  assert.equal(created.status, 201);
  const record = created.data;
  assert.equal((await bob(records)).data.length, 0);
  assert.equal((await alice(records)).data[0].canEdit, true);
  assert.equal(
    (
      await bob(
        `${records}/${record.id}`,
        { data: { title: "Hacked" }, version: 1 },
        "PATCH",
      )
    ).status,
    409,
  );
  assert.equal(
    (await bob(`${records}/${record.id}`, { version: 1 }, "DELETE")).status,
    409,
  );
  assert.equal(
    (
      await alice(
        `${records}/${record.id}`,
        { data: { title: "Finished", done: true }, version: 1 },
        "PATCH",
      )
    ).data.version,
    2,
  );
  assert.equal(
    (
      await alice(
        `${records}/${record.id}`,
        { data: { title: "Stale" }, version: 1 },
        "PATCH",
      )
    ).status,
    409,
  );
  const publicC = (
    await owner(`${path}/collections`, {
      name: "Announcements",
      fields,
      publicRead: true,
    })
  ).data;
  await bob(`${app}/collections/${publicC.id}/records`, {
    data: { title: "Public announcement" },
  });
  const publicRows = await anon(`${app}/collections/${publicC.id}/records`);
  assert.equal(publicRows.data.length, 1);
  assert.equal(publicRows.data[0].canEdit, false);
  assert.equal("owner_id" in publicRows.data[0], false);
  // Same user, another app: collection IDs cannot be used outside their owning app.
  const doc2 = { ...doc, id: randomUUID(), name: "Second app" };
  await owner(
    `/api/projects/${doc2.id}`,
    { project: doc2, revision: 0 },
    "PUT",
  );
  await owner(`/api/projects/${doc2.id}/publish`, {
    slug: "second-app",
    revision: 1,
  });
  await alice("/api/apps/second-app/join", {});
  assert.equal(
    (await alice(`/api/apps/second-app/collections/${id}/records`)).status,
    404,
  );
  assert.equal(
    (
      await anon(`${app}/contact`, {
        name: "Visitor",
        email: "visitor@example.com",
        message: "Please send more information.",
      })
    ).status,
    201,
  );
  assert.equal((await owner(`${path}/backend`)).data.submissions.length, 1);
  assert.equal((await owner(`${path}/backend`)).data.members, 2);
  assert.equal(
    (await owner(`${path}/collections/${id}/records`)).data.length,
    1,
  );
  // Publishing a newer document does not wipe runtime data.
  await owner(
    path,
    { project: { ...doc, name: "Updated task app" }, revision: 2 },
    "PUT",
  );
  await owner(`${path}/publish`, { slug: "task-app", revision: 3 });
  assert.equal((await alice(records)).data[0].data.title, "Finished");
  await bob("/api/member-auth/request-password-reset", {
    email: "bob@example.com",
    redirectTo: `${origin}/reset-password?member=1`,
  });
  assert.equal(mail.length, 1);
  const link = mail[0].text.match(/http[^\s]+/)[0];
  const resetToken = new URL(link).pathname.split("/").at(-1);
  const reset = await anon("/api/member-auth/reset-password", {
    token: resetToken,
    newPassword: "Another-safe-password-123",
  });
  assert.equal(reset.status, 200, JSON.stringify(reset.data));
  assert.equal(
    (await bob(records)).status,
    401,
    "Password reset revokes old sessions",
  );
  assert.equal(
    (await alice(`${records}/${record.id}`, { version: 2 }, "DELETE")).status,
    200,
  );
  assert.equal((await alice(records)).data.length, 0);
  await owner(`${path}/publish`, undefined, "DELETE");
  assert.equal((await anon(app)).status, 404);
  assert.equal((await alice(records)).status, 404);
});
