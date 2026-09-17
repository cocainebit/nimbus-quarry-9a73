import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";
import { sourceTemplates } from "../../shared/source-templates.mjs";

test("original source catalogue shows20 real designs and edits, saves, and exports the original files", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Starter templates", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Classic archive", exact: true })
    .click();
  await expect(page.locator(".source-card")).toHaveCount(20);
  await expect(page.locator(".source-total")).toHaveText("20 original designs");
  await page
    .getByRole("searchbox", { name: "Search original templates" })
    .fill("Editorial");
  await page
    .getByRole("button", { name: "Explore Editorial", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Editorial original template",
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Phone", exact: true }).click();
  expect(
    await dialog
      .locator("iframe")
      .evaluate((el) => el.getBoundingClientRect().width),
  ).toBeLessThanOrEqual(390);
  await dialog
    .getByRole("textbox", { name: "Project name" })
    .fill("Original editorial project");
  await dialog.getByRole("button", { name: "Use this design" }).click();
  await expect(
    page.getByRole("button", { name: "Export original website" }),
  ).toBeVisible();
  const select = page.getByLabel("Editable element");
  await expect(select.locator("option")).not.toHaveCount(1);
  const target = await select
    .locator("option")
    .evaluateAll((options) =>
      options
        .find((o) => o.textContent?.startsWith("h2:"))
        ?.getAttribute("value"),
    );
  expect(target).toBeTruthy();
  await select.selectOption(target!);
  await page
    .getByRole("textbox", { name: "Text", exact: true })
    .fill("An original design, made yours");
  await page.getByRole("button", { name: "Apply edit", exact: true }).click();
  await expect(
    page
      .locator("iframe")
      .contentFrame()
      .getByText("An original design, made yours", { exact: true }),
  ).toHaveCount(1);
  await page.getByText("Custom CSS", { exact: true }).click();
  await page
    .getByLabel("Template CSS")
    .fill("h2 { color: rgb(24, 75, 140) !important; }");
  await page.getByRole("button", { name: "Apply CSS", exact: true }).click();
  await expect(
    page
      .locator("iframe")
      .contentFrame()
      .getByText("An original design, made yours", { exact: true }),
  ).toHaveCSS("color", "rgb(24, 75, 140)");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export original website" }).click();
  const download = await downloadPromise;
  const files = unzipSync(
    new Uint8Array(await readFile((await download.path())!)),
  );
  const html = strFromU8(files["index.html"]);
  expect(html).toContain("An original design, made yours");
  expect(html).toContain("rgb(24, 75, 140)");
  expect(html).toContain("HTML5 UP");
  expect(html).not.toContain("data-studio-edit");
  expect(files["assets/css/main.css"]).toBeTruthy();
  expect(files["LICENSE.txt"]).toBeTruthy();
  await page.reload();
  await page
    .getByText("Original editorial project", { exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Export original website" }),
  ).toBeVisible();
  await expect(
    page
      .locator("iframe")
      .contentFrame()
      .getByText("An original design, made yours", { exact: true }),
  ).toHaveCount(1);
});

test("all20 original template entry pages load local styles and meaningful content", async ({
  page,
}) => {
  test.setTimeout(180000);
  expect(sourceTemplates.length).toBeGreaterThanOrEqual(20);
  for (const template of sourceTemplates) {
    const failures: string[] = [];
    const response = (r: any) => {
      if (r.status() >= 400 && r.url().includes(`/templates/${template.id}/`))
        failures.push(r.url());
    };
    page.on("response", response);
    await page.goto(`/templates/${template.id}/${template.entry}`, {
      waitUntil: "networkidle",
    });
    await expect(page.locator("body")).not.toBeEmpty();
    expect(await page.locator("body").innerText()).not.toHaveLength(0);
    expect(
      await page.evaluate(() => document.styleSheets.length),
    ).toBeGreaterThan(0);
    expect(failures, template.id).toEqual([]);
    page.off("response", response);
  }
});
