import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { unzipSync } from "fflate";

test("React template edits survive hydration, interactions and a standalone export", async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Create a website", exact: true })
    .click();
  await page
    .getByRole("searchbox", { name: "Search original templates" })
    .fill("Launch UI");
  await page
    .getByRole("button", { name: "Explore Launch UI", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Launch UI original template" })
    .getByRole("button", { name: "Use this design" })
    .click();
  const frame = page
    .locator('iframe[title="Original template preview"]')
    .contentFrame();
  await expect(frame.locator("h1")).toHaveAttribute(
    "data-studio-edit",
    /element-/,
  );
  const heading = frame.locator("h1");
  // Launch's h1 is a leaf. Select it in the actual sandboxed canvas.
  await heading.click();
  await page
    .getByRole("textbox", { name: "Text", exact: true })
    .fill("A distinct product, made yours");
  await page.getByRole("button", { name: "Apply edit", exact: true }).click();
  await expect(heading).toHaveText("A distinct product, made yours");
  await page.waitForTimeout(2500);
  await expect(heading).toHaveText("A distinct product, made yours");
  await page.getByLabel("Preview mode").selectOption("interact");
  const question = frame
    .locator('button[data-slot="accordion-trigger"]')
    .first();
  await question.click();
  await expect(question).toHaveAttribute("data-state", "open");
  await expect(heading).toHaveText("A distinct product, made yours");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export original website" }).click();
  const download = await downloadPromise;
  const files = unzipSync(
    new Uint8Array(await readFile((await download.path())!)),
  );
  expect(files["original-source.zip"]).toBeTruthy();
  const types: Record<string, string> = {
    html: "text/html",
    js: "text/javascript",
    css: "text/css",
    woff2: "font/woff2",
    svg: "image/svg+xml",
    png: "image/png",
  };
  const server = createServer((req, res) => {
    const path =
      decodeURIComponent(
        new URL(req.url || "/", "http://localhost").pathname,
      ).replace(/^\//, "") || "index.html";
    const body = files[path];
    res.writeHead(body ? 200 : 404, {
      "Content-Type":
        types[path.split(".").pop()!] || "application/octet-stream",
    });
    res.end(body || "Not found");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    if (!address || typeof address === "string")
      throw Error("Missing export server");
    const exported = await context.newPage();
    const errors: string[] = [];
    exported.on("pageerror", (error) => errors.push(error.message));
    await exported.goto(`http://127.0.0.1:${address.port}/`);
    await expect(exported.locator("h1")).toHaveText(
      "A distinct product, made yours",
    );
    await exported.waitForTimeout(2500);
    await expect(exported.locator("h1")).toHaveText(
      "A distinct product, made yours",
    );
    const exportedQuestion = exported
      .locator('button[data-slot="accordion-trigger"]')
      .first();
    await exportedQuestion.click();
    await expect(exportedQuestion).toHaveAttribute("data-state", "open");
    await expect(exported.locator("h1")).toHaveText(
      "A distinct product, made yours",
    );
    expect(errors).toEqual([]);
    await expect(exported.locator("[data-studio-edit]")).toHaveCount(0);
    await exported.close();
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
