import { test, expect } from "@playwright/test";
import { layoutPresets } from "../../shared/app-layouts.mjs";

test("all 32 real app layouts retain content and respond to available width without overflow", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.route("**/api/layout-fixture/**", async (route) => {
    const url = route.request().url();
    if (url.endsWith("/notifications")) return route.fulfill({ json: [] });
    if (url.endsWith("/summary"))
      return route.fulfill({
        json: { total: 3, groups: [{ key: null, metrics: { value: 3 } }] },
      });
    return route.fulfill({
      json: {
        total: 3,
        offset: 0,
        limit: 100,
        records: [
          {
            id: "r1",
            data: {
              title: "A real-shaped project with a long descriptive name",
              status: "active",
            },
            version: 1,
            canEdit: true,
          },
          {
            id: "r2",
            data: { title: "Second engagement", status: "active" },
            version: 1,
            canEdit: true,
          },
          {
            id: "r3",
            data: { title: "Final delivery", status: "complete" },
            version: 1,
            canEdit: true,
          },
        ],
      },
    });
  });
  await page.goto("/");
  await page.evaluate(async () => {
    // Use the production component through Vite, with HTTP data fixtures. No
    // test-only production route or alternate layout implementation is added.
    const { default: React } =
      await import("/node_modules/.vite/deps/react.js");
    const { default: ReactDOM } =
      await import("/node_modules/.vite/deps/react-dom_client.js");
    const { default: Workspace } = await import("/src/AppWorkspace.tsx");
    const { getAppDesign } = await import("/shared/app-design.mjs");
    document.getElementById("root")?.remove();
    const host = document.createElement("div");
    document.body.append(host);
    const root = ReactDOM.createRoot(host);
    const collections = [
      {
        id: "projects",
        name: "Projects",
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
          {
            name: "status",
            label: "Status",
            type: "enum",
            options: ["active", "complete"],
            required: true,
          },
        ],
        member_create: true,
        public_read: false,
      },
    ];
    const app = {
      template: "portal",
      title: "Layout workspace",
      description: "Operational work across every screen size.",
      navigation: [
        { collectionId: "projects", label: "Projects", view: "cards" },
      ],
    };
    const design = {
      ...getAppDesign(app),
      widgets: [
        {
          id: "project-total",
          title: "Project total",
          type: "count",
          collectionId: "projects",
          limit: 5,
        },
      ],
    };
    (window as any).showAppLayout = (layout: string, empty = false) =>
      root.render(
        React.createElement(Workspace, {
          project: {
            id: "layout-project",
            name: "Layout workspace",
            app: {
              ...app,
              design: {
                ...design,
                layout,
                widgets: empty ? [] : design.widgets,
              },
            },
          },
          collections,
          base: "/api/layout-fixture",
          user: {
            id: "member",
            name: "Layout member",
            email: "layout@example.test",
          },
          onSession: async () => {},
        }),
      );
  });
  const signatures = new Set<string>();
  for (const width of [1600, 1100, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const preset of layoutPresets) {
      await page.evaluate((id) => (window as any).showAppLayout(id), preset.id);
      const composition = page.locator(
        `.app-composition[data-layout="${preset.id}"]`,
      );
      await expect(composition).toBeVisible();
      await expect(composition.locator(".app-widget-number")).toHaveText("3");
      await expect(composition.locator(".app-slot-recent")).toContainText(
        "Second engagement",
      );
      const geometry = await composition.evaluate((el) => {
        const grid = el.querySelector(".app-composition-grid")!;
        return {
          width: el.clientWidth,
          areas: getComputedStyle(grid).gridTemplateAreas,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          boxes: Array.from(grid.children).map((n) => {
            const b = n.getBoundingClientRect();
            return {
              slot: n.getAttribute("data-layout-slot"),
              x: b.x,
              y: b.y,
              width: b.width,
              height: b.height,
            };
          }),
        };
      });
      const matrix =
        geometry.width >= 1100
          ? preset.desktop
          : geometry.width >= 700
            ? preset.tablet
            : preset.mobile.map((slot) => [slot]);
      expect(geometry.areas, `${preset.id} at ${width}`).toBe(
        matrix.map((row) => `"${row.join(" ")}"`).join(" "),
      );
      expect(geometry.overflow, `${preset.id} at ${width} overflows`).toBe(
        false,
      );
      expect(geometry.boxes).toHaveLength(5);
      for (const b of geometry.boxes) {
        expect(b.width, `${preset.id} ${b.slot} width`).toBeGreaterThan(0);
        expect(b.height, `${preset.id} ${b.slot} height`).toBeGreaterThan(0);
        expect(b.x).toBeGreaterThanOrEqual(-1);
        expect(b.x + b.width).toBeLessThanOrEqual(width + 1);
      }
      for (let i = 0; i < geometry.boxes.length; i++)
        for (let j = i + 1; j < geometry.boxes.length; j++) {
          const a = geometry.boxes[i],
            b = geometry.boxes[j];
          const overlaps =
            Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 &&
            Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1;
          expect(overlaps, `${preset.id}: ${a.slot} overlaps ${b.slot}`).toBe(
            false,
          );
        }
      if (width === 1600) signatures.add(geometry.areas);
      if (
        width === 1600 &&
        ["inbox", "journal", "metric-wall"].includes(preset.id)
      )
        await page.screenshot({
          path: `docs/layout-${preset.id}.png`,
          fullPage: true,
        });
    }
  }
  expect(signatures.size).toBe(32);
  // A workspace with no custom widgets still has usable work/actions at each end.
  for (const id of ["split", "inbox", "journal"]) {
    await page.evaluate((id) => (window as any).showAppLayout(id, true), id);
    const composition = page.locator(`.app-composition[data-layout="${id}"]`);
    await expect(composition.locator("[data-layout-slot]")).toHaveCount(4);
    await expect(composition.locator(".app-slot-actions")).toContainText(
      "Explore your workspace",
    );
  }
});
