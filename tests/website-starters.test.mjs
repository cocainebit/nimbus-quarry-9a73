import test from "node:test";
import assert from "node:assert/strict";
import {
  websiteStarters,
  inferWebsiteStarter,
  createWebsiteStarterProject,
} from "../shared/website-starters.mjs";
import { projectSchema } from "../shared/schema.mjs";
test("six website starters produce distinct valid designs and contextual editable content", () => {
  assert.equal(websiteStarters.length, 6);
  const projects = websiteStarters.map((s) =>
    createWebsiteStarterProject("Example business", "A curated website.", s.id),
  );
  assert.equal(
    new Set(projects.map((p) => p.pages[0].sections[0].title)).size,
    6,
  );
  assert.equal(new Set(projects.map((p) => JSON.stringify(p.theme))).size, 6);
  assert.equal(
    new Set(
      projects.map(
        (p) =>
          JSON.stringify(p.pages[0].sections[0].variant) +
          p.pages[0].sections[0].tone,
      ),
    ).size,
    6,
  );
  assert.ok(
    new Set(
      projects.map((p) => p.pages[0].sections.map((s) => s.kind).join(",")),
    ).size >= 5,
  );
  for (const p of projects) {
    assert.ok(projectSchema.safeParse(p).success);
    assert.equal(p.source, "demo");
    const copy = JSON.stringify(p);
    assert.doesNotMatch(
      copy,
      /A fresh perspective|Item 1|Sample testimonial|trusted by|10,000/i,
    );
    assert.equal(
      p.pages
        .flatMap((p) => p.sections)
        .some((s) => ["stats", "testimonials", "logos"].includes(s.kind)),
      false,
    );
    assert.ok(
      p.pages[0].sections
        .find((s) => s.kind === "features")
        .items.every((i) => i.title.length > 5),
    );
  }
});
test("bounded keyword inference has explicit studio fallback and explicit selection wins", () => {
  for (const [brief, id] of [
    ["An architecture practice", "architecture"],
    ["Software for teams", "saas"],
    ["A yoga practice", "wellness"],
    ["A neighborhood café", "restaurant"],
    ["A magazine about design", "editorial"],
    ["A creative studio", "studio"],
    ["Unspecified business", "studio"],
  ])
    assert.equal(inferWebsiteStarter(brief), id);
  assert.equal(inferWebsiteStarter("x".repeat(6000) + " restaurant"), "studio");
  assert.equal(
    createWebsiteStarterProject("Selected", "A software company", "restaurant")
      .theme.accent,
    websiteStarters.find((s) => s.id === "restaurant").theme.accent,
  );
  assert.throws(
    () => createWebsiteStarterProject("Invalid", "Brief", "unknown"),
    /Unknown website starter/,
  );
});
test("explicit page names, pricing position, baseline studio sections and real internal links remain editable", () => {
  const p = createWebsiteStarterProject(
    "Studio",
    "A design studio. Pages: Home, Pricing, Contact.",
    "studio",
  );
  assert.deepEqual(
    p.pages.map((p) => p.name),
    ["Home", "Pricing", "Contact"],
  );
  assert.deepEqual(
    p.pages[0].sections.map((s) => s.kind),
    ["hero", "features", "story", "cta"],
  );
  assert.equal(p.pages[1].sections[0].title, "Pricing");
  assert.equal(p.pages[1].sections[1].kind, "pricing");
  assert.equal(p.pages[1].sections.length, 4);
  assert.equal(p.pages[2].sections[0].kind, "contact");
  assert.equal(p.pages[0].sections[0].buttonHref, `page:${p.pages[2].id}`);
  assert.ok(
    p.pages[1].sections[1].items.every(
      (i) => i.price === "Add your price" && i.href === `page:${p.pages[2].id}`,
    ),
  );
  const work = createWebsiteStarterProject(
    "Studio",
    "Pages: Home, Work, Contact.",
  );
  assert.equal(work.pages[1].sections[0].title, "Work");
  const second = createWebsiteStarterProject(
    "Studio",
    "Pages: Home, Pricing, Contact.",
  );
  const preserved = createWebsiteStarterProject(
    "Existing",
    "Pages: Other",
    "wellness",
    ["Welcome", "My offers", "Contact"],
  );
  assert.deepEqual(
    preserved.pages.map((page) => page.name),
    ["Welcome", "My offers", "Contact"],
  );
  assert.equal(
    preserved.pages[0].sections[0].buttonHref,
    `page:${preserved.pages[2].id}`,
  );
  assert.notEqual(p.id, second.id);
  assert.notEqual(p.pages[0].sections[0].id, second.pages[0].sections[0].id);
});
