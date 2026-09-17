import { randomUUID } from "node:crypto";
import { z } from "zod";
import { projectSchema } from "../shared/schema.mjs";
import { collectionSchema } from "../shared/backend-schema.mjs";
import { transaction, lockProject, fail } from "./backend-data.mjs";
export async function cloneProject(pool, projectId, ownerId) {
  return transaction(pool, async (db) => {
    await lockProject(db, projectId);
    const original = (
      await db.query(
        "SELECT document FROM projects WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL FOR UPDATE",
        [projectId, ownerId],
      )
    ).rows[0];
    if (!original) throw fail(404, "Project not found.");
    const source = projectSchema.parse(original.document);
    const schemas = (
      await db.query(
        "SELECT * FROM collections WHERE project_id=$1 ORDER BY created_at,id",
        [projectId],
      )
    ).rows;
    const ids = new Map(schemas.map((c) => [c.id, randomUUID()]));
    const id = randomUUID();
    const document = structuredClone(source);
    document.id = id;
    document.name = `${source.name.slice(0, 95)} copy`;
    document.updated = new Date().toISOString();
    if (document.app) {
      document.app.title = document.name;
      if (document.app.design)
        document.app.design.widgets = document.app.design.widgets.map((w) => {
          if (!ids.has(w.collectionId))
            throw fail(
              409,
              "A dashboard widget references a missing collection. Repair it before duplicating.",
            );
          return { ...w, collectionId: ids.get(w.collectionId) };
        });
      document.app.navigation = document.app.navigation.map((n) => {
        if (!ids.has(n.collectionId))
          throw fail(
            409,
            "The app navigation references a missing collection. Repair it before duplicating.",
          );
        return { ...n, collectionId: ids.get(n.collectionId) };
      });
    }
    const project = projectSchema.parse(document);
    await db.query(
      "INSERT INTO projects(id,owner_id,document,revision) VALUES($1,$2,$3,1)",
      [id, ownerId, JSON.stringify(project)],
    );
    const collections = [];
    for (const c of schemas) {
      const fields = c.fields.map((f) => {
        if (f.type !== "reference") return f;
        if (!ids.has(f.referenceCollectionId))
          throw fail(
            409,
            "The app has a missing or cross-app relationship. Repair it before duplicating.",
          );
        return {
          ...f,
          referenceCollectionId: ids.get(f.referenceCollectionId),
        };
      });
      const definition = collectionSchema.parse({
        name: c.name,
        fields,
        publicRead: c.public_read,
        memberCreate: c.member_create,
        editorAccess: c.editor_access,
      });
      collections.push(
        (
          await db.query(
            "INSERT INTO collections(id,project_id,name,fields,public_read,member_create,editor_access) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
            [
              ids.get(c.id),
              id,
              definition.name,
              JSON.stringify(definition.fields),
              definition.publicRead,
              definition.memberCreate,
              definition.editorAccess,
            ],
          )
        ).rows[0],
      );
    }
    await db.query(
      "INSERT INTO project_revisions(project_id,revision,document) VALUES($1,1,$2)",
      [id, JSON.stringify(project)],
    );
    return { project, revision: 1, collections };
  });
}
export function mountProjectClone(app, { pool, session }) {
  app.post("/api/projects/:id/duplicate", async (req, res) => {
    const user = await session(req);
    z.object({})
      .strict()
      .parse(req.body || {});
    res.status(201).json(await cloneProject(pool, req.params.id, user.id));
  });
}
