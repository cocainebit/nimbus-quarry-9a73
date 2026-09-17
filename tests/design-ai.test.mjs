import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { once } from "node:events";
import {
  mountDesignAI,
  validateDesignBindings,
  designPlanSchema,
  designFingerprint,
} from "../server/design-ai.mjs";
import { projectSchema } from "../shared/schema.mjs";
import { getAppDesign } from "../shared/app-design.mjs";
const collections = [
  {
    id: "tasks",
    name: "Tasks",
    fields: [
      { name: "title", label: "Title", type: "text" },
      {
        name: "status",
        label: "Status",
        type: "enum",
        options: ["open", "done"],
      },
      { name: "cost", label: "Cost", type: "number" },
    ],
  },
];
const app = {
  template: "tracker",
  title: "Work",
  description: "A useful workspace",
  navigation: [
    {
      collectionId: "tasks",
      label: "Tasks",
      view: "board",
      statusField: "status",
    },
  ],
  design: {
    ...getAppDesign({ template: "tracker" }),
    widgets: [
      {
        id: "total",
        title: "Total cost",
        type: "sum",
        collectionId: "tasks",
        field: "cost",
        limit: 5,
      },
    ],
  },
};
const project = projectSchema.parse({
  id: "p",
  name: "Work",
  brief: "Private customer context",
  updated: "today",
  source: "demo",
  app,
  theme: {
    accent: "#112233",
    background: "#ffffff",
    font: "sans-serif",
    radius: 8,
  },
  pages: [{ id: "home", name: "Home", position: { x: 0, y: 0 }, sections: [] }],
});
test("AI design validates existing bindings, allowed metrics and no duplicate screens", () => {
  assert.equal(
    validateDesignBindings(
      designPlanSchema.parse({
        summary: "A clearer workspace",
        app,
        unsupported: [],
      }).app,
      collections,
    ).title,
    "Work",
  );
  for (const change of [
    { ...app, navigation: [{ ...app.navigation[0], collectionId: "other" }] },
    { ...app, navigation: [...app.navigation, ...app.navigation] },
    { ...app, navigation: [{ ...app.navigation[0], statusField: "title" }] },
    {
      ...app,
      navigation: [{ ...app.navigation[0], visibleFields: ["secret_field"] }],
    },
    {
      ...app,
      design: {
        ...app.design,
        widgets: [{ ...app.design.widgets[0], field: "title" }],
      },
    },
  ])
    assert.throws(() => validateDesignBindings(change, collections));
  assert.throws(() =>
    designPlanSchema.parse({
      summary: "Bad script",
      app: { ...app, code: "alert(1)" },
      unsupported: [],
    }),
  );
  assert.throws(() =>
    designPlanSchema.parse({
      summary: "Bad color",
      app: {
        ...app,
        design: {
          ...app.design,
          palette: { ...app.design.palette, primary: "url(javascript:evil)" },
        },
      },
      unsupported: [],
    }),
  );
  assert.notEqual(
    designFingerprint(project),
    designFingerprint({ ...project, name: "Changed" }),
  );
});
test("design preview is authenticated, validated, model-backed, and never writes data", async (t) => {
  let rejectOwner = false;
  let configured = true;
  let output = {
    summary: "Editorial workspace",
    app,
    unsupported: ["Payment processing is not configured."],
  };
  let modelRequest;
  const serverApp = express();
  serverApp.use(express.json());
  mountDesignAI(serverApp, {
    pool: {
      query: async (sql, args) => {
        assert.match(sql, /^SELECT id,name,fields/);
        assert.deepEqual(args, ["p"]);
        return { rows: collections };
      },
    },
    owner: async () => {
      if (rejectOwner) throw Object.assign(Error("Sign in"), { status: 401 });
      return { id: "p", owner_id: "owner" };
    },
    provider: {
      get configured() {
        return configured;
      },
      complete: async (system, user) => {
        modelRequest = { system, user };
        return JSON.stringify(output);
      },
    },
  });
  serverApp.use((err, _req, res, _next) =>
    res.status(err.status || 400).json({ error: err.message }),
  );
  const server = serverApp.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  );
  const endpoint = `http://127.0.0.1:${server.address().port}/api/projects/p/design-ai/preview`;
  const post = (body) =>
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  const response = await post({
    prompt: "Create a restrained editorial dashboard.",
    project,
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.app.design.widgets[0].field, "cost");
  assert.equal(result.baseFingerprint, designFingerprint(project));
  assert.match(modelRequest.system, /No invented statistics/);
  assert.equal("brief" in modelRequest.user, false);
  assert.equal("pages" in modelRequest.user, false);
  output = {
    summary: "Wrong app",
    app: {
      ...app,
      navigation: [{ ...app.navigation[0], collectionId: "foreign" }],
    },
    unsupported: [],
  };
  assert.equal(
    (await post({ prompt: "Make an attractive app", project })).status,
    502,
  );
  assert.equal(
    (
      await post({
        prompt: "Make an attractive app",
        project: { ...project, id: "other" },
      })
    ).status,
    400,
  );
  configured = false;
  assert.equal(
    (await post({ prompt: "Make an attractive app", project })).status,
    503,
  );
  rejectOwner = true;
  assert.equal(
    (await post({ prompt: "Make an attractive app", project })).status,
    401,
  );
});
