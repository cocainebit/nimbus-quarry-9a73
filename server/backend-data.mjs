import { randomUUID } from "node:crypto";
import { collectionSchema, recordData } from "../shared/backend-schema.mjs";
export const fail = (status, message) =>
  Object.assign(new Error(message), { status });
export async function lockProject(db, id) {
  await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [id]);
}
export async function transaction(pool, fn) {
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const value = await fn(db);
    await db.query("COMMIT");
    return value;
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  } finally {
    db.release();
  }
}
async function references(db, projectId, fields) {
  for (const f of fields.filter((f) => f.type === "reference")) {
    const { rowCount } = await db.query(
      "SELECT 1 FROM collections WHERE id=$1 AND project_id=$2",
      [f.referenceCollectionId, projectId],
    );
    if (!rowCount)
      throw fail(400, "Reference collection must belong to this app.");
  }
}
async function activeProject(db, projectId) {
  const { rowCount } = await db.query(
    "SELECT 1 FROM projects WHERE id=$1 AND archived_at IS NULL",
    [projectId],
  );
  if (!rowCount) throw fail(404, "Project not found.");
}
export async function createCollection(db, projectId, input) {
  const c = collectionSchema.parse(input);
  await lockProject(db, projectId);
  await activeProject(db, projectId);
  await references(db, projectId, c.fields);
  return (
    await db.query(
      "INSERT INTO collections(id,project_id,name,fields,public_read,member_create,editor_access) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [
        randomUUID(),
        projectId,
        c.name,
        JSON.stringify(c.fields),
        c.publicRead,
        c.memberCreate,
        c.editorAccess,
      ],
    )
  ).rows[0];
}
export async function validateRecord(
  db,
  c,
  input,
  { previous, userId, recordId, privileged = false, checkRules = true } = {},
) {
  const data = recordData(c.fields, input);
  for (const f of c.fields) {
    const value = data[f.name];
    if (
      checkRules &&
      previous &&
      f.immutable &&
      JSON.stringify(value) !== JSON.stringify(previous[f.name])
    )
      throw fail(400, `${f.label} cannot change.`);
    if (
      checkRules &&
      previous &&
      f.transitions &&
      value !== previous[f.name] &&
      !f.transitions[previous[f.name]]?.includes(value)
    )
      throw fail(400, `${f.label} transition is not allowed.`);
    if (value === undefined) continue;
    if (f.unique) {
      const { rowCount } = await db.query(
        "SELECT 1 FROM records WHERE collection_id=$1 AND data->$2=$3::jsonb AND ($4::text IS NULL OR id<>$4) LIMIT 1",
        [c.id, f.name, JSON.stringify(value), recordId ?? null],
      );
      if (rowCount) throw fail(409, `${f.label} must be unique.`);
    }
    if (f.type === "reference") {
      const { rowCount } = await db.query(
        "SELECT 1 FROM records r JOIN collections c ON c.id=r.collection_id WHERE r.id=$1 AND c.id=$2 AND c.project_id=$3 AND ($4::boolean OR c.public_read OR r.owner_id=$5 OR (c.editor_access AND $6::boolean))",
        [
          value,
          f.referenceCollectionId,
          c.project_id,
          !checkRules,
          userId ?? "",
          privileged,
        ],
      );
      if (!rowCount)
        throw fail(400, `${f.label} references an unavailable record.`);
    }
    if (f.type === "file") {
      const { rows } = await db.query(
        "SELECT to_regclass('app_files') AS present",
      );
      if (!rows[0].present) throw fail(400, "File storage is unavailable.");
      const exists = await db.query(
        "SELECT 1 FROM app_files WHERE id=$1 AND project_id=$2 AND ($3::boolean OR owner_id=$4)",
        [value, c.project_id, !checkRules, userId ?? ""],
      );
      if (!exists.rowCount)
        throw fail(400, `${f.label} references an unavailable file.`);
    }
  }
  return data;
}
export async function previewCollectionChange(db, projectId, id, input) {
  const c = collectionSchema.parse(input);
  await activeProject(db, projectId);
  await references(db, projectId, c.fields);
  const old = (
    await db.query("SELECT * FROM collections WHERE id=$1 AND project_id=$2", [
      id,
      projectId,
    ])
  ).rows[0];
  if (!old) throw fail(404, "Collection not found.");
  const issues = [];
  for (const f of old.fields) {
    const replacement = c.fields.find((n) => n.name === f.name);
    if (!replacement) issues.push(`Removing field ${f.name} is destructive.`);
    else if (replacement.type !== f.type)
      issues.push(`Changing field ${f.name} type is destructive.`);
  }
  const records = (
    await db.query("SELECT id,data FROM records WHERE collection_id=$1", [id])
  ).rows;
  for (const r of records) {
    try {
      await validateRecord(db, { ...old, fields: c.fields }, r.data, {
        recordId: r.id,
        checkRules: false,
      });
    } catch (e) {
      issues.push(
        `Record ${r.id}: ${e.status ? e.message : "does not satisfy the new schema."}`,
      );
      if (issues.length >= 100) break;
    }
  }
  return {
    safe: issues.length === 0,
    issues,
    schemaVersion: old.schema_version,
    recordCount: records.length,
    definition: c,
  };
}
export async function applyCollectionChange(db, projectId, id, input) {
  const { schemaVersion, ...definition } = input;
  if (!Number.isInteger(schemaVersion))
    throw fail(400, "Expected schemaVersion.");
  await lockProject(db, projectId);
  const preview = await previewCollectionChange(db, projectId, id, definition);
  if (preview.schemaVersion !== schemaVersion)
    throw fail(409, "Collection schema changed. Preview it again.");
  if (!preview.safe) throw fail(409, preview.issues.join(" "));
  await db.query(
    "INSERT INTO collection_revisions(collection_id,schema_version,definition) SELECT id,schema_version,jsonb_build_object('name',name,'fields',fields,'publicRead',public_read,'memberCreate',member_create,'editorAccess',editor_access) FROM collections WHERE id=$1 ON CONFLICT DO NOTHING",
    [id],
  );
  const c = preview.definition;
  return (
    await db.query(
      "UPDATE collections SET name=$2,fields=$3,public_read=$4,member_create=$5,editor_access=$6,schema_version=schema_version+1 WHERE id=$1 RETURNING *",
      [
        id,
        c.name,
        JSON.stringify(c.fields),
        c.publicRead,
        c.memberCreate,
        c.editorAccess,
      ],
    )
  ).rows[0];
}
export async function assertNotReferenced(db, projectId, recordId) {
  const { rowCount } = await db.query(
    "SELECT 1 FROM records r JOIN collections c ON c.id=r.collection_id CROSS JOIN LATERAL jsonb_array_elements(c.fields) f WHERE c.project_id=$1 AND f->>'type'='reference' AND r.data->>(f->>'name')=$2 LIMIT 1",
    [projectId, recordId],
  );
  if (rowCount)
    throw fail(
      409,
      "This record is referenced by another record. Remove those references first.",
    );
}
