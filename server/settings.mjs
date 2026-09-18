import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * Which model provider this installation uses, chosen in Settings rather than only by
 * environment variables. Keys are written here and never read back out to the browser:
 * the client is told whether a key is set, never what it is. Environment variables still
 * work and win when nothing has been chosen in the interface, so an existing .env keeps
 * behaving exactly as it did.
 */

export const providerCatalogue = [
  {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    needsKey: true,
    description:
      "One key for models from many vendors. Model names look like anthropic/claude-sonnet-4.5.",
    keyUrl: "https://openrouter.ai/keys",
  },
  {
    id: "ollama",
    label: "Ollama",
    baseUrl: "http://127.0.0.1:11434",
    needsKey: false,
    description:
      "A model running on this machine. Nothing leaves the computer, and there is no bill.",
    keyUrl: "https://ollama.com/download",
  },
  {
    id: "venice",
    label: "Venice AI",
    baseUrl: "https://api.venice.ai/api/v1",
    needsKey: true,
    description:
      "Private hosted inference. Use the exact model id from your account.",
    keyUrl: "https://venice.ai/settings/api",
  },
  {
    id: "chutes",
    label: "Chutes",
    baseUrl: "https://llm.chutes.ai/v1",
    needsKey: true,
    description: "Inference on Bittensor subnet 64.",
    keyUrl: "https://chutes.ai",
  },
];

const byId = new Map(providerCatalogue.map((entry) => [entry.id, entry]));
export const isProvider = (id) => byId.has(id);
export const providerDefinition = (id) => byId.get(id);

const file = () =>
  resolve(process.env.PLOTFORM_SETTINGS || ".local/settings.json");
const empty = { provider: null, models: {}, keys: {}, baseUrls: {} };

function read() {
  try {
    const parsed = JSON.parse(readFileSync(file(), "utf8"));
    return { ...empty, ...parsed };
  } catch {
    return { ...empty };
  }
}

function write(next) {
  const path = file();
  mkdirSync(dirname(path), { recursive: true });
  // The file holds provider keys, so it is readable only by the account running the server.
  writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
}

/** The provider the app should use now: the chosen one, else what the environment says. */
export function activeProvider() {
  const stored = read();
  const id =
    (isProvider(stored.provider) && stored.provider) ||
    (isProvider(process.env.MODEL_PROVIDER) && process.env.MODEL_PROVIDER) ||
    "ollama";
  const definition = providerDefinition(id);
  const prefix = id.toUpperCase();
  return {
    provider: id,
    model: stored.models?.[id] || process.env[`${prefix}_MODEL`] || "",
    apiKey: stored.keys?.[id] || process.env[`${prefix}_API_KEY`] || "",
    baseUrl:
      stored.baseUrls?.[id] ||
      process.env[`${prefix}_BASE_URL`] ||
      definition.baseUrl,
    chosenHere: isProvider(stored.provider),
  };
}

/** What the browser may see: everything except the keys themselves. */
export function publicSettings() {
  const stored = read();
  const active = activeProvider();
  return {
    providers: providerCatalogue.map((entry) => ({
      ...entry,
      model:
        stored.models?.[entry.id] ||
        process.env[`${entry.id.toUpperCase()}_MODEL`] ||
        "",
      keySet: Boolean(
        stored.keys?.[entry.id] ||
        process.env[`${entry.id.toUpperCase()}_API_KEY`],
      ),
      keyFromEnvironment: Boolean(
        !stored.keys?.[entry.id] &&
        process.env[`${entry.id.toUpperCase()}_API_KEY`],
      ),
    })),
    provider: active.provider,
    model: active.model,
    chosenHere: active.chosenHere,
  };
}

export function chooseProvider(id, model) {
  if (!isProvider(id)) throw new Error("Unknown provider.");
  if (typeof model !== "string" || model.length > 200)
    throw new Error("Invalid model name.");
  const stored = read();
  write({
    ...stored,
    provider: id,
    models: { ...stored.models, [id]: model.trim() },
  });
}

export function setKey(id, apiKey) {
  if (!isProvider(id)) throw new Error("Unknown provider.");
  if (!providerDefinition(id).needsKey)
    throw new Error(`${id} does not take a key.`);
  if (typeof apiKey !== "string" || apiKey.length < 8 || apiKey.length > 400) {
    throw new Error("That does not look like an API key.");
  }
  const stored = read();
  write({ ...stored, keys: { ...stored.keys, [id]: apiKey.trim() } });
}

export function clearKey(id) {
  if (!isProvider(id)) throw new Error("Unknown provider.");
  const stored = read();
  const keys = { ...stored.keys };
  delete keys[id];
  write({ ...stored, keys });
}
