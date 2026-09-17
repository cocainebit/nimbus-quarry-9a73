import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApp } from "../server/app.mjs";
import {
  projectSchema,
  sectionSchema,
  pageFiles,
  safeLink,
  safeImage,
} from "../shared/schema.mjs";
async function serve(t, options) {
  const server = createApp(options).listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  );
  return `http://127.0.0.1:${server.address().port}`;
}
const post = (url, data) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
test("generation validates structured model output and normalizes editable sections", async (t) => {
  let request;
  const base = await serve(t, {
    model: "test-model",
    fetchImpl: async (_url, options) => {
      request = JSON.parse(options.body);
      return new Response(
        JSON.stringify({
          message: {
            content: JSON.stringify({
              pages: [
                {
                  name: "Home",
                  slug: "home",
                  description: "An honest bakery.",
                  sections: [
                    {
                      kind: "hero",
                      title: "Bread, baked every morning.",
                      body: "Visit our neighborhood bakery.",
                    },
                    {
                      kind: "faq",
                      title: "Before you visit",
                      body: "",
                      items: [
                        {
                          title: "Where are you?",
                          body: "See our contact page.",
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
          },
        }),
      );
    },
  });
  const response = await post(`${base}/api/generate`, {
    name: "Bakery",
    brief: "A bakery website for people in our neighborhood.",
  });
  assert.equal(response.status, 200);
  const data = projectSchema.parse(await response.json());
  assert.equal(data.source, "ai");
  assert.equal(data.pages[0].sections[1].items[0].title, "Where are you?");
  assert.match(request.messages[0].content, /Never invent image URLs/);
  assert.equal(request.stream, false);
});
test("section refinement preserves target id and rejects extra sections", async (t) => {
  let multiple = false;
  const base = await serve(t, {
    model: "test-model",
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          message: {
            content: JSON.stringify({
              sections: Array(multiple ? 2 : 1).fill({
                kind: "hero",
                title: "A clearer message",
                body: "Specific copy for our audience.",
              }),
            }),
          },
        }),
      ),
  });
  const section = sectionSchema.parse({
    id: "target",
    kind: "hero",
    title: "Old title",
    body: "Original text.",
  });
  const input = {
    name: "Studio",
    brief: "A small independent creative studio.",
    instruction: "Make the heading more direct.",
    pages: [{ id: "home", name: "Home" }],
    page: {
      id: "home",
      name: "Home",
      position: { x: 0, y: 0 },
      sections: [section],
    },
    sectionId: "target",
  };
  const response = await post(`${base}/api/refine`, input);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).sections[0].id, "target");
  multiple = true;
  assert.equal((await post(`${base}/api/refine`, input)).status, 502);
  assert.equal(
    (await post(`${base}/api/refine`, { ...input, sectionId: "missing" }))
      .status,
    400,
  );
});
test("provider failures never create projects and missing models return actionable errors", async (t) => {
  const base = await serve(t, {
    model: "",
    fetchImpl: async () => {
      throw Error("Should not call provider");
    },
  });
  const input = {
    name: "Studio",
    brief: "A small independent creative studio.",
  };
  assert.equal((await post(`${base}/api/generate`, input)).status, 503);
  assert.equal(
    (await post(`${base}/api/generate`, { name: "x", brief: "short" })).status,
    400,
  );
  const bad = await serve(t, {
    model: "test",
    fetchImpl: async () =>
      new Response(JSON.stringify({ message: { content: "not JSON" } })),
  });
  const response = await post(`${bad}/api/generate`, input);
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /malformed JSON/);
});
test("document URLs and images exclude executable sources; export filenames are collision-free", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hi",
    "//evil.test",
    "https://safe.test/\nattack",
  ])
    assert.equal(safeLink(url), "");
  assert.equal(safeImage("data:image/svg+xml;base64,PHN2Zz4="), "");
  assert.equal(
    safeImage("https://images.example.com/a.jpg"),
    "https://images.example.com/a.jpg",
  );
  assert.deepEqual(
    pageFiles({
      pages: [
        {},
        { slug: "about" },
        { slug: "about" },
        { slug: "index" },
        { slug: "server" },
      ],
    }),
    [
      "index.html",
      "about.html",
      "about-2.html",
      "index-2.html",
      "server-2.html",
    ],
  );
});
test("version 1 documents migrate without losing existing text", () => {
  const p = projectSchema.parse({
    id: "p",
    name: "Legacy",
    brief: "Original brief.",
    updated: "2026-09-16",
    source: "demo",
    theme: {
      accent: "#aabbcc",
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
            id: "intro",
            kind: "hero",
            title: "Original heading",
            body: "Original copy",
          },
        ],
      },
    ],
  });
  assert.equal(p.version, 2);
  assert.equal(p.pages[0].sections[0].title, "Original heading");
  assert.deepEqual(p.pages[0].sections[0].items, []);
  assert.equal(p.settings.email, "");
});
