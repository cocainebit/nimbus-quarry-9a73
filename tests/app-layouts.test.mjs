import test from "node:test";
import assert from "node:assert/strict";
import {
  layoutPresets,
  layoutIds,
  getLayoutPreset,
} from "../shared/app-layouts.mjs";
import {
  appDesignSchema,
  applyDesignPreset,
  designPresets,
} from "../shared/app-design.mjs";

const areas = ["heading", "widgets", "stats", "recent", "actions"];
// CSS grid-template-areas discards an entire declaration if a named area is
// disjoint or nonrectangular. Check geometry, not a snapshot of preset literals.
function assertUsableGrid(grid, label) {
  assert.ok(Array.isArray(grid) && grid.length, `${label}: empty grid`);
  const width = grid[0].length;
  assert.ok(width > 0, `${label}: empty row`);
  assert.ok(
    grid.every((row) => Array.isArray(row) && row.length === width),
    `${label}: ragged grid`,
  );
  assert.deepEqual(
    [...new Set(grid.flat())].sort(),
    [...areas].sort(),
    `${label}: missing or unknown areas`,
  );
  for (const area of areas) {
    const cells = grid.flatMap((row, y) =>
      row.flatMap((value, x) => (value === area ? [{ x, y }] : [])),
    );
    const xs = cells.map((c) => c.x),
      ys = cells.map((c) => c.y);
    const rectangleSize =
      (Math.max(...xs) - Math.min(...xs) + 1) *
      (Math.max(...ys) - Math.min(...ys) + 1);
    assert.equal(
      cells.length,
      rectangleSize,
      `${label}: ${area} must form one rectangle`,
    );
  }
}

test("layout catalogue contains 32 distinct structural desktop arrangements and preserves legacy IDs", () => {
  assert.equal(layoutPresets.length, 32);
  assert.equal(new Set(layoutIds).size, layoutPresets.length);
  assert.equal(
    new Set(layoutPresets.map((p) => JSON.stringify(p.desktop))).size,
    layoutPresets.length,
  );
  assert.deepEqual(
    layoutIds,
    layoutPresets.map((p) => p.id),
  );
  for (const id of ["dashboard", "focus", "split", "wide"])
    assert.equal(getLayoutPreset(id).id, id);
  assert.equal(getLayoutPreset().id, "dashboard");
  assert.throws(() => getLayoutPreset("missing-layout"), /Unknown app layout/);
});

test("desktop and tablet areas form valid CSS rectangles; mobile retains all content with heading first", () => {
  for (const preset of layoutPresets) {
    assertUsableGrid(preset.desktop, `${preset.id} desktop`);
    assertUsableGrid(preset.tablet, `${preset.id} tablet`);
    assert.equal(preset.mobile[0], "heading", preset.id);
    assert.equal(preset.mobile.length, areas.length, preset.id);
    assert.deepEqual([...preset.mobile].sort(), [...areas].sort(), preset.id);
  }
});

test("grid geometry checks detect malformed, disjoint and incomplete arrangements", () => {
  assert.throws(() => assertUsableGrid([], "empty"), /empty grid/);
  assert.throws(
    () => assertUsableGrid([["heading"], ["widgets", "stats"]], "ragged"),
    /ragged grid/,
  );
  assert.throws(
    () =>
      assertUsableGrid(
        [
          ["heading", "widgets"],
          ["stats", "recent"],
        ],
        "missing",
      ),
    /missing or unknown/,
  );
  assert.throws(
    () =>
      assertUsableGrid(
        [
          ["heading", "widgets", "heading"],
          ["stats", "recent", "actions"],
        ],
        "disjoint",
      ),
    /must form one rectangle/,
  );
  assert.throws(
    () =>
      assertUsableGrid(
        [
          ["heading", "heading", "widgets"],
          ["heading", "stats", "recent"],
          ["actions", "actions", "actions"],
        ],
        "L shape",
      ),
    /must form one rectangle/,
  );
});

test("every layout validates and survives theme replacement without losing data bindings", () => {
  const widgets = [
    {
      id: "revenue",
      title: "Revenue",
      type: "sum",
      collectionId: "deals",
      field: "amount",
      limit: 5,
    },
    {
      id: "status",
      title: "Pipeline",
      type: "group",
      collectionId: "deals",
      field: "status",
      limit: 5,
    },
  ];
  for (const layout of layoutIds) {
    const original = appDesignSchema.parse({
      ...designPresets[0],
      layout,
      heading: "Customer operations",
      navigation: "topbar",
      density: "compact",
      widgets,
    });
    const before = structuredClone(original);
    for (const preset of designPresets) {
      const applied = applyDesignPreset(original, preset);
      assert.equal(applied.layout, layout);
      assert.deepEqual(applied.widgets, original.widgets);
      assert.equal(applied.heading, original.heading);
      assert.equal(applied.navigation, original.navigation);
      assert.equal(applied.density, original.density);
      assert.ok(
        appDesignSchema.safeParse(applied).success,
        `${layout} / ${preset.id}`,
      );
    }
    assert.deepEqual(
      original,
      before,
      "theme application must not mutate its input",
    );
  }
  for (const layout of [
    "",
    "not-a-layout",
    "Dashboard",
    "url(https://example.test)",
  ])
    assert.equal(
      appDesignSchema.safeParse({ ...designPresets[0], layout }).success,
      false,
      layout,
    );
});
