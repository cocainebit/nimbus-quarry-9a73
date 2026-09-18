import { fromNodeHeaders } from "better-auth/node";
import {
  chooseProvider,
  clearKey,
  publicSettings,
  setKey,
} from "./settings.mjs";
import { createProvider } from "./providers.mjs";

/**
 * Settings the operator changes in the interface: which model provider runs the AI, its
 * model, and its key. Keys go in one direction only, into the server, and the browser is
 * told whether one is set rather than what it is.
 *
 * On a machine serving loopback only, the person at the keyboard is the operator and no
 * sign-in is required. As soon as the server is bound to a public interface, changing
 * settings needs a signed-in account, because the port is then reachable by others.
 */
export function mountSettings(app, { auth, provider, billing } = {}) {
  const loopbackOnly = [
    "127.0.0.1",
    "localhost",
    "::1",
    undefined,
    "",
  ].includes(process.env.HOST);

  async function operator(req, res) {
    if (loopbackOnly) return true;
    const session = await auth?.studio.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (session?.user) return true;
    res
      .status(401)
      .json({ error: "Sign in to change settings on a shared server." });
    return false;
  }

  app.get("/api/settings", async (_req, res) => {
    const settings = publicSettings();
    res.json({
      ...settings,
      services: {
        database: Boolean(app.locals.pool),
        sharedAccount: Boolean(billing),
        publishing: Boolean(app.locals.pool),
      },
    });
  });

  app.get("/api/settings/status", async (_req, res) => {
    try {
      res.json(await provider.status());
    } catch (error) {
      res
        .status(200)
        .json({ configured: false, reachable: false, error: message(error) });
    }
  });

  app.get("/api/settings/models", async (req, res) => {
    const id =
      typeof req.query.provider === "string" ? req.query.provider : undefined;
    try {
      const target = id ? createProvider({ provider: id }) : provider;
      res.json({ models: await target.models() });
    } catch (error) {
      res.status(502).json({ error: message(error) });
    }
  });

  app.put("/api/settings/provider", async (req, res) => {
    if (!(await operator(req, res))) return;
    try {
      chooseProvider(req.body?.provider, req.body?.model ?? "");
      res.json(publicSettings());
    } catch (error) {
      res.status(400).json({ error: message(error) });
    }
  });

  app.put("/api/settings/keys/:provider", async (req, res) => {
    if (!(await operator(req, res))) return;
    try {
      setKey(req.params.provider, req.body?.apiKey);
      res.json(publicSettings());
    } catch (error) {
      res.status(400).json({ error: message(error) });
    }
  });

  app.delete("/api/settings/keys/:provider", async (req, res) => {
    if (!(await operator(req, res))) return;
    try {
      clearKey(req.params.provider);
      res.json(publicSettings());
    } catch (error) {
      res.status(400).json({ error: message(error) });
    }
  });
}

const message = (error) =>
  error instanceof Error && error.message
    ? error.message
    : "Something went wrong.";
