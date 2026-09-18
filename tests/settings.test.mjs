import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Provider settings: what the operator chooses in the interface, where it is stored, and
 * the one rule that matters most, which is that a key never travels back to the browser.
 */

const directory = mkdtempSync(join(tmpdir(), "plotform-settings-"));
process.env.PLOTFORM_SETTINGS = join(directory, "settings.json");

const { activeProvider, chooseProvider, clearKey, publicSettings, setKey } =
  await import("../server/settings.mjs");
const { createProvider } = await import("../server/providers.mjs");

const withEnv = (values, run) => {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

test("with nothing chosen and nothing in the environment, the local provider is the default", () => {
  withEnv({ MODEL_PROVIDER: undefined, OLLAMA_MODEL: undefined }, () => {
    assert.equal(activeProvider().provider, "ollama");
  });
});

test("the environment still configures the app when the interface has not been used", () => {
  withEnv({ MODEL_PROVIDER: "venice", VENICE_MODEL: "from-env", VENICE_API_KEY: "env-key-value" }, () => {
    const active = activeProvider();
    assert.equal(active.provider, "venice");
    assert.equal(active.model, "from-env");
    assert.equal(active.apiKey, "env-key-value");
    assert.equal(active.chosenHere, false);
  });
});

test("a provider chosen in the interface outranks the environment, and survives a reload", () => {
  withEnv({ MODEL_PROVIDER: "venice", VENICE_MODEL: "from-env" }, () => {
    chooseProvider("openrouter", "anthropic/claude-sonnet-4.5");
    const active = activeProvider();
    assert.equal(active.provider, "openrouter");
    assert.equal(active.model, "anthropic/claude-sonnet-4.5");
    assert.equal(active.chosenHere, true);
    assert.equal(
      JSON.parse(readFileSync(process.env.PLOTFORM_SETTINGS, "utf8")).provider,
      "openrouter",
    );
  });
});

test("a saved key reaches the provider, and never reaches the browser", () => {
  setKey("openrouter", "sk-or-not-a-real-key-000000");
  assert.equal(activeProvider().apiKey, "sk-or-not-a-real-key-000000");

  const shown = publicSettings();
  const openrouter = shown.providers.find((entry) => entry.id === "openrouter");
  assert.equal(openrouter.keySet, true);
  assert.equal(openrouter.keyFromEnvironment, false);
  // The whole payload, not just the fields we remembered to check.
  assert.ok(!JSON.stringify(shown).includes("sk-or-not-a-real-key-000000"));
});

test("the file holding the keys is readable only by the account running the server", () => {
  assert.equal(statSync(process.env.PLOTFORM_SETTINGS).mode & 0o777, 0o600);
});

test("a key from the environment is reported as such, so nobody hunts for it in the interface", () => {
  withEnv({ CHUTES_API_KEY: "env-only-key" }, () => {
    const chutes = publicSettings().providers.find((entry) => entry.id === "chutes");
    assert.equal(chutes.keySet, true);
    assert.equal(chutes.keyFromEnvironment, true);
  });
});

test("clearing a key removes it", () => {
  setKey("venice", "venice-key-value");
  assert.equal(
    publicSettings().providers.find((entry) => entry.id === "venice").keySet,
    true,
  );
  clearKey("venice");
  withEnv({ VENICE_API_KEY: undefined }, () => {
    assert.equal(
      publicSettings().providers.find((entry) => entry.id === "venice").keySet,
      false,
    );
  });
});

test("nonsense is refused rather than stored", () => {
  assert.throws(() => chooseProvider("not-a-provider", "x"), /Unknown provider/);
  assert.throws(() => setKey("ollama", "a-long-enough-key"), /does not take a key/);
  assert.throws(() => setKey("openrouter", "short"), /does not look like an API key/);
});

test("the provider the app builds follows the choice, including OpenRouter's attribution headers", async () => {
  chooseProvider("openrouter", "anthropic/claude-sonnet-4.5");
  setKey("openrouter", "sk-or-not-a-real-key-000000");
  const calls = [];
  const provider = createProvider({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ data: [{ id: "one" }, { id: "two" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });
  assert.equal(provider.configured, true);
  assert.equal(provider.provider, "openrouter");
  const models = await provider.models();
  assert.deepEqual(
    models.map((entry) => entry.id),
    ["one", "two"],
  );
  assert.equal(calls[0].url, "https://openrouter.ai/api/v1/models");
  assert.equal(calls[0].init.headers.Authorization, "Bearer sk-or-not-a-real-key-000000");
  assert.equal(calls[0].init.headers["X-Title"], "Plotform");
});

test("a hosted provider is never talked to over plain http", () => {
  assert.throws(
    () => createProvider({ provider: "openrouter", baseUrl: "http://openrouter.ai/api/v1" }),
    /HTTPS/,
  );
});
