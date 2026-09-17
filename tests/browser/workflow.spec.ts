import { test, expect } from "@playwright/test";
import { unzipSync, strFromU8 } from "fflate";
import fs from "node:fs/promises";
test("create, edit, synchronize, persist, preview and export a website", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Build a working app.*Design a distinctive website/ }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/dashboard.png", fullPage: true });
  await page.getByRole("button", { name: "Build with editable blocks" }).click();
  await page.getByLabel("Project name", { exact: true }).fill("Browser Test");
  await page
    .getByLabel("Website brief", { exact: true })
    .last()
    .fill("A creative studio. Pages: Home, Work, Contact.");
  await page.getByRole("button", { name: "Create demo website" }).click();
  await expect(page.locator(".page-list button")).toHaveCount(3);
  await page.getByLabel("Page name", { exact: true }).fill("Welcome");
  await page.locator(".section-edit summary").first().click();
  await page
    .getByLabel("Heading", { exact: true })
    .first()
    .fill("Build something wonderful.");
  await expect(
    page
      .locator(".map-section")
      .filter({ hasText: "Build something wonderful." }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/sitemap.png" });
  await page.getByRole("button", { name: "Wireframes", exact: true }).click();
  await expect(page.locator(".artboard")).toHaveCount(3);
  await expect(
    page.locator(".artboard").first().getByText("Build something wonderful."),
  ).toBeVisible();
  await page.screenshot({ path: "docs/wireframes.png" });
  await page.getByRole("button", { name: "Style guide", exact: true }).click();
  await page.getByLabel("accent color").fill("#c3ddff");
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await expect(page.locator(".design-preview .site-page")).toHaveCSS(
    "--site-accent",
    "#c3ddff",
  );
  await page
    .getByRole("button", { name: "Open visual editor", exact: true })
    .click();
  await expect(page.locator(".puck-screen")).toBeVisible();
  await page.frameLocator("iframe").getByRole("button").first().click();
  await page
    .getByRole("textbox", { name: "title", exact: true })
    .fill("Edited in the visual editor.");
  await page.screenshot({ path: "docs/visual-editor.png" });
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator(".puck-screen")).toHaveCount(0);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page
    .locator(".preview-site")
    .getByRole("link", { name: "Work", exact: true })
    .click();
  await expect(page.getByLabel("Preview page")).not.toHaveValue("");
  await expect(
    page
      .locator(".preview-site")
      .getByRole("heading", { name: "Work", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close preview" }).click();
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download website (.zip)" }).click();
  const path = await (await download).path();
  const files = unzipSync(new Uint8Array(await fs.readFile(path!)));
  expect(Object.keys(files)).toEqual(
    expect.arrayContaining([
      "index.html",
      "page-1.html",
      "page-2.html",
      "styles.css",
      "project.json",
    ]),
  );
  expect(strFromU8(files["index.html"])).toContain(
    "Edited in the visual editor.",
  );
  await page.getByRole("button", { name: "Back to projects" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Open Browser Test", exact: true })
    .click();
  await expect(page.getByLabel("Page name", { exact: true })).toHaveValue(
    "Welcome",
  );
  expect(errors).toEqual([]);
});
test("unconfigured AI reports a useful error and stays in the dialog", async ({
  page,
}) => {
  await page.route("**/api/generate", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error:
          "AI is not connected. Set OLLAMA_MODEL in .env and restart, or choose Demo template.",
      }),
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Build with editable blocks" }).click();
  await page.getByLabel("Project name", { exact: true }).fill("AI test");
  await page
    .getByLabel("Website brief", { exact: true })
    .last()
    .fill("A website for a bakery in the city.");
  await page.getByLabel("Generation mode").selectOption("ai");
  await page
    .getByRole("button", { name: "Generate website", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("AI is not connected");
  await expect(page.getByRole("dialog")).toBeVisible();
});
test("dashboard fits a small screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "docs/mobile-dashboard.png", fullPage: true });
});
