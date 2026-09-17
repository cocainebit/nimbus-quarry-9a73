import { z } from "zod";
import { fromNodeHeaders } from "better-auth/node";
import { fail } from "./backend-data.mjs";
const filter = z
  .object({
    field: z.string().max(100),
    op: z.enum(["eq", "ne", "contains", "gt", "gte", "lt", "lte"]),
    value: z.union([z.string().max(6000), z.number().finite(), z.boolean()]),
  })
  .strict();
const common = {
  search: z.string().max(200).default(""),
  filters: z.array(filter).max(20).default([]),
};
const querySchema = z
  .object({
    ...common,
    sort: z
      .object({
        field: z.string().max(100),
        direction: z.enum(["asc", "desc"]),
      })
      .strict()
      .optional(),
    offset: z.number().int().min(0).max(1000000).default(0),
    limit: z.number().int().min(1).max(100).default(50),
  })
  .strict();
const summarySchema = z
  .object({
    ...common,
    groupBy: z.string().max(100).optional(),
    metrics: z
      .array(
        z
          .object({
            name: z
              .string()
              .regex(/^[a-z][a-z0-9_]{0,39}$/)
              .refine(
                (v) => !["constructor", "prototype", "__proto__"].includes(v),
              ),
            op: z.enum(["count", "sum", "avg", "min", "max"]),
            field: z.string().max(100).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(10),
  })
  .strict();
function build(c, user, input) {
  const params = [
    c.id,
    c.public_read,
    user?.id || "",
    Boolean(c.editor_access && ["admin", "editor"].includes(user?.role)),
  ];
  const bind = (value) => {
    params.push(value);
    return `$${params.length}`;
  };
  const field = (name, numeric = false) => {
    const f = c.fields.find((f) => f.name === name);
    if (!f) throw fail(400, `Unknown field: ${name}`);
    if (numeric && f.type !== "number")
      throw fail(400, "Numeric metrics require number fields.");
    const key = bind(name),
      expression = `data->>${key}::text`;
    return {
      f,
      text: `(${expression})`,
      sql:
        f.type === "number"
          ? `CASE WHEN jsonb_typeof(data->${key}::text)='number' THEN (${expression})::numeric END`
          : f.type === "boolean"
            ? `CASE WHEN jsonb_typeof(data->${key}::text)='boolean' THEN (${expression})::boolean END`
            : `(${expression})`,
    };
  };
  const where = [
    "collection_id=$1",
    "($2::boolean OR owner_id=$3 OR $4::boolean)",
  ];
  if (input.search) {
    const searchable = c.fields.filter((f) =>
      ["text", "email", "enum"].includes(f.type),
    );
    const term = bind(`%${input.search.replace(/[\\%_]/g, "\\$&")}%`);
    where.push(
      searchable.length
        ? `(${searchable.map((f) => `${field(f.name).text} ILIKE ${term} ESCAPE E'\\\\'`).join(" OR ")})`
        : "FALSE",
    );
  }
  for (const item of input.filters) {
    const f = field(item.field);
    if (item.op === "contains") {
      if (
        !["text", "email", "enum"].includes(f.f.type) ||
        typeof item.value !== "string"
      )
        throw fail(400, "Contains requires a text field and value.");
      where.push(
        `${f.text} ILIKE ${bind(`%${item.value.replace(/[\\%_]/g, "\\$&")}%`)} ESCAPE E'\\\\'`,
      );
      continue;
    }
    if (
      typeof item.value !==
      (f.f.type === "number"
        ? "number"
        : f.f.type === "boolean"
          ? "boolean"
          : "string")
    )
      throw fail(400, "Filter value does not match field type.");
    if (f.f.type === "boolean" && !["eq", "ne"].includes(item.op))
      throw fail(400, "Boolean fields support equality filters only.");
    where.push(
      `${f.sql} ${{ eq: "=", ne: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=" }[item.op]} ${bind(item.value)}`,
    );
  }
  return { params, bind, field, where: where.join(" AND ") };
}
export function mountRecordQueries(app, { pool, publication, member, auth }) {
  const access = async (req) => {
    const p = await publication(req);
    const c = (
      await pool.query(
        "SELECT * FROM collections WHERE id=$1 AND project_id=$2",
        [req.params.collectionId, p.project_id],
      )
    ).rows[0];
    if (!c) throw fail(404, "Collection not found.");
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
        const m = (
          await pool.query(
            "SELECT role FROM app_members WHERE project_id=$1 AND user_id=$2",
            [c.project_id, user.id],
          )
        ).rows[0];
        user = { ...user, role: m?.role };
      }
    }
    return { c, user };
  };
  app.post(
    "/api/apps/:slug/collections/:collectionId/query",
    async (req, res) => {
      const input = querySchema.parse(req.body);
      const { c, user } = await access(req);
      const q = build(c, user, input);
      const total = (
        await pool.query(
          `SELECT count(*)::int total FROM records WHERE ${q.where}`,
          q.params,
        )
      ).rows[0].total;
      const sort = input.sort;
      const expression = !sort
        ? "created_at"
        : ["created_at", "updated_at"].includes(sort.field)
          ? sort.field
          : q.field(sort.field).sql;
      const records = (
        await pool.query(
          `SELECT id,data,version,created_at,updated_at,(owner_id=$3 OR $4::boolean) AS "canEdit" FROM records WHERE ${q.where} ORDER BY ${expression} ${sort?.direction === "asc" ? "ASC" : "DESC"} NULLS LAST,id ASC LIMIT ${q.bind(input.limit)} OFFSET ${q.bind(input.offset)}`,
          q.params,
        )
      ).rows;
      res.json({ records, total, offset: input.offset, limit: input.limit });
    },
  );
  app.post(
    "/api/apps/:slug/collections/:collectionId/summary",
    async (req, res) => {
      const input = summarySchema.parse(req.body);
      if (
        new Set(input.metrics.map((m) => m.name)).size !== input.metrics.length
      )
        throw fail(400, "Metric names must be unique.");
      const { c, user } = await access(req);
      const q = build(c, user, input);
      const total = (
        await pool.query(
          `SELECT count(*)::int total FROM records WHERE ${q.where}`,
          q.params,
        )
      ).rows[0].total;
      const grouping = input.groupBy ? q.field(input.groupBy).sql : null;
      const metrics = input.metrics.map((m, i) =>
        m.op === "count"
          ? `count(*)::int AS m${i}`
          : `${m.op.toUpperCase()}(${q.field(m.field, true).sql})::float8 AS m${i}`,
      );
      const rows = (
        await pool.query(
          `SELECT ${grouping || "NULL::text"} AS key,${metrics.join(",")} FROM records WHERE ${q.where}${grouping ? " GROUP BY 1 ORDER BY 1 NULLS LAST" : ""} LIMIT 501`,
          q.params,
        )
      ).rows;
      if (rows.length > 500)
        throw fail(400, "Too many groups. Narrow the filters.");
      res.json({
        total,
        groups: rows.map((r) => ({
          key: r.key,
          metrics: Object.fromEntries(
            input.metrics.map((m, i) => [m.name, r[`m${i}`]]),
          ),
        })),
      });
    },
  );
}
