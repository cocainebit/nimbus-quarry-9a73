import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { connectDatabase } from "../server/db.mjs";
import { enqueueRecordEvent, runNextJob } from "../server/automation.mjs";

// Use the running Compose PostgreSQL image's matching client version, never a
// production database. Passwords are neither process arguments nor test output.
function docker(args, input) {
  return new Promise((resolve, reject) => {
    const proc = spawn("docker", ["compose", "exec", "-T", "db", ...args], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    const output = [];
    let error = "";
    proc.stdout.on("data", (b) => output.push(b));
    proc.stderr.on("data", (b) => {
      error += b;
    });
    proc.once("error", reject);
    proc.once("close", (code) =>
      code === 0
        ? resolve(Buffer.concat(output))
        : reject(
            Error(
              `Database backup tool failed (${code}): ${error.slice(0, 1000)}`,
            ),
          ),
    );
    proc.stdin.on("error", () => {});
    proc.stdin.end(input);
  });
}
test("PostgreSQL dump/restore retains schema, memberships, records, private files and recoverable jobs", async (t) => {
  const admin = connectDatabase(),
    suffix = randomUUID().replaceAll("-", ""),
    sourceName = `recovery_source_${suffix}`,
    restoredName = `recovery_restored_${suffix}`;
  const url = new URL(process.env.DATABASE_URL),
    username = decodeURIComponent(url.username);
  let source, restored;
  await admin.query(`CREATE DATABASE ${sourceName}`);
  t.after(async () => {
    if (source) await source.end();
    if (restored) await restored.end();
    await admin.query(`DROP DATABASE IF EXISTS ${sourceName}`);
    await admin.query(`DROP DATABASE IF EXISTS ${restoredName}`);
    await admin.end();
  });
  url.pathname = "/" + sourceName;
  source = connectDatabase(url.toString());
  for (const file of [
    "001-platform.sql",
    "002-schema.sql",
    "003-automation.sql",
    "005-project-archive.sql",
    "006-workflow-engine.sql",
    "008-workflow-compatibility.sql",
  ])
    await source.query(
      await readFile(
        new URL("../server/migrations/" + file, import.meta.url),
        "utf8",
      ),
    );
  await source.query(
    "INSERT INTO projects(id,owner_id,document) VALUES('app','builder',$1)",
    [{ name: "Recovery app" }],
  );
  const fields = [
    { name: "title", label: "Title", type: "text", required: true },
  ];
  await source.query(
    "INSERT INTO collections(id,project_id,name,fields,schema_version) VALUES('tasks','app','Tasks',$1,2)",
    [JSON.stringify(fields)],
  );
  await source.query(
    "INSERT INTO collection_revisions(collection_id,schema_version,definition) VALUES('tasks',2,$1)",
    [{ name: "Tasks", fields }],
  );
  await source.query(
    "INSERT INTO app_members(project_id,user_id,role) VALUES('app','alice','editor')",
  );
  await source.query(
    "INSERT INTO records(id,collection_id,owner_id,data,version) VALUES('task','tasks','alice',$1,3)",
    [{ title: "Survives restore" }],
  );
  const content = Buffer.from("Private recovered document");
  await source.query(
    "INSERT INTO app_files(id,project_id,owner_id,name,mime,size,content) VALUES('file','app','alice','recovery.txt','text/plain',$1,$2)",
    [content.length, content],
  );
  await source.query(
    "INSERT INTO workflows(id,project_id,name,collection_id,event,action) VALUES('notify','app','Notify','tasks','record.updated',$1)",
    [{ type: "notification", message: "Recovered notification" }],
  );
  await enqueueRecordEvent(source, {
    projectId: "app",
    collectionId: "tasks",
    event: "record.updated",
    record: { id: "task", version: 3, data: { title: "Survives restore" } },
    actorId: "alice",
  });
  await source.query(
    "UPDATE jobs SET status='running',attempts=1,lease_until=now()-interval '1 minute',lease_token='crashed-worker'",
  );
  const dump = await docker([
    "pg_dump",
    "--username",
    username,
    "--dbname",
    sourceName,
    "--format=custom",
    "--no-owner",
    "--no-acl",
  ]);
  assert.ok(dump.length > 1000);
  // Reconnect before backup restore: data must not depend on a live process cache.
  await source.end();
  source = null;
  await admin.query(`CREATE DATABASE ${restoredName}`);
  await docker(
    [
      "pg_restore",
      "--username",
      username,
      "--dbname",
      restoredName,
      "--no-owner",
      "--no-acl",
      "--exit-on-error",
    ],
    dump,
  );
  url.pathname = "/" + restoredName;
  restored = connectDatabase(url.toString());
  const collection = (
    await restored.query(
      "SELECT fields,schema_version FROM collections WHERE id='tasks'",
    )
  ).rows[0];
  assert.deepEqual(collection.fields, fields);
  assert.equal(collection.schema_version, 2);
  assert.equal(
    (await restored.query("SELECT * FROM collection_revisions")).rowCount,
    1,
  );
  assert.equal(
    (await restored.query("SELECT role FROM app_members")).rows[0].role,
    "editor",
  );
  const record = (await restored.query("SELECT data,version FROM records"))
    .rows[0];
  assert.equal(record.data.title, "Survives restore");
  assert.equal(record.version, 3);
  assert.deepEqual(
    (await restored.query("SELECT content FROM app_files")).rows[0].content,
    content,
  );
  assert.equal(await runNextJob(restored), true);
  assert.equal(
    (await restored.query("SELECT status,attempts FROM jobs")).rows[0].status,
    "completed",
  );
  assert.equal(
    (await restored.query("SELECT message FROM app_notifications")).rows[0]
      .message,
    "Recovered notification",
  );
  assert.equal(await runNextJob(restored), false);
});
