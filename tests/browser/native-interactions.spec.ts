import { test, expect } from "@playwright/test";
test("Dimension sections remain open through editing, unsafe links are rejected, credits protected and CSS undo works", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Create a website", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Classic archive", exact: true })
    .click();
  await page
    .getByRole("searchbox", { name: "Search original templates" })
    .fill("Dimension");
  await page
    .getByRole("button", { name: "Explore Dimension", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Dimension original template" })
    .getByRole("button", { name: "Use this design" })
    .click();
  const frame = page
    .locator('iframe[title="Original template preview"]')
    .contentFrame();
  await page.getByLabel("Preview mode").selectOption("interact");
  await frame
    .locator("nav")
    .getByRole("link", { name: "Intro", exact: true })
    .click();
  await expect(frame.locator("#intro")).toBeVisible();
  await page.getByLabel("Preview mode").selectOption("edit");
  await frame.locator("#intro h2").click();
  await expect(
    page.getByRole("textbox", { name: "Text", exact: true }),
  ).toHaveValue("Intro");
  await page
    .getByRole("textbox", { name: "Text", exact: true })
    .fill("An edited introduction");
  await page.getByRole("button", { name: "Apply edit", exact: true }).click();
  await expect(frame.locator("#intro")).toBeVisible();
  await expect(frame.locator("#intro h2")).toHaveText("An edited introduction");
  const before = await frame
    .locator("#intro h2")
    .evaluate((el) => getComputedStyle(el).color);
  await page.getByText("Custom CSS", { exact: true }).click();
  await page
    .getByLabel("Template CSS")
    .fill("#intro h2 { color: rgb(233, 117, 56) !important; }");
  await page.getByRole("button", { name: "Apply CSS", exact: true }).click();
  await expect(frame.locator("#intro")).toBeVisible();
  await expect(frame.locator("#intro h2")).toHaveCSS(
    "color",
    "rgb(233, 117, 56)",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(frame.locator("#intro h2")).toHaveCSS("color", before);
  await expect(frame.locator("#intro h2")).toHaveText("An edited introduction");
  const selector = page.getByLabel("Editable element");
  const options = await selector.locator("option").allTextContents();
  expect(
    options.some((text) => /html5\s*up|creative commons/i.test(text)),
  ).toBe(false);
  const link = await selector
    .locator("option")
    .evaluateAll((options) =>
      options
        .find((el) => el.textContent?.startsWith("a:"))
        ?.getAttribute("value"),
    );
  expect(link).toBeTruthy();
  await selector.selectOption(link!);
  const oldHref = await page.getByLabel("Link destination").inputValue();
  await page
    .getByLabel("Link destination")
    .fill("javascript:alert(document.cookie)");
  await page.getByRole("button", { name: "Apply edit", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Use a relative page");
  const inspected = await frame
    .locator(`[data-studio-edit="${link}"]`)
    .getAttribute("href");
  expect(inspected).toBe(oldHref);
  expect(
    await frame
      .locator('a[href*="html5up.net"]')
      .evaluateAll((links) =>
        links.every((link) => !link.hasAttribute("data-studio-edit")),
      ),
  ).toBe(true);
  await expect(frame.locator("#intro")).toBeVisible();
});
