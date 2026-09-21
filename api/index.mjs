// The API as one Vercel function. server/index.mjs stays the entry point everywhere
// else; this differs only where a serverless host forces it to: nothing listens on a
// port, nothing runs between requests, and the disk is read only apart from /tmp.
import { createApp } from "../server/app.mjs";
import { createAuth } from "../server/auth.mjs";
import { connectDatabase, migrate } from "../server/db.mjs";
import {
  createBilling,
  createPlatformClient,
  platformConfig,
} from "../server/platform-billing.mjs";

process.env.PLOTFORM_SETTINGS ||= "/tmp/plotform-settings.json";
process.env.PG_POOL_MAX ||= "3";

let ready;
function boot() {
  ready ??= (async () => {
    const pool = connectDatabase();
    const auth = createAuth(pool);
    await migrate(pool, auth);
    const platform = platformConfig();
    const billing = platform
      ? createBilling({
          pool,
          client: createPlatformClient(platform),
          accountUrl: `${platform.url}/account`,
        })
      : null;
    const app = createApp({
      pool,
      auth,
      billing,
      origin: process.env.APP_ORIGIN,
    });
    app.get("/healthz", async (_req, res) => {
      try {
        await pool.query("SELECT 1");
        res.json({ ok: true });
      } catch {
        res.status(503).json({ ok: false });
      }
    });
    app.use("/api", (_req, res) =>
      res.status(404).json({ error: "Endpoint not found." }),
    );
    return app;
  })();
  return ready;
}

export default async function handler(req, res) {
  let app;
  try {
    app = await boot();
  } catch (error) {
    // Try again on the next request rather than staying broken until a cold start.
    ready = undefined;
    console.error("Plotform API could not start:", error);
    const reason =
      /DATABASE_URL|ECONNREFUSED|ENOTFOUND|timeout|password|SSL/i.test(
        String(error?.message),
      )
        ? "The database could not be reached. Check DATABASE_URL."
        : /APP_ORIGIN|AUTH_SECRET|SMTP/i.test(String(error?.message))
          ? String(error.message)
          : "See the function log for the reason.";
    res.statusCode = 503;
    res.setHeader("content-type", "application/json");
    return res.end(
      JSON.stringify({ error: `The server could not start. ${reason}` }),
    );
  }
  return app(req, res);
}
