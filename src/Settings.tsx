import { useEffect, useState } from "react";
import { Check, KeyRound, RefreshCw, Search, Trash2 } from "lucide-react";

/**
 * Installation settings: which model runs the AI, and what this copy of Plotform is
 * connected to. Keys are written to the server and never read back, so a key field shows
 * whether one is set rather than the key itself.
 */

type Provider = {
  id: string;
  label: string;
  baseUrl: string;
  needsKey: boolean;
  description: string;
  keyUrl: string;
  model: string;
  keySet: boolean;
  keyFromEnvironment: boolean;
};

type Settings = {
  providers: Provider[];
  provider: string;
  model: string;
  chosenHere: boolean;
  services: { database: boolean; sharedAccount: boolean; publishing: boolean };
};

type Status = {
  configured: boolean;
  reachable: boolean;
  modelInstalled?: boolean;
  provider?: string;
  model?: string | null;
  error?: string;
};

type Model = { id: string; label: string; context?: number | null };

const json = async (input: string, init?: RequestInit) => {
  const response = await fetch(input, {
    ...init,
    headers: init?.body ? { "content-type": "application/json" } : undefined,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "That did not work.");
  return body;
};

export default function Settings({
  onOpenAccount,
}: {
  onOpenAccount: () => void;
}) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState<Model[] | null>(null);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const load = async () => {
    const data: Settings = await json("/api/settings");
    setSettings(data);
    setSelected((current) => current || data.provider);
    setModel((current) => (current === "" ? data.model : current));
    json("/api/settings/status")
      .then(setStatus)
      .catch(() => {});
  };
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  const current = settings?.providers.find((entry) => entry.id === selected);
  const active = settings?.provider === selected;

  function pick(id: string) {
    setSelected(id);
    setModels(null);
    setFilter("");
    setApiKey("");
    setError("");
    setSaved("");
    setModel(settings?.providers.find((entry) => entry.id === id)?.model ?? "");
  }

  async function listModels() {
    setBusy("models");
    setError("");
    try {
      const data = await json(
        `/api/settings/models?provider=${encodeURIComponent(selected)}`,
      );
      setModels(data.models);
      if (!data.models.length) {
        setError(
          current?.needsKey && !current?.keySet
            ? "Save a key first, then the model list loads."
            : "That provider returned no models.",
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function saveKey() {
    setBusy("key");
    setError("");
    try {
      setSettings(
        await json(`/api/settings/keys/${encodeURIComponent(selected)}`, {
          method: "PUT",
          body: JSON.stringify({ apiKey }),
        }),
      );
      setApiKey("");
      setSaved("Key saved on this server.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function removeKey() {
    setBusy("key");
    try {
      setSettings(
        await json(`/api/settings/keys/${encodeURIComponent(selected)}`, {
          method: "DELETE",
        }),
      );
      setSaved("Key removed.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function use() {
    setBusy("provider");
    setError("");
    try {
      setSettings(
        await json("/api/settings/provider", {
          method: "PUT",
          body: JSON.stringify({ provider: selected, model }),
        }),
      );
      setSaved(`Plotform now generates with ${current?.label}.`);
      json("/api/settings/status")
        .then(setStatus)
        .catch(() => {});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  if (!settings) {
    return (
      <div className="settings-page">
        <p className="settings-loading">{error || "Loading settings…"}</p>
      </div>
    );
  }

  const shown = (models ?? []).filter((entry) =>
    filter ? entry.id.toLowerCase().includes(filter.toLowerCase()) : true,
  );
  const connected =
    status?.configured && status?.reachable && status?.modelInstalled;

  return (
    <div className="settings-page">
      <section className="settings-block">
        <div className="settings-block-head">
          <div>
            <span className="settings-eyebrow">MODEL</span>
            <h2>Which AI writes your sites</h2>
            <p>
              Generation, refinement and backend drafts all run on the provider
              you choose here. Nothing is generated until one is connected, and
              the rest of Plotform works without it.
            </p>
          </div>
          <span className={`settings-state ${connected ? "on" : "off"}`}>
            <span className="status-dot" />
            {connected
              ? `Connected: ${status?.model}`
              : status?.configured
                ? "Configured, not reachable"
                : "Not connected"}
          </span>
        </div>

        <div className="provider-grid">
          {settings.providers.map((entry) => (
            <button
              key={entry.id}
              className={`provider-card${selected === entry.id ? " selected" : ""}`}
              aria-pressed={selected === entry.id}
              onClick={() => pick(entry.id)}
            >
              <span className="provider-name">
                {entry.label}
                {settings.provider === entry.id && <em>in use</em>}
              </span>
              <span className="provider-desc">{entry.description}</span>
              <span className="provider-meta">
                {entry.needsKey
                  ? entry.keySet
                    ? "Key saved"
                    : "Needs a key"
                  : "Runs locally"}
                {entry.model ? ` · ${entry.model}` : ""}
              </span>
            </button>
          ))}
        </div>

        {current && (
          <div className="provider-detail">
            {current.needsKey && (
              <div className="settings-field">
                <label htmlFor="provider-key">
                  API key
                  {current.keySet && (
                    <span className="field-note">
                      <Check size={13} />
                      {current.keyFromEnvironment
                        ? "Set in .env"
                        : "Saved on this server"}
                    </span>
                  )}
                </label>
                <div className="field-row">
                  <input
                    id="provider-key"
                    type="password"
                    autoComplete="off"
                    placeholder={
                      current.keySet ? "Replace the saved key" : "Paste the key"
                    }
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <button
                    className="secondary"
                    disabled={apiKey.length < 8 || busy === "key"}
                    onClick={saveKey}
                  >
                    <KeyRound size={15} /> Save key
                  </button>
                  {current.keySet && !current.keyFromEnvironment && (
                    <button
                      className="ghost"
                      onClick={removeKey}
                      disabled={busy === "key"}
                      aria-label={`Remove the ${current.label} key`}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <p className="field-help">
                  Keys stay on this server and are never sent to the browser.
                  Get one at{" "}
                  <a
                    href={current.keyUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {new URL(current.keyUrl).host}
                  </a>
                  .
                </p>
              </div>
            )}

            <div className="settings-field">
              <label htmlFor="provider-model">Model</label>
              <div className="field-row">
                <input
                  id="provider-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={
                    selected === "openrouter"
                      ? "anthropic/claude-sonnet-4.5"
                      : "The exact model id"
                  }
                />
                <button
                  className="secondary"
                  onClick={listModels}
                  disabled={busy === "models"}
                >
                  <RefreshCw size={15} />{" "}
                  {busy === "models" ? "Loading…" : "List models"}
                </button>
              </div>

              {models && (
                <div className="model-list">
                  <div className="model-search">
                    <Search size={15} />
                    <input
                      aria-label="Search models"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder={`Search ${models.length} models`}
                    />
                  </div>
                  <ul>
                    {shown.slice(0, 60).map((entry) => (
                      <li key={entry.id}>
                        <button
                          className={model === entry.id ? "selected" : ""}
                          onClick={() => setModel(entry.id)}
                        >
                          <span>{entry.id}</span>
                          {entry.context ? (
                            <em>{Math.round(entry.context / 1000)}k context</em>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {shown.length > 60 && (
                    <p className="field-help">
                      Showing the first 60 of {shown.length}. Narrow the search
                      to see more.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="settings-actions">
              <button
                className="primary"
                onClick={use}
                disabled={!model || busy === "provider"}
              >
                {active ? "Update" : `Use ${current.label}`}
              </button>
              {saved && !error && (
                <span className="settings-saved">{saved}</span>
              )}
              {error && (
                <span className="settings-error" role="alert">
                  {error}
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="settings-block">
        <div className="settings-block-head">
          <div>
            <span className="settings-eyebrow">SERVICES</span>
            <h2>What this copy is connected to</h2>
            <p>
              Each part works on its own. Plotform runs without any of them,
              with less in it.
            </p>
          </div>
        </div>
        <div className="service-grid">
          <div
            className={`service-card${settings.services.database ? " on" : ""}`}
          >
            <span className="service-name">Database</span>
            <span className="service-state">
              {settings.services.database ? "Connected" : "Not configured"}
            </span>
            <p>
              Server projects, app backends, records and uploaded files. Without
              it, projects stay in this browser.
            </p>
          </div>
          <div
            className={`service-card${settings.services.sharedAccount ? " on" : ""}`}
          >
            <span className="service-name">Account and payments</span>
            <span className="service-state">
              {settings.services.sharedAccount ? "Connected" : "Not configured"}
            </span>
            <p>
              One sign-in shared with the other products, and paid actions paid
              for one at a time on the same payment sheet.
            </p>
            <button className="ghost" onClick={onOpenAccount}>
              Open account
            </button>
          </div>
          <div
            className={`service-card${settings.services.publishing ? " on" : ""}`}
          >
            <span className="service-name">Publishing</span>
            <span className="service-state">
              {settings.services.publishing ? "Ready" : "Not configured"}
            </span>
            <p>
              Publishing an app gives it an address on this server, with member
              accounts and a live database behind it.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
