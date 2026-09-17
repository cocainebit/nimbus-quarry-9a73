import express from "express";
import { randomUUID } from "node:crypto";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { projectSchema } from "../shared/schema.mjs";
import { collectionSchema } from "../shared/backend-schema.mjs";
import {
  fail,
  transaction,
  lockProject,
  createCollection,
  previewCollectionChange,
  applyCollectionChange,
  validateRecord,
  assertNotReferenced,
} from "./backend-data.mjs";
import { mountAutomation, enqueueRecordEvent } from "./automation.mjs";
import { mountFiles } from "./files.mjs";
import { mountDesignAI, validateDesignBindings } from "./design-ai.mjs";
import { mountRecordQueries } from "./record-queries.mjs";
import {
  mountProjectHistory,
  saveProjectRevision,
} from "./project-history.mjs";
import { mountBackendAI } from "./backend-ai.mjs";
import { mountAppCatalogue } from "./app-catalog.mjs";
import { mountProjectClone } from "./project-clone.mjs";
import { BillingError, SKUS } from "./platform-billing.mjs";
export function mountPlatform(
  app,
  { pool, auth, origin, provider, secret, billing },
) {
  app.use("/api", (req, _res, next) => {
    req.headers["x-studio-client-ip"] = req.ip || req.socket.remoteAddress;
    next();
  });
  app.all("/api/auth/*splat", toNodeHandler(auth.studio));
  app.all("/api/member-auth/*splat", toNodeHandler(auth.member));
  app.use("/api", (req, res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.get("origin") !== origin
    )
      return res.status(403).json({ error: "Request origin is not allowed." });
    next();
  });
  app.use(express.json({ limit: "30mb" }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 180,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { error: "Too many requests. Try again shortly." },
    }),
  );
  const session = async (req, runtime = false) => {
    const s = await auth[runtime ? "member" : "studio"].api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!s) throw fail(401, "Please sign in.");
    if (
      !runtime &&
      req.get("x-studio-account") &&
      req.get("x-studio-account") !== s.user.id
    )
      throw fail(409, "The signed-in account changed. Reopen your workspace.");
    return s.user;
  };
  const owner = async (req) => {
    const user = await session(req);
    const { rows } = await pool.query(
      "SELECT * FROM projects WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL",
      [req.params.id, user.id],
    );
    if (!rows[0]) throw fail(404, "Project not found.");
    return rows[0];
  };
  const publication = async (req) => {
    const { rows } = await pool.query(
      "SELECT pub.* FROM publications pub JOIN projects p ON p.id=pub.project_id WHERE pub.slug=$1 AND p.archived_at IS NULL",
      [req.params.slug],
    );
    if (!rows[0]) throw fail(404, "App not found.");
    return rows[0];
  };
  const collection = async (req) => {
    const p = await publication(req);
    const { rows } = await pool.query(
      "SELECT * FROM collections WHERE id=$1 AND project_id=$2",
      [req.params.collectionId, p.project_id],
    );
    if (!rows[0]) throw fail(404, "Collection not found.");
    return rows[0];
  };
  const member = async (req, projectId) => {
    const user = await session(req, true);
    const { rows } = await pool.query(
      "SELECT role FROM app_members WHERE project_id=$1 AND user_id=$2",
      [projectId, user.id],
    );
    if (!rows[0]) throw fail(403, "Join this app before accessing its data.");
    return { ...user, role: rows[0].role };
  };
  app.get("/api/backend-status", (_req, res) =>
    res.json({ enabled: true, sharedAccount: Boolean(billing) }),
  );
  // The signed-in owner's shared credit balance, read from the platform.
  app.get("/api/credits", async (req, res) => {
    const user = await session(req);
    if (!billing) return res.json({ enabled: false });
    res.json({ enabled: true, ...(await billing.summary(user.id)) });
  });
  app.get("/api/projects", async (req, res) => {
    const user = await session(req);
    res.json(
      (
        await pool.query(
          "SELECT document,revision FROM projects WHERE owner_id=$1 AND archived_at IS NULL ORDER BY updated_at DESC,id LIMIT 100 OFFSET $2",
          [
            user.id,
            z.coerce
              .number()
              .int()
              .min(0)
              .max(1000000)
              .parse(req.query.offset || 0),
          ],
        )
      ).rows,
    );
  });
  app.get("/api/projects/:id", async (req, res) => {
    const p = await owner(req);
    res.json({ document: p.document, revision: p.revision });
  });
  app.put("/api/projects/:id", async (req, res) => {
    const user = await session(req);
    const { project, revision } = z
      .object({ project: projectSchema, revision: z.number().int().min(0) })
      .parse(req.body);
    if (project.id !== req.params.id) throw fail(400, "Project ID mismatch.");
    const result = await transaction(pool, async (db) => {
      await lockProject(db, project.id);
      const previous = (
        await db.query(
          "SELECT document,revision FROM projects WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL FOR UPDATE",
          [project.id, user.id],
        )
      ).rows[0];
      if (project.app) {
        const collections = (
          await db.query(
            "SELECT id,fields FROM collections WHERE project_id=$1",
            [project.id],
          )
        ).rows;
        validateDesignBindings(project.app, collections);
      }
      if (previous)
        await saveProjectRevision(db, {
          projectId: project.id,
          revision: previous.revision,
          document: previous.document,
          actorId: user.id,
        });
      const { rows } =
        revision === 0
          ? await db.query(
              "INSERT INTO projects(id,owner_id,document) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING RETURNING revision",
              [project.id, user.id, project],
            )
          : await db.query(
              "UPDATE projects SET document=$3,revision=revision+1,updated_at=now() WHERE id=$1 AND owner_id=$2 AND revision=$4 AND archived_at IS NULL RETURNING revision",
              [project.id, user.id, project, revision],
            );
      if (!rows[0])
        throw fail(
          409,
          "Project changed or is unavailable. Reload its saved version before overwriting.",
        );
      await saveProjectRevision(db, {
        projectId: project.id,
        revision: rows[0].revision,
        document: project,
        actorId: user.id,
      });
      return rows[0];
    });
    res.json(result);
  });
  app.get("/api/projects/:id/backend", async (req, res) => {
    await owner(req);
    const id = req.params.id;
    const [collections, publication, members, submissions] = await Promise.all([
      pool.query(
        "SELECT * FROM collections WHERE project_id=$1 ORDER BY created_at",
        [id],
      ),
      pool.query("SELECT slug,revision FROM publications WHERE project_id=$1", [
        id,
      ]),
      pool.query(
        "SELECT count(*)::int AS count FROM app_members WHERE project_id=$1",
        [id],
      ),
      pool.query(
        "SELECT id,name,email,message,created_at FROM submissions WHERE project_id=$1 ORDER BY created_at DESC LIMIT 100",
        [id],
      ),
    ]);
    res.json({
      collections: collections.rows,
      publication: publication.rows[0] || null,
      members: members.rows[0].count,
      submissions: submissions.rows,
    });
  });
  app.post("/api/projects/:id/collections", async (req, res) => {
    await owner(req);
    const row = await transaction(pool, (db) =>
      createCollection(db, req.params.id, req.body),
    );
    res.status(201).json(row);
  });
  app.delete("/api/projects/:id", async (req, res) => {
    const p = await owner(req);
    const { revision } = z
      .object({ revision: z.number().int().positive() })
      .strict()
      .parse(req.body);
    const result = await transaction(pool, async (db) => {
      await lockProject(db, p.id);
      return db.query(
        "UPDATE projects SET archived_at=now(),revision=revision+1 WHERE id=$1 AND revision=$2 AND archived_at IS NULL",
        [p.id, revision],
      );
    });
    if (!result.rowCount)
      throw fail(409, "Project changed. Reload before archiving.");
    res.json({ ok: true });
  });
  app.post(
    "/api/projects/:id/collections/:collectionId/schema/preview",
    async (req, res) => {
      await owner(req);
      res.json(
        await transaction(pool, async (db) => {
          await lockProject(db, req.params.id);
          return previewCollectionChange(
            db,
            req.params.id,
            req.params.collectionId,
            req.body,
          );
        }),
      );
    },
  );
  app.put(
    "/api/projects/:id/collections/:collectionId/schema",
    async (req, res) => {
      await owner(req);
      res.json(
        await transaction(pool, (db) =>
          applyCollectionChange(
            db,
            req.params.id,
            req.params.collectionId,
            req.body,
          ),
        ),
      );
    },
  );
  app.get("/api/projects/:id/members", async (req, res) => {
    await owner(req);
    res.json(
      (
        await pool.query(
          "SELECT m.user_id,m.role,m.joined_at,u.name,u.email FROM app_members m JOIN member_user u ON u.id=m.user_id WHERE m.project_id=$1 ORDER BY m.joined_at LIMIT 100",
          [req.params.id],
        )
      ).rows,
    );
  });
  app.patch("/api/projects/:id/members/:userId", async (req, res) => {
    await owner(req);
    const { role } = z
      .object({ role: z.enum(["member", "editor", "admin"]) })
      .strict()
      .parse(req.body);
    const result = await transaction(pool, async (db) => {
      await lockProject(db, req.params.id);
      return db.query(
        "UPDATE app_members SET role=$3 WHERE project_id=$1 AND user_id=$2 RETURNING user_id,role",
        [req.params.id, req.params.userId, role],
      );
    });
    if (!result.rows[0]) throw fail(404, "Member not found.");
    res.json(result.rows[0]);
  });

  app.get(
    "/api/projects/:id/collections/:collectionId/records",
    async (req, res) => {
      await owner(req);
      res.json(
        (
          await pool.query(
            "SELECT r.* FROM records r JOIN collections c ON c.id=r.collection_id WHERE c.project_id=$1 AND c.id=$2 ORDER BY r.created_at DESC LIMIT 100",
            [req.params.id, req.params.collectionId],
          )
        ).rows,
      );
    },
  );
  app.post("/api/projects/:id/publish", async (req, res) => {
    const project = await owner(req);
    const { slug, revision } = z
      .object({
        slug: z
          .string()
          .min(3)
          .max(60)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        revision: z.number().int().positive(),
      })
      .parse(req.body);
    await billing?.ensureCanPay(project.owner_id, SKUS.publish);
    const { rows } = await pool.query(
      `INSERT INTO publications(project_id,slug,document,revision) SELECT id,$2,document,revision FROM projects WHERE id=$1 AND revision=$3 ON CONFLICT(project_id) DO UPDATE SET document=EXCLUDED.document,revision=EXCLUDED.revision,slug=EXCLUDED.slug,published_at=now() RETURNING slug,revision`,
      [req.params.id, slug, revision],
    );
    if (!rows[0])
      throw fail(409, "Save the current project before publishing.");
    // Charged per published revision, so publishing the same revision again is free.
    await billing?.charge(project.owner_id, SKUS.publish, {
      idempotencyKey: `publish:${project.id}:${revision}`,
    });
    res.json({ ...rows[0], url: `/sites/${slug}/` });
  });
  app.delete("/api/projects/:id/publish", async (req, res) => {
    await owner(req);
    await pool.query("DELETE FROM publications WHERE project_id=$1", [
      req.params.id,
    ]);
    res.json({ ok: true });
  });
  app.get("/api/apps/:slug", async (req, res) => {
    const p = await publication(req);
    const collections = (
      await pool.query(
        "SELECT id,name,fields,public_read,member_create,editor_access,schema_version FROM collections WHERE project_id=$1 ORDER BY created_at",
        [p.project_id],
      )
    ).rows;
    res.json({ project: { ...p.document, brief: "" }, collections });
  });
  app.post("/api/apps/:slug/join", async (req, res) => {
    const p = await publication(req);
    const user = await session(req, true);
    await pool.query(
      "INSERT INTO app_members(project_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
      [p.project_id, user.id],
    );
    res.json({ ok: true });
  });
  app.get(
    "/api/apps/:slug/collections/:collectionId/records",
    async (req, res) => {
      const c = await collection(req);
      let user = null;
      if (!c.public_read) user = await member(req, c.project_id);
      else {
        user =
          (
            await auth.member.api.getSession({
              headers: fromNodeHeaders(req.headers),
            })
          )?.user || null;
        if (user) {
          const membership = (
            await pool.query(
              "SELECT role FROM app_members WHERE project_id=$1 AND user_id=$2",
              [c.project_id, user.id],
            )
          ).rows[0];
          user = { ...user, role: membership?.role };
        }
      }
      const offset = z.coerce
        .number()
        .int()
        .min(0)
        .max(1000000)
        .parse(req.query.offset || 0);
      res.json(
        (
          await pool.query(
            'SELECT id,data,version,created_at,(owner_id=$3 OR $5::boolean) AS "canEdit" FROM records WHERE collection_id=$1 AND ($2::boolean OR owner_id=$3 OR $5::boolean) ORDER BY created_at DESC,id LIMIT 100 OFFSET $4',
            [
              c.id,
              c.public_read,
              user?.id || "",
              offset,
              Boolean(
                c.editor_access && ["editor", "admin"].includes(user?.role),
              ),
            ],
          )
        ).rows,
      );
    },
  );
  const mutate = async (req, event) => {
    const before = await collection(req);
    const user = await member(req, before.project_id);
    return transaction(pool, async (db) => {
      await lockProject(db, before.project_id);
      const active = await db.query(
        "SELECT 1 FROM projects WHERE id=$1 AND archived_at IS NULL",
        [before.project_id],
      );
      if (!active.rowCount) throw fail(404, "App not found.");
      const c = (
        await db.query("SELECT * FROM collections WHERE id=$1", [before.id])
      ).rows[0];
      // Refresh roles after obtaining the mutation lock.
      const role = (
        await db.query(
          "SELECT role FROM app_members WHERE project_id=$1 AND user_id=$2",
          [c.project_id, user.id],
        )
      ).rows[0]?.role;
      if (!role) throw fail(403, "Join this app before accessing its data.");
      const privileged = c.editor_access && ["editor", "admin"].includes(role);
      let record;
      if (event === "record.created") {
        if (!c.member_create && !privileged)
          throw fail(403, "New records are disabled for this collection.");
        const input = z.object({ data: z.unknown() }).strict().parse(req.body);
        const data = await validateRecord(db, c, input.data, {
          userId: user.id,
          privileged,
        });
        record = (
          await db.query(
            "INSERT INTO records(id,collection_id,owner_id,data) VALUES($1,$2,$3,$4) RETURNING *",
            [randomUUID(), c.id, user.id, data],
          )
        ).rows[0];
      } else {
        const input = (
          event === "record.updated"
            ? z.object({
                data: z.unknown(),
                version: z.number().int().positive(),
              })
            : z.object({ version: z.number().int().positive() })
        )
          .strict()
          .parse(req.body);
        const previous = (
          await db.query(
            "SELECT * FROM records WHERE id=$1 AND collection_id=$2 AND (owner_id=$3 OR $4::boolean) AND version=$5 FOR UPDATE",
            [req.params.recordId, c.id, user.id, privileged, input.version],
          )
        ).rows[0];
        if (!previous)
          throw fail(
            409,
            "Record changed or is unavailable. Refresh before trying again.",
          );
        if (event === "record.updated") {
          const data = await validateRecord(db, c, input.data, {
            previous: previous.data,
            userId: user.id,
            recordId: previous.id,
            privileged,
          });
          record = (
            await db.query(
              "UPDATE records SET data=$2,version=version+1,updated_at=now() WHERE id=$1 RETURNING *",
              [previous.id, data],
            )
          ).rows[0];
        } else {
          await assertNotReferenced(db, c.project_id, previous.id);
          await db.query("DELETE FROM records WHERE id=$1", [previous.id]);
          record = previous;
        }
      }
      await enqueueRecordEvent(db, {
        projectId: c.project_id,
        collectionId: c.id,
        event,
        record,
        actorId: user.id,
      });
      if (event === "record.deleted") return { ok: true };
      return {
        id: record.id,
        data: record.data,
        version: record.version,
        created_at: record.created_at,
      };
    });
  };
  app.post(
    "/api/apps/:slug/collections/:collectionId/records",
    async (req, res) =>
      res.status(201).json(await mutate(req, "record.created")),
  );
  app.patch(
    "/api/apps/:slug/collections/:collectionId/records/:recordId",
    async (req, res) => res.json(await mutate(req, "record.updated")),
  );
  app.delete(
    "/api/apps/:slug/collections/:collectionId/records/:recordId",
    async (req, res) => res.json(await mutate(req, "record.deleted")),
  );
  const contactLimit = rateLimit({
    windowMs: 60000,
    limit: 10,
    legacyHeaders: false,
    message: { error: "Too many messages. Please try again later." },
  });
  app.post("/api/apps/:slug/contact", contactLimit, async (req, res) => {
    const p = await publication(req);
    const input = z
      .object({
        name: z.string().trim().min(1).max(100),
        email: z.string().email().max(200),
        message: z.string().trim().min(10).max(5000),
        website: z.string().max(200).optional(),
      })
      .parse(req.body);
    if (!input.website)
      await pool.query(
        "INSERT INTO submissions(id,project_id,name,email,message) VALUES($1,$2,$3,$4,$5)",
        [randomUUID(), p.project_id, input.name, input.email, input.message],
      );
    res.status(201).json({ ok: true });
  });
  mountAutomation(app, { pool, owner, publication, member });
  mountFiles(app, { pool, owner, publication, member });
  mountBackendAI(app, { pool, owner, provider, secret, billing });
  mountDesignAI(app, { pool, owner, provider, billing });
  mountRecordQueries(app, { pool, publication, member, auth });
  mountProjectHistory(app, { pool, session });
  mountAppCatalogue(app, { pool, session });
  mountProjectClone(app, { pool, session });
  // In the full server AI routes also require a builder session.
  app.use(["/api/generate", "/api/refine"], async (req, _res, next) => {
    await session(req);
    next();
  });
}
export function platformErrors(err, _req, res, _next) {
  if (err instanceof z.ZodError)
    return res.status(400).json({
      error: "Invalid fields. Check required values and field types.",
    });
  if (err.code === "23505")
    return res
      .status(409)
      .json({ error: "That name or site address is already in use." });
  const status = err.status || 500;
  res.status(status).json({
    error:
      status < 500 || err instanceof BillingError
        ? err.message
        : "Backend request failed. Please try again.",
    ...(err instanceof BillingError && err.code
      ? { code: err.code, accountUrl: err.accountUrl }
      : {}),
  });
}
