import express from "express";
import { resolve } from "node:path";
import { startJobWorker } from "./automation.mjs";
import { createApp } from "./app.mjs";
import { createAuth } from "./auth.mjs";
import { connectDatabase, migrate } from "./db.mjs";
import {
  createBilling,
  createPlatformClient,
  platformConfig,
} from "./platform-billing.mjs";
const pool = connectDatabase();
const auth = createAuth(pool);
await migrate(pool, auth);
const stopWorker = startJobWorker(pool);
const platform = platformConfig();
const billing = platform
  ? createBilling({
      pool,
      client: createPlatformClient(platform),
      accountUrl: `${platform.url}/account`,
    })
  : null;
const app = createApp({ pool, auth, billing, origin: process.env.APP_ORIGIN });
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
if (process.env.NODE_ENV === "production") {
  // Template previews run in an opaque-origin sandbox. Public fonts/images may
  // be read there, while application cookies and APIs remain inaccessible.
  app.use("/templates", (_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  });
  app.use(express.static(resolve("dist")));
  app.get("/{*path}", (_req, res) => res.sendFile(resolve("dist/index.html")));
}
const port = Number(process.env.PORT) || 3001;
const server = app.listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(`Plotform backend listening on port ${port}`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    server.close(async () => {
      await stopWorker();
      await pool.end();
      process.exit(0);
    });
  });
