import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";
test("source typography uses real local fonts, scales for phone, exports assets and undoes edits", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Create a website", exact: true })
    .click();
  await page.getByRole("button", { name: "Contemporary", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search original templates" })
    .fill("Dante");
  await page
    .getByRole("button", { name: "Explore Dante", exact: true })
    .click();
  await page.getByRole("button", { name: "Use this design" }).click();
  const select = page.getByLabel("Editable element");
  await expect(select).toBeVisible();
  await expect(
    select.locator("option").filter({ hasText: /^h1:/ }),
  ).toHaveCount(1);
  const id = await select
    .locator("option")
    .evaluateAll((nodes) =>
      nodes
        .find((n) => n.textContent?.startsWith("h1:"))
        ?.getAttribute("value"),
    );
  expect(id).toBeTruthy();
  await select.selectOption(id!);
  await page.getByText("Typography & color", { exact: true }).click();
  await page
    .getByRole("combobox", { name: "Typeface", exact: true })
    .selectOption({ label: "Inter" });
  await page.getByLabel("Text size (px)", { exact: true }).fill("80");
  await page.getByLabel("Text color", { exact: true }).fill("#cc3366");
  await page
    .getByRole("button", { name: "Apply typography", exact: true })
    .click();
  const frame = page.frameLocator("iframe");
  await expect(frame.locator("h1")).toHaveCSS("color", "rgb(204, 51, 102)");
  await expect(frame.locator("h1")).toHaveCSS(
    "font-family",
    '"Plotform Inter"',
  );
  await frame.locator("h1").evaluate(async () => {
    await document.fonts.ready;
  });
  expect(
    await frame
      .locator("h1")
      .evaluate(() => document.fonts.check('16px "Plotform Inter"')),
  ).toBe(true);
  await page.getByLabel("Preview width").selectOption("mobile");
  const size = await frame
    .locator("h1")
    .evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  expect(size).toBeGreaterThanOrEqual(24);
  expect(size).toBeLessThan(40);
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export original website" }).click();
  const download = await downloading;
  const files = unzipSync(
    new Uint8Array(await readFile((await download.path())!)),
  );
  expect(files["plotform-fonts/inter.woff2"]).toBeTruthy();
  expect(files["plotform-fonts/inter.LICENSE.txt"]).toBeTruthy();
  expect(strFromU8(files["index.html"])).toContain(
    "plotform-fonts/inter.woff2",
  );
  expect(strFromU8(files["blog/index.html"])).toContain(
    "../plotform-fonts/inter.woff2",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(frame.locator("h1")).not.toHaveCSS("color", "rgb(204, 51, 102)");
});
