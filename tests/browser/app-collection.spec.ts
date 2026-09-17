import { test, expect } from "@playwright/test";
import { catalogMetadata } from "../../shared/app-catalog.mjs";

test("complete starter catalogue browses and previews distinct connected apps without signing in or creating data", async ({
  page,
}) => {
  const templates = catalogMetadata();
  let installs = 0;
  await page.route("**/api/catalog", (route) =>
    route.fulfill({ json: templates }),
  );
  await page.route("**/api/catalog/*/install", (route) => {
    installs++;
    return route.fulfill({
      status: 500,
      json: { error: "Preview must not install an app" },
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Starter templates", exact: true })
    .click();
  await expect(page.locator(".catalog-card")).toHaveCount(11);
  await expect(page.locator(".catalog-count")).toContainText("11 app starters");
  const rendered = await page
    .locator(".catalog-card .design-live-preview")
    .evaluateAll((elements) =>
      elements.map((el) => ({
        layout: el
          .querySelector(".app-composition")
          ?.getAttribute("data-layout"),
        primary: getComputedStyle(el).getPropertyValue("--app-primary"),
      })),
    );
  expect(new Set(rendered.map((p) => p.layout)).size).toBeGreaterThanOrEqual(9);
  expect(new Set(rendered.map((p) => p.primary)).size).toBeGreaterThanOrEqual(
    9,
  );
  await page.getByRole("searchbox", { name: "Find an app" }).fill("Resolve");
  await expect(page.locator(".catalog-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Preview Resolve", exact: true })
    .click();
  let preview = page.getByRole("dialog", {
    name: "Resolve preview",
    exact: true,
  });
  await expect(preview).toBeVisible();
  await expect(preview.locator(".app-composition")).toHaveAttribute(
    "data-layout",
    "queue",
  );
  await expect(preview).toContainText(
    "Environments · Tickets · Troubleshooting notes",
  );
  await expect(preview).toContainText("Your records start empty");
  await preview.getByRole("button", { name: "Close app preview" }).click();
  await page
    .getByRole("searchbox", { name: "Find an app" })
    .fill("Studio room");
  await expect(page.locator(".catalog-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Preview Studio room", exact: true })
    .click();
  preview = page.getByRole("dialog", {
    name: "Studio room preview",
    exact: true,
  });
  await expect(preview.locator(".app-composition")).toHaveAttribute(
    "data-layout",
    "client-home",
  );
  await expect(preview).toContainText("Engagements · Deliverables · Feedback");
  await page.keyboard.press("Escape");
  await expect(preview).not.toBeVisible();
  await page.getByRole("searchbox", { name: "Find an app" }).fill("");
  await page
    .locator(".catalog-controls select")
    .selectOption("Professional services");
  await expect(page.locator(".catalog-card")).toHaveCount(2);
  await page.locator(".catalog-controls select").selectOption("All");
  await page.screenshot({ path: "docs/complete-app-collection.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".catalog-card")).toHaveCount(11);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(installs).toBe(0);
});
