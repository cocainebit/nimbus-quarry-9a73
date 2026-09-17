import { z } from "zod";
import { projectSchema } from "../shared/schema.mjs";
import { transaction, lockProject, fail } from "./backend-data.mjs";
import { validateDesignBindings } from "./design-ai.mjs";
export async function saveProjectRevision(
  db,
  { projectId, revision, document, actorId = null },
) {
  await db.query(
    "INSERT INTO project_revisions(project_id,revision,document,actor_id) VALUES($1,$2,$3,$4) ON CONFLICT(project_id,revision) DO NOTHING",
    [projectId, revision, document, actorId],
  );
}
export function mountProjectHistory(app, { pool, session }) {
  const owned = async (req, db = pool) => {
    const user = await session(req);
    const p = (
      await db.query(
        "SELECT * FROM projects WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL",
        [req.params.id, user.id],
      )
    ).rows[0];
    if (!p) throw fail(404, "Project not found.");
    return { p, user };
  };
  app.get("/api/projects/:id/history", async (req, res) => {
    const { p } = await owned(req);
    const offset = z.coerce
      .number()
      .int()
      .min(0)
      .max(1000000)
      .parse(req.query.offset || 0);
    const rows = (
      await pool.query(
        "SELECT revision,created_at,document->>'name' AS name,actor_id FROM project_revisions WHERE project_id=$1 ORDER BY revision DESC LIMIT 50 OFFSET $2",
        [p.id, offset],
      )
    ).rows;
    res.json({ currentRevision: p.revision, revisions: rows });
  });
  app.get("/api/projects/:id/history/:revision", async (req, res) => {
    const { p } = await owned(req);
    const revision = z.coerce
      .number()
      .int()
      .positive()
      .parse(req.params.revision);
    const snapshot = (
      await pool.query(
        "SELECT document,revision,created_at FROM project_revisions WHERE project_id=$1 AND revision=$2",
        [p.id, revision],
      )
    ).rows[0];
    if (!snapshot) throw fail(404, "Revision not found.");
    res.json(snapshot);
  });
  app.post("/api/projects/:id/history/:revision/restore", async (req, res) => {
    const { p, user } = await owned(req);
    const target = z.coerce
      .number()
      .int()
      .positive()
      .parse(req.params.revision);
    const { expectedRevision } = z
      .object({ expectedRevision: z.number().int().positive() })
      .strict()
      .parse(req.body);
    const result = await transaction(pool, async (db) => {
      await lockProject(db, p.id);
      const current = (
        await db.query(
          "SELECT * FROM projects WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL FOR UPDATE",
          [p.id, user.id],
        )
      ).rows[0];
      if (!current) throw fail(404, "Project not found.");
      if (current.revision !== expectedRevision)
        throw fail(409, "Project changed. Refresh history before restoring.");
      const historical = (
        await db.query(
          "SELECT document FROM project_revisions WHERE project_id=$1 AND revision=$2",
          [p.id, target],
        )
      ).rows[0];
      if (!historical) throw fail(404, "Revision not found.");
      const document = projectSchema.parse(historical.document);
      if (document.id !== p.id)
        throw fail(409, "Revision belongs to a different project.");
      document.updated = new Date().toISOString();
      const collections = (
        await db.query("SELECT * FROM collections WHERE project_id=$1", [p.id])
      ).rows;
      if (document.app) validateDesignBindings(document.app, collections);
      for (const page of document.pages)
        for (const section of page.sections)
          if (
            section.collectionId &&
            !collections.some((c) => c.id === section.collectionId)
          )
            throw fail(
              409,
              "This revision refers to a collection that no longer exists.",
            );
      await saveProjectRevision(db, {
        projectId: p.id,
        revision: current.revision,
        document: current.document,
        actorId: user.id,
      });
      const revision = current.revision + 1;
      await db.query(
        "UPDATE projects SET document=$2,revision=$3,updated_at=now() WHERE id=$1",
        [p.id, document, revision],
      );
      await saveProjectRevision(db, {
        projectId: p.id,
        revision,
        document,
        actorId: user.id,
      });
      return { document, revision };
    });
    res.json(result);
  });
}
