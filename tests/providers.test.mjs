import test from "node:test";
import assert from "node:assert/strict";
import { createProvider } from "../server/providers.mjs";
import { createApp } from "../server/app.mjs";
import { once } from "node:events";

for (const provider of ["venice", "chutes"]) {
  test(`${provider} authenticates server-side, reports model availability and generates validated sites`, async (t) => {
    const requests = [];
    const app = createApp({
      provider,
      model: "example-model",
      apiKey: "private-test-key",
      fetchImpl: async (url, options) => {
        requests.push({ url, ...options });
        if (url.endsWith("/models"))
          return Response.json({ data: [{ id: "example-model" }] });
        return Response.json({
          choices: [
            {
              finish_reason: "stop",
              message: {
                content: JSON.stringify({
                  pages: [
                    {
                      name: "Home",
                      slug: "home",
                      sections: [
                        {
                          kind: "hero",
                          title: "Fresh bread",
                          body: "Baked daily.",
                        },
                      ],
                    },
                  ],
                }),
              },
            },
          ],
        });
      },
    });
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(
      () =>
        new Promise((resolve) => {
          server.closeAllConnections();
          server.close(resolve);
        }),
    );
    const base = `http://127.0.0.1:${server.address().port}`;
    const status = await (await fetch(`${base}/api/status`)).json();
    assert.equal(status.modelInstalled, true);
    assert.equal(JSON.stringify(status).includes("private-test-key"), false);
    const response = await fetch(`${base}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Bakery",
        brief: "A neighborhood bakery selling fresh bread.",
      }),
    });
    assert.equal(response.status, 200);
    assert.equal(
      (await response.json()).pages[0].sections[0].title,
      "Fresh bread",
    );
    assert.equal(requests[1].headers.Authorization, "Bearer private-test-key");
    assert.match(requests[1].url, /\/chat\/completions$/);
    assert.equal(requests[1].redirect, "error");
    const body = JSON.parse(requests[1].body);
    assert.equal(body.model, "example-model");
    if (provider === "venice")
      assert.equal(body.venice_parameters.include_venice_system_prompt, false);
  });
}
test("missing hosted credentials never contact provider; unsupported provider fails clearly", async () => {
  const provider = createProvider({
    provider: "chutes",
    model: "test",
    apiKey: "",
    fetchImpl: () => assert.fail("Unexpected request"),
  });
  assert.equal((await provider.status()).configured, false);
  await assert.rejects(provider.complete("system", {}), /CHUTES_API_KEY/);
  assert.throws(
    () => createProvider({ provider: "unknown" }),
    /MODEL_PROVIDER/,
  );
  assert.throws(
    () => createProvider({ provider: "venice", baseUrl: "http://example.com" }),
    /HTTPS/,
  );
});
test("hosted provider failures are sanitized and oversized or truncated responses rejected", async () => {
  for (const [response, pattern] of [
    [new Response("secret-upstream-body", { status: 401 }), /credentials/],
    [new Response("busy", { status: 429 }), /rate limited/],
    [new Response("x".repeat(2_000_001)), /size limit/],
    [
      Response.json({
        choices: [{ finish_reason: "length", message: { content: "{}" } }],
      }),
      /output space/,
    ],
    [Response.json({ choices: [] }), /no website content/],
  ]) {
    const provider = createProvider({
      provider: "chutes",
      model: "test",
      apiKey: "secret",
      fetchImpl: async () => response,
    });
    await assert.rejects(provider.complete("system", {}), pattern);
  }
});
