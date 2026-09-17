import { test, expect } from "@playwright/test";
import fs from "node:fs";
const templates: { id: string }[] = JSON.parse(
  fs.readFileSync(
    new URL("../../shared/source-templates-bootstrap.json", import.meta.url),
    "utf8",
  ),
);

test("ten original Bootstrap sites load locally with real images and interactive navigation", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  const external: string[] = [];
  page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.stack}`));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => {
    external.push(route.request().url());
    return route.abort();
  });
  for (const template of templates) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/templates/${template.id}/index.html`);
    await expect(
      page
        .locator(template.id === "sb-agency" ? ".masthead-heading" : "h1")
        .first(),
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const broken = await page
      .locator("img")
      .evaluateAll((images) =>
        images
          .filter(
            (img) =>
              !(img as HTMLImageElement).complete ||
              !(img as HTMLImageElement).naturalWidth,
          )
          .map((img) => (img as HTMLImageElement).src),
      );
    expect(broken, template.id).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    const toggle = page.locator(".navbar-toggler");
    if (await toggle.count()) {
      await toggle.first().click();
      await expect(page.locator(".navbar-collapse").first()).toHaveClass(
        /show/,
      );
    } else if (template.id === "sb-stylish-portfolio") {
      await page.locator(".menu-toggle").click();
      await expect(page.locator("#sidebar-wrapper")).toHaveClass(/active/);
    }
    if (template.id === "sb-agency")
      await page.screenshot({ path: "docs/source-agency-mobile.png" });
  }
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
