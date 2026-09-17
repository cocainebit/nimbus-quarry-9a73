import pg from "pg";
import { readFile, readdir } from "node:fs/promises";
import { getMigrations } from "better-auth/db/migration";
export function connectDatabase(connectionString = process.env.DATABASE_URL) {
  if (!connectionString)
    throw Error(
      "DATABASE_URL is required. Run npm run setup:local and npm run services:up.",
    );
  return new pg.Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });
}
export async function migrate(pool, auth) {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock(71931518)");
    for (const instance of [auth.studio, auth.member]) {
      const migration = await getMigrations(instance.options);
      await migration.runMigrations();
    }
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const directory = new URL("./migrations/", import.meta.url);
    for (const name of (await readdir(directory))
      .filter((n) => /^\d+.*\.sql$/.test(n))
      .sort()) {
      const applied = await client.query(
        "SELECT 1 FROM schema_migrations WHERE name=$1",
        [name],
      );
      if (applied.rowCount) continue;
      await client.query("BEGIN");
      try {
        await client.query(await readFile(new URL(name, directory), "utf8"));
        await client.query("INSERT INTO schema_migrations(name) VALUES($1)", [
          name,
        ]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(71931518)");
    client.release();
  }
}
