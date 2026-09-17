import test from "node:test";
import assert from "node:assert/strict";
import {
  appDesignSchema,
  designPresets,
  designVariables,
  getAppDesign,
  summarizeWidget,
} from "../shared/app-design.mjs";
test("design presets resolve to constrained transferable runtime tokens", () => {
  for (const preset of designPresets) {
    const d = appDesignSchema.parse(preset);
    const vars = designVariables(d);
    assert.equal(vars["--app-primary"], preset.palette.primary);
    assert.equal(vars["--app-radius"], `${preset.radius}px`);
    assert.ok(vars["--app-font"]);
  }
  assert.equal(
    getAppDesign({ template: "crm" }).palette.primary,
    designPresets[1].palette.primary,
  );
});
test("design configuration rejects unsafe CSS and invalid bindings", () => {
  const d = appDesignSchema.parse(designPresets[0]);
  assert.equal(
    appDesignSchema.safeParse({
      ...d,
      palette: { ...d.palette, primary: "url(https://evil.test)" },
    }).success,
    false,
  );
  assert.equal(
    appDesignSchema.safeParse({ ...d, radius: 10000 }).success,
    false,
  );
  assert.equal(
    appDesignSchema.safeParse({
      ...d,
      widgets: [{ id: "x", title: "Total", type: "sum", collectionId: "c" }],
    }).success,
    false,
  );
  const w = { id: "x", title: "Count", type: "count", collectionId: "c" };
  assert.equal(
    appDesignSchema.safeParse({ ...d, widgets: [w, w] }).success,
    false,
  );
});
test("widget sample summaries handle nulls and prototype-like categories safely", () => {
  const records = [
    { data: { amount: 7, status: "__proto__" } },
    { data: { amount: 3, status: "__proto__" } },
    { data: { amount: "4", status: null } },
  ];
  assert.equal(summarizeWidget({ type: "sum", field: "amount" }, records), 10);
  assert.deepEqual(
    summarizeWidget({ type: "group", field: "status", limit: 5 }, records),
    [
      ["__proto__", 2],
      ["Unspecified", 1],
    ],
  );
  assert.equal(
    summarizeWidget({ type: "recent", limit: 2 }, records).length,
    2,
  );
});

test("third-party catalogue has over fifty actual theme families, distinct palettes and readable tokens", async () => {
  const { contrastRatio } = await import("../shared/design-colors.mjs");
  assert.ok(new Set(designPresets.map((p) => p.family || p.id)).size >= 50);
  assert.equal(
    new Set(designPresets.map((p) => p.id)).size,
    designPresets.length,
  );
  assert.equal(
    new Set(designPresets.map((p) => JSON.stringify(p.palette))).size,
    designPresets.length,
  );
  assert.ok(
    designPresets.some((p) => p.source === "tweakcn" && p.mode === "dark"),
  );
  assert.ok(
    designPresets.some((p) => p.source === "daisyUI" && p.mode === "light"),
  );
  for (const p of designPresets) {
    const d = appDesignSchema.parse(p),
      v = designVariables(d);
    for (const surface of [d.palette.background, d.palette.surface])
      assert.ok(contrastRatio(surface, d.palette.text) >= 4.5, p.id);
    assert.ok(
      contrastRatio(d.palette.primary, v["--app-on-primary"]) >= 4.5,
      p.id + " button",
    );
    for (const token of [
      "--app-soft",
      "--app-accent-surface",
      "--app-accent-text",
    ])
      assert.match(v[token], /^#[0-9a-f]{6}$/i);
  }
});
test("theme switching keeps operational bindings and independent layout choices", async () => {
  const { applyDesignPreset } = await import("../shared/app-design.mjs");
  const original = appDesignSchema.parse({
    ...designPresets[0],
    layout: "split",
    navigation: "topbar",
    heading: "Real work",
    density: "compact",
    widgets: [
      {
        id: "count",
        title: "Projects",
        type: "count",
        collectionId: "projects",
        limit: 5,
      },
    ],
  });
  for (const preset of designPresets) {
    const applied = applyDesignPreset(original, preset);
    assert.deepEqual(applied.widgets, original.widgets);
    assert.equal(applied.heading, original.heading);
    assert.equal(applied.layout, "split");
    assert.equal(applied.navigation, "topbar");
    assert.equal(applied.density, "compact");
    assert.deepEqual(applied.palette, preset.palette);
  }
  assert.equal(
    original.palette.primary,
    designPresets[0].palette.primary,
    "input is not mutated",
  );
});
test("automatic dashboard bindings only use available typed fields and are bounded", async () => {
  const { createDashboardWidgets } = await import("../shared/app-design.mjs");
  const { validateDesignBindings } = await import("../server/design-ai.mjs");
  const collections = Array.from({ length: 8 }, (_, i) => ({
    id: `c${i}`,
    name: `Collection ${i}`,
    fields: [
      {
        name: "status",
        label: "Status",
        type: "enum",
        options: ["open", "closed"],
      },
      { name: "revenue", label: "Revenue", type: "number" },
      {
        name: "project",
        label: "Project",
        type: "reference",
        referenceCollectionId: "c0",
      },
    ],
  }));
  const before = structuredClone(collections);
  const widgets = createDashboardWidgets(collections);
  assert.equal(widgets.length, 12);
  assert.equal(widgets[0].type, "count");
  assert.equal(widgets[1].field, "status");
  assert.equal(widgets[2].field, "revenue");
  assert.equal(new Set(widgets.map((w) => w.id)).size, 12);
  const design = appDesignSchema.parse({ ...designPresets[0], widgets });
  assert.doesNotThrow(() =>
    validateDesignBindings({ navigation: [], design }, collections),
  );
  assert.deepEqual(collections, before);
  assert.deepEqual(createDashboardWidgets([]), []);
  assert.equal(
    createDashboardWidgets([{ id: "x", name: "Empty", fields: [] }]).length,
    1,
  );
});
test("heading and body typography stay independent and reject arbitrary CSS", () => {
  const d = appDesignSchema.parse({
    ...designPresets[0],
    font: "manrope",
    headingFont: "playfair",
    layout: "wide",
  });
  assert.match(designVariables(d)["--app-font"], /Manrope/);
  assert.match(designVariables(d)["--app-heading-font"], /Playfair/);
  assert.equal(
    appDesignSchema.safeParse({
      ...d,
      headingFont: "url(https://example.test)",
    }).success,
    false,
  );
  assert.equal(
    appDesignSchema.safeParse({ ...d, layout: "javascript:alert(1)" }).success,
    false,
  );
  const legacy = appDesignSchema.parse(designPresets[0]);
  assert.equal(legacy.layout, "dashboard");
  assert.equal(
    designVariables(legacy)["--app-font"],
    designVariables(legacy)["--app-heading-font"],
  );
});
