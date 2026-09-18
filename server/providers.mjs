import { activeProvider, providerCatalogue } from "./settings.mjs";

const definitions = Object.fromEntries(
  providerCatalogue.map((entry) => [
    entry.id,
    { label: entry.label, baseUrl: entry.baseUrl },
  ]),
);

export function createProvider({
  provider,
  model,
  baseUrl,
  apiKey,
  fetchImpl = fetch,
  timeoutMs = 120000,
} = {}) {
  // Settings chosen in the interface win; the environment is the fallback, so an
  // installation configured only by .env keeps working untouched.
  const chosen = activeProvider();
  provider ??= chosen.provider;
  const definition = definitions[provider];
  if (!definition)
    throw new Error(
      `MODEL_PROVIDER must be one of ${providerCatalogue.map((entry) => entry.id).join(", ")}.`,
    );
  const prefix = provider.toUpperCase();
  const fromSettings = provider === chosen.provider ? chosen : null;
  model ??= fromSettings?.model || process.env[`${prefix}_MODEL`] || "";
  apiKey ??= fromSettings?.apiKey || process.env[`${prefix}_API_KEY`] || "";
  const endpoint = (
    baseUrl ||
    fromSettings?.baseUrl ||
    process.env[`${prefix}_BASE_URL`] ||
    definition.baseUrl
  ).replace(/\/+$/, "");
  const local = provider === "ollama";
  if (!local && new URL(endpoint).protocol !== "https:") {
    throw new Error("Hosted model providers require an HTTPS endpoint.");
  }
  const configured = Boolean(model && (local || apiKey));
  const headers = {
    "Content-Type": "application/json",
    ...(!local && apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    // OpenRouter attributes requests to an app when these are present, and shows the
    // name on its activity page. Both are optional there and carry no personal data.
    ...(provider === "openrouter"
      ? { "HTTP-Referer": "http://127.0.0.1:5173", "X-Title": "Plotform" }
      : {}),
  };
  return {
    configured,
    provider,
    model,
    /** The models this provider will actually accept, for the picker in Settings. */
    async models() {
      // Some providers publish their catalogue without a key, which lets someone browse
      // models before deciding to paste one.
      const response = await fetchImpl(
        `${endpoint}${local ? "/api/tags" : "/models"}`,
        {
          headers,
          redirect: "error",
          signal: AbortSignal.timeout(15000),
        },
      );
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(
          response.status === 401
            ? "That key was refused. Check it and try again."
            : "The provider did not return its model list.",
        );
      }
      const data = await response.json();
      const list = local ? data.models : data.data;
      if (!Array.isArray(list)) return [];
      return list
        .map((entry) =>
          local
            ? { id: entry.name, label: entry.name }
            : {
                id: entry.id,
                label: entry.name || entry.id,
                context: Number(entry.context_length) || null,
              },
        )
        .filter((entry) => typeof entry.id === "string" && entry.id)
        .sort((a, b) => a.id.localeCompare(b.id));
    },
    async status() {
      const result = {
        configured,
        reachable: false,
        modelInstalled: false,
        provider: definition.label,
        model: model || null,
      };
      if (!configured) return result;
      try {
        const response = await fetchImpl(
          `${endpoint}${local ? "/api/tags" : "/models"}`,
          {
            headers,
            redirect: "error",
            signal: AbortSignal.timeout(5000),
          },
        );
        if (!response.ok) return result;
        const data = await response.json();
        const models = local ? data.models : data.data;
        return {
          ...result,
          reachable: true,
          modelInstalled:
            Array.isArray(models) &&
            models.some((m) =>
              local
                ? m.name === model || m.name === `${model}:latest`
                : m.id === model,
            ),
        };
      } catch {
        return result;
      }
    },
    async complete(system, user) {
      if (!configured)
        throw new Error(
          `Configure ${prefix}_MODEL${local ? "" : ` and ${prefix}_API_KEY`} before generating.`,
        );
      const response = await fetchImpl(
        `${endpoint}${local ? "/api/chat" : "/chat/completions"}`,
        {
          method: "POST",
          headers,
          redirect: "error",
          signal: AbortSignal.timeout(timeoutMs),
          body: JSON.stringify({
            model,
            stream: false,
            ...(local
              ? { format: "json", options: { temperature: 0.4 } }
              : { temperature: 0.4, max_tokens: 12000 }),
            ...(provider === "venice"
              ? {
                  store: false,
                  venice_parameters: { include_venice_system_prompt: false },
                }
              : {}),
            messages: [
              { role: "system", content: system },
              { role: "user", content: JSON.stringify(user) },
            ],
          }),
        },
      );
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(
          response.status === 429
            ? "The model provider is rate limited. Try again shortly."
            : "The model provider rejected the request. Check its credentials, model name and account balance.",
        );
      }
      // Bound the body while reading, before allocating a potentially huge string.
      const reader = response.body?.getReader();
      if (!reader)
        throw new Error("The model provider returned an empty response.");
      const chunks = [];
      let size = 0;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 2_000_000) {
            await reader.cancel();
            throw new Error("Model response exceeded the size limit.");
          }
          chunks.push(Buffer.from(value));
        }
      } finally {
        reader.releaseLock();
      }
      const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!local && data.choices?.[0]?.finish_reason === "length")
        throw new Error(
          "The model ran out of output space. Try generating a smaller website.",
        );
      const content = local
        ? data.message?.content
        : data.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim())
        throw new Error(
          "The model returned no website content. Try another model.",
        );
      return content;
    },
  };
}
