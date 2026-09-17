import { test, expect } from "@playwright/test";
import { sourceTemplates } from "../../shared/source-templates.mjs";
test("contemporary selection is separate from classic templates and motion experiments", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Create a website", exact: true })
    .click();
  await page.getByRole("button", { name: "Contemporary", exact: true }).click();
  const current = sourceTemplates.filter(
    (t) => t.collection === "contemporary",
  );
  await expect(page.locator(".source-card")).toHaveCount(current.length);
  await expect(
    page.locator(".source-card").filter({
      has: page.getByRole("heading", { name: "Editorial", exact: true }),
    }),
  ).toHaveCount(0);
  await page.locator(".source-collection").scrollIntoViewIfNeeded();
  const missing = await page
    .locator(".source-cover img")
    .evaluateAll((images) =>
      images
        .filter((i) => i.complete && !(i as HTMLImageElement).naturalWidth)
        .map((i) => (i as HTMLImageElement).src),
    );
  expect(missing).toEqual([]);
  await page
    .getByRole("button", { name: "Motion studies", exact: true })
    .click();
  await expect(page.locator(".source-collection-context")).toContainText(
    "not complete business websites",
  );
  await expect(page.locator(".source-card")).toHaveCount(
    sourceTemplates.filter((t) => t.collection === "motion").length,
  );
  await page
    .getByRole("button", { name: "Classic archive", exact: true })
    .click();
  await expect(page.locator(".source-card")).toHaveCount(20);
  await page.getByRole("button", { name: "Contemporary", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search original templates" })
    .fill("Dante");
  await expect(page.locator(".source-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Explore Dante", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Dante original template" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Phone", exact: true }).click();
  expect(
    await dialog
      .locator("iframe")
      .evaluate((e) => e.getBoundingClientRect().width),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Close original template" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
