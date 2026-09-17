import { test, expect, type Page } from "@playwright/test";
import {
  createWebsiteStarterProject,
  websiteStarters,
} from "../../shared/website-starters.mjs";
import type { Project } from "../../src/model";

async function savedProject(page: Page): Promise<Project> {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open("site-studio", 1);
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const read = db
            .transaction("workspace")
            .objectStore("workspace")
            .get("projects");
          read.onsuccess = () => {
            db.close();
            resolve(
              read.result.find(
                (p: { name: string }) =>
                  p.name === "Design preservation (imported)",
              ),
            );
          };
          read.onerror = () => {
            db.close();
            reject(read.error);
          };
        };
      }),
  );
}

test("website design picker preserves content, previews distinct starters, replaces only with consent and supports Undo", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const source = createWebsiteStarterProject(
    "Design preservation",
    "Pages: Home, Work, Contact.",
    "studio",
  );
  source.pages[0].sections[0].title =
    "Our original, carefully written headline.";
  source.settings.email = "owner@example.test";
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "website.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(source)),
  });
  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue(
    "Design preservation (imported)",
  );
  const before = await savedProject(page);
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await page
    .getByRole("button", { name: "Open visual editor", exact: true })
    .click();
  await expect(
    page.getByText("Home · Website page editor", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Choose starting design", exact: true })
    .click();
  await expect(page.locator(".puck-screen")).toHaveCount(0);
  const picker = page.getByRole("dialog", {
    name: "Change website design",
    exact: true,
  });
  await expect(picker).toBeVisible();
  await expect(
    picker.getByLabel("Replace page sections with starter content"),
  ).not.toBeChecked();
  await picker
    .getByRole("button", { name: /Architecture & interiors/ })
    .click();
  await expect(picker.locator(".website-design-artboard")).toContainText(
    source.pages[0].sections[0].title,
  );
  await picker
    .getByRole("button", { name: "Apply visual style", exact: true })
    .click();
  const architecture = websiteStarters.find((s) => s.id === "architecture")!;
  await expect
    .poll(async () => (await savedProject(page)).theme.accent)
    .toBe(architecture.theme.accent);
  const styled = await savedProject(page);
  expect(styled.settings).toEqual(before.settings);
  expect(styled.pages.map((p) => ({ id: p.id, name: p.name }))).toEqual(
    before.pages.map((p) => ({ id: p.id, name: p.name })),
  );
  for (let i = 0; i < before.pages.length; i++) {
    expect(
      styled.pages[i].sections.map(
        ({ variant, tone, spacing, ...content }) => content,
      ),
    ).toEqual(
      before.pages[i].sections.map(
        ({ variant, tone, spacing, ...content }) => content,
      ),
    );
  }
  await page
    .getByRole("button", { name: "Change website design", exact: true })
    .click();
  await picker.getByLabel("Replace page sections with starter content").check();
  const architectureHeading = await picker
    .locator(".website-design-artboard h1")
    .first()
    .textContent();
  await picker.getByRole("button", { name: /Restaurant & café/ }).click();
  const restaurantHeading = await picker
    .locator(".website-design-artboard h1")
    .first()
    .textContent();
  expect(restaurantHeading).not.toBe(architectureHeading);
  await picker
    .getByRole("button", { name: "Mobile preview", exact: true })
    .click();
  await expect(picker.locator(".website-design-artboard")).toHaveClass(
    /is-mobile/,
  );
  await picker.getByLabel(/Preview page/).selectOption("2");
  await expect(picker.locator(".website-design-artboard")).toContainText(
    "Contact",
  );
  await picker
    .getByRole("button", {
      name: "Apply reviewed starter content",
      exact: true,
    })
    .click();
  await expect
    .poll(async () => (await savedProject(page)).pages[0].sections[0].title)
    .toBe(restaurantHeading);
  const replaced = await savedProject(page);
  expect(replaced.id).toBe(before.id);
  expect(replaced.settings).toEqual(before.settings);
  expect(replaced.pages.map((p) => p.id)).toEqual(
    before.pages.map((p) => p.id),
  );
  const pageIds = new Set(replaced.pages.map((p) => p.id));
  for (const p of replaced.pages)
    for (const s of p.sections)
      for (const link of [s.buttonHref, ...s.items.map((item) => item.href)])
        if (link.startsWith("page:"))
          expect(pageIds.has(link.slice(5))).toBeTruthy();
  await page.getByTitle("Undo last edit", { exact: true }).click();
  await expect
    .poll(async () => (await savedProject(page)).pages[0].sections[0].title)
    .toBe(source.pages[0].sections[0].title);
  expect((await savedProject(page)).pages).toEqual(styled.pages);
  expect(errors).toEqual([]);
});
