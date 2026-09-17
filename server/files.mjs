import { randomUUID } from "node:crypto";
import { z } from "zod";
import { lockProject } from "./backend-data.mjs";
const fail = (status, message) => Object.assign(new Error(message), { status });
const maxSize = 5 * 1024 * 1024;
const inputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(180)
      .refine((v) => !/[\x00-\x1f/\\]/.test(v)),
    mime: z.enum([
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/pdf",
      "text/plain",
      "text/csv",
    ]),
    base64: z
      .string()
      .min(4)
      .max(Math.ceil(maxSize / 3) * 4)
      .regex(
        /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
      ),
  })
  .strict();
function matchesMime(content, mime) {
  if (mime === "image/png")
    return content
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === "image/jpeg")
    return content[0] === 255 && content[1] === 216 && content[2] === 255;
  if (mime === "image/webp")
    return (
      content.toString("ascii", 0, 4) === "RIFF" &&
      content.toString("ascii", 8, 12) === "WEBP"
    );
  if (mime === "application/pdf")
    return content.toString("ascii", 0, 5) === "%PDF-";
  return !content.includes(0);
}
export function mountFiles(app, { pool, owner, publication, member }) {
  app.get("/api/projects/:id/files", async (req, res) => {
    await owner(req);
    res.json(
      (
        await pool.query(
          "SELECT id,owner_id,name,mime,size,created_at FROM app_files WHERE project_id=$1 ORDER BY created_at DESC LIMIT 100",
          [req.params.id],
        )
      ).rows,
    );
  });
  app.get("/api/apps/:slug/files", async (req, res) => {
    const p = await publication(req),
      u = await member(req, p.project_id);
    res.json(
      (
        await pool.query(
          "SELECT id,name,mime,size,created_at FROM app_files WHERE project_id=$1 AND owner_id=$2 ORDER BY created_at DESC LIMIT 100",
          [p.project_id, u.id],
        )
      ).rows,
    );
  });
  app.post("/api/apps/:slug/files", async (req, res) => {
    const p = await publication(req),
      u = await member(req, p.project_id),
      input = inputSchema.parse(req.body);
    const content = Buffer.from(input.base64, "base64");
    if (
      !content.length ||
      content.length > maxSize ||
      !matchesMime(content, input.mime)
    )
      throw fail(
        400,
        "Invalid file content or size. Maximum file size is 5 MB.",
      );
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        `files:${p.project_id}`,
      ]);
      const used = (
        await client.query(
          "SELECT coalesce(sum(size),0)::bigint AS size,count(*)::int AS count FROM app_files WHERE project_id=$1",
          [p.project_id],
        )
      ).rows[0];
      if (
        Number(used.size) + content.length > 100 * 1024 * 1024 ||
        used.count >= 1000
      )
        throw fail(
          413,
          "App file storage limit reached (100 MB or 1,000 files).",
        );
      const result = await client.query(
        "INSERT INTO app_files(id,project_id,owner_id,name,mime,size,content) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,name,mime,size,created_at",
        [
          randomUUID(),
          p.project_id,
          u.id,
          input.name,
          input.mime,
          content.length,
          content,
        ],
      );
      await client.query("COMMIT");
      res.status(201).json(result.rows[0]);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  });
  app.get("/api/apps/:slug/files/:fileId", async (req, res) => {
    const p = await publication(req),
      u = await member(req, p.project_id);
    const file = (
      await pool.query(
        "SELECT * FROM app_files WHERE id=$1 AND project_id=$2 AND owner_id=$3",
        [req.params.fileId, p.project_id, u.id],
      )
    ).rows[0];
    if (!file) throw fail(404, "File not found.");
    res
      .set({
        "Content-Type": file.mime,
        "Content-Disposition": `attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
        "Content-Security-Policy": "sandbox; default-src 'none'",
      })
      .send(file.content);
  });
  app.delete("/api/apps/:slug/files/:fileId", async (req, res) => {
    const p = await publication(req),
      u = await member(req, p.project_id);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await lockProject(client, p.project_id);
      const referenced = await client.query(
        "SELECT 1 FROM records r JOIN collections c ON c.id=r.collection_id WHERE c.project_id=$1 AND EXISTS(SELECT 1 FROM jsonb_each_text(r.data) d WHERE d.value=$2) LIMIT 1",
        [p.project_id, req.params.fileId],
      );
      if (referenced.rowCount)
        throw fail(
          409,
          "Remove references to this file from records before deleting it.",
        );
      const r = await client.query(
        "DELETE FROM app_files WHERE id=$1 AND project_id=$2 AND owner_id=$3",
        [req.params.fileId, p.project_id, u.id],
      );
      if (!r.rowCount) throw fail(404, "File not found.");
      await client.query("COMMIT");
      res.json({ ok: true });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  });
}
