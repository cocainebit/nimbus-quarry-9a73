# Model providers

Plotform supports local Ollama, Venice AI and Chutes (Bittensor Subnet 64) for website generation and targeted page/section edits. Select one backend in the server's `.env` and restart it. Existing projects remain editable when AI is unavailable. There is no automatic fallback to a paid provider.

| Provider | Configuration |
| --- | --- |
| Ollama (default) | `MODEL_PROVIDER=ollama`, `OLLAMA_MODEL=<installed model ID>` |
| Venice AI | `MODEL_PROVIDER=venice`, `VENICE_API_KEY=<key>`, `VENICE_MODEL=<model ID>` |
| Chutes / Bittensor | `MODEL_PROVIDER=chutes`, `CHUTES_API_KEY=<key>`, `CHUTES_MODEL=<model ID>` |

Use a text/chat model capable of reliably returning JSON. The dashboard checks the selected provider's model catalog. Model IDs and availability change, so this project deliberately does not hardcode a hosted model. Obtain the ID and API key from the provider account. Keys belong only in server environment variables, never `VITE_*` variables or project documents. `.env` is ignored by Git.

Hosted requests send the generation brief or the content needed for a page/section edit to the selected service. Selecting Chutes means relying on Chutes' API, account, pricing and service policies; this is not a direct Bittensor miner/validator integration. No wallet, TAO transfer, staking or blockchain database is implemented. Keep accounts, private records and app databases in PostgreSQL.

All three providers feed the same strict project schema validation. Failures do not create a project. Requests have timeouts and response-size limits; API errors do not expose upstream response bodies or credentials. Hosted API credentials require HTTPS and redirects are rejected. Venice's additional system prompt is disabled to preserve the editor output contract. Hosted generation uses prompted JSON rather than model-specific structured-output extensions, so JSON reliability depends on model choice.

Validation: automated tests exercise real local HTTP routes with mocked upstream inference. Live Venice and Chutes inference needs your credentials and has not been verified. The full backend requires an owner session for AI requests. Production deployment still requires per-user quotas and operational hardening.

Sources:
- [Chutes: Bittensor Subnet 64](https://docs.chutes.ai/)
- [Chutes registration and API keys](https://docs.chutes.ai/docs)
- [LiteLLM's Chutes API integration](https://docs.litellm.ai/docs/providers/chutes)
- [Venice chat completions API](https://docs.venice.ai/api-reference/endpoint/chat/completions)
