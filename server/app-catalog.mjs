import { randomUUID } from "node:crypto";
import { z } from "zod";
import { appCatalog, catalogMetadata } from "../shared/app-catalog.mjs";
import { projectSchema } from "../shared/schema.mjs";
import { getAppDesign } from "../shared/app-design.mjs";
import { createCollection, transaction } from "./backend-data.mjs";
export function catalogProject(
  template,
  { id = randomUUID(), name = template.name, collectionIds = new Map() } = {},
) {
  return projectSchema.parse({
    id,
    version: 2,
    name,
    brief: template.description,
    updated: new Date().toISOString(),
    source: "demo",
    theme: {
      accent: template.accent,
      background: template.background,
      font: template.font,
      radius: template.radius,
    },
    settings: { footer: `${name} workspace` },
    app: {
      template: template.runtime || template.id,
      design: {
        ...(template.design ||
          getAppDesign({
            template: template.runtime || template.id,
            title: name,
          })),
        widgets: (template.design?.widgets || []).map((widget) => ({
          ...widget,
          collectionId:
            collectionIds.get(widget.collectionId) || widget.collectionId,
        })),
      },
      title: name,
      description: template.description,
      navigation: template.collections.map((c) => ({
        collectionId: collectionIds.get(c.key) || c.key,
        label: c.definition.name,
        view: c.view,
        ...(c.statusField ? { statusField: c.statusField } : {}),
      })),
    },
    pages: [
      {
        id: randomUUID(),
        name: "Home",
        slug: "home",
        position: { x: 0, y: 0 },
        sections: [
          {
            id: randomUUID(),
            kind: "hero",
            title: template.tagline,
            body: template.description,
            eyebrow: template.category,
            variant: "centered",
            tone: "accent",
          },
          {
            id: randomUUID(),
            kind: "features",
            title: "Everything in its place.",
            body: "A working application with private accounts and persistent data.",
            items: template.features.map((title) => ({ title, body: "" })),
          },
        ],
      },
    ],
  });
}
export function mountAppCatalogue(app, { pool, session }) {
  app.get("/api/catalog", (_req, res) => res.json(catalogMetadata()));
  app.post("/api/catalog/:templateId/install", async (req, res) => {
    const user = await session(req);
    const template = appCatalog.find((t) => t.id === req.params.templateId);
    if (!template)
      throw Object.assign(new Error("App template not found."), {
        status: 404,
      });
    const input = z
      .object({ name: z.string().trim().min(1).max(100).optional() })
      .strict()
      .parse(req.body || {});
    const result = await transaction(pool, async (db) => {
      const id = randomUUID();
      const project = catalogProject(template, { id, name: input.name });
      await db.query(
        "INSERT INTO projects(id,owner_id,document,revision) VALUES($1,$2,$3,1)",
        [id, user.id, JSON.stringify(project)],
      );
      const ids = new Map();
      const collections = [];
      for (const c of template.collections) {
        const definition = {
          ...c.definition,
          fields: c.definition.fields.map((f) =>
            f.type === "reference"
              ? {
                  ...f,
                  referenceCollectionId: ids.get(f.referenceCollectionId),
                }
              : f,
          ),
        };
        const row = await createCollection(db, id, definition);
        ids.set(c.key, row.id);
        collections.push(row);
      }
      const final = catalogProject(template, {
        id,
        name: input.name,
        collectionIds: ids,
      });
      await db.query("UPDATE projects SET document=$2 WHERE id=$1", [
        id,
        JSON.stringify(final),
      ]);
      await db.query(
        "INSERT INTO project_revisions(project_id,revision,document) VALUES($1,1,$2)",
        [id, JSON.stringify(final)],
      );
      return { project: final, revision: 1, collections };
    });
    res.status(201).json(result);
  });
}
