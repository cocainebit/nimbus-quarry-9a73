import test from "node:test";
import assert from "node:assert/strict";
import { appCatalog, catalogMetadata } from "../shared/app-catalog.mjs";
import { catalogProject } from "../server/app-catalog.mjs";
import { collectionSchema } from "../shared/backend-schema.mjs";
import { projectSchema } from "../shared/schema.mjs";
import { randomUUID } from "node:crypto";
test("each starter has valid private collections with resolvable references and operational navigation", () => {
  for (const template of appCatalog) {
    const ids = new Map();
    for (const c of template.collections) {
      const definition = {
        ...c.definition,
        fields: c.definition.fields.map((f) =>
          f.type === "reference"
            ? { ...f, referenceCollectionId: ids.get(f.referenceCollectionId) }
            : f,
        ),
      };
      assert.equal(collectionSchema.safeParse(definition).success, true);
      assert.equal(definition.publicRead, false);
      ids.set(c.key, randomUUID());
    }
    const project = catalogProject(template, { collectionIds: ids });
    assert.equal(projectSchema.safeParse(project).success, true);
    assert.equal(project.app.template, template.runtime || template.id);
    for (const nav of project.app.navigation)
      assert.ok([...ids.values()].includes(nav.collectionId));
    assert.equal(project.pages.length, 1);
  }
});
test("metadata is explicit about included features and limitations without exposing schema internals", () => {
  const metadata = catalogMetadata();
  assert.equal(metadata.length, appCatalog.length);
  assert.ok(metadata.length >= 11);
  for (const t of metadata) {
    assert.ok(t.features.length);
    assert.ok(t.limitations.length);
    assert.equal(t.collections, undefined);
    assert.equal(
      t.collectionCount,
      appCatalog.find((template) => template.id === t.id).collections.length,
    );
    assert.equal(t.screens.length, t.collectionCount);
    assert.ok(t.design.palette.primary);
    assert.ok(["portal", "crm", "tracker"].includes(t.runtime));
  }
});

test("complete starters bind real typed dashboards without seed records or cross-app references", () => {
  const ids = new Set(appCatalog.map((t) => t.id));
  assert.equal(ids.size, appCatalog.length);
  for (const template of appCatalog) {
    const collectionIds = new Map(
      template.collections.map((c) => [c.key, randomUUID()]),
    );
    const project = catalogProject(template, { collectionIds });
    for (const widget of project.app.design.widgets) {
      assert.ok([...collectionIds.values()].includes(widget.collectionId));
      const original = template.collections.find(
        (c) => collectionIds.get(c.key) === widget.collectionId,
      );
      if (widget.type === "sum")
        assert.equal(
          original.definition.fields.find((f) => f.name === widget.field)?.type,
          "number",
        );
      if (widget.type === "group")
        assert.equal(
          original.definition.fields.find((f) => f.name === widget.field)?.type,
          "enum",
        );
    }
    for (const c of template.collections) {
      assert.equal(c.definition.memberCreate, true);
      assert.equal(c.definition.editorAccess, true);
      assert.equal(c.records, undefined);
      for (const field of c.definition.fields) {
        if (field.transitions)
          for (const [state, next] of Object.entries(field.transitions)) {
            assert.ok(field.options.includes(state));
            assert.ok(next.every((value) => field.options.includes(value)));
          }
      }
    }
  }
});

test("review starters allow direct approval and a return to review without requiring a revision", () => {
  for (const template of appCatalog) {
    for (const c of template.collections) {
      const status = c.definition.fields.find(
        (f) =>
          f.name === "status" &&
          f.transitions &&
          f.options.includes("changes_requested"),
      );
      if (!status) continue;
      const review =
        status.options[status.options.indexOf("changes_requested") - 1];
      assert.ok(status.transitions[review].includes("approved"));
      assert.ok(status.transitions.changes_requested.includes(review));
      assert.ok(status.transitions.approved.includes(review));
    }
  }
});
