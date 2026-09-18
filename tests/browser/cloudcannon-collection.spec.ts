import { test, expect } from "@playwright/test";
import fs from "node:fs";

type Template = {
  id: string;
  name: string;
  entry: string;
  license: string;
  framework: string;
  pages: string[];
  files: string[];
  pageCount: number;
};

const templates: Template[] = JSON.parse(
  fs.readFileSync(
    new URL("../../shared/source-templates-cloudcannon.json", import.meta.url),
    "utf8",
  ),
);

const local = (url: string) =>
  url.startsWith("http://127.0.0.1:5173/") || url.startsWith("data:");

test("every imported template previews at desktop and phone width without reaching a third party", async ({
  page,
}) => {
  test.setTimeout(240000);
  expect(templates.length).toBeGreaterThan(0);
  for (const template of templates) {
    const base = `/templates/${template.id}/`;
    const external: string[] = [];
    const failures: string[] = [];
    const errors: string[] = [];
    const onRequest = (r: any) => {
      if (!local(r.url())) external.push(r.url());
    };
    const onResponse = (r: any) => {
      if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
    };
    const onError = (e: Error) => errors.push(e.message);
    page.on("request", onRequest);
    page.on("response", onResponse);
    page.on("pageerror", onError);

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + template.entry, { waitUntil: "load" });
      await expect(page.locator("body")).not.toBeEmpty();
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      expect(scrollWidth, `${template.id} at ${width}`).toBeLessThanOrEqual(
        width + 1,
      );
    }

    expect(failures, template.id).toEqual([]);
    expect(external, template.id).toEqual([]);
    expect(errors, template.id).toEqual([]);
    page.off("request", onRequest);
    page.off("response", onResponse);
    page.off("pageerror", onError);
  }
});

test("internal navigation resolves on every template's front page", async ({
  page,
}) => {
  test.setTimeout(240000);
  for (const template of templates) {
    const base = `http://127.0.0.1:5173/templates/${template.id}/`;
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(base + template.entry, { waitUntil: "load" });
    const targets: string[] = await page.locator("a[href]").evaluateAll(
      (links, root) =>
        Array.from(
          new Set(
            links
              .map((link) => (link as HTMLAnchorElement).href.split("#")[0])
              .filter((href) => href.startsWith(root as string)),
          ),
        ),
      base,
    );
    expect(
      targets.length,
      `${template.id} has internal links`,
    ).toBeGreaterThanOrEqual(1);
    for (const target of targets) {
      const response = await page.request.get(target);
      expect(response.status(), `${template.id} -> ${target}`).toBeLessThan(400);
    }

    // Every page the manifest claims has to be there, not only the linked ones.
    for (const relative of template.pages) {
      const response = await page.request.get(base + relative);
      expect(response.status(), `${template.id} page ${relative}`).toBeLessThan(
        400,
      );
    }
  }
});

test("every template ships its pinned source archive, its licence and its image provenance", async ({
  page,
}) => {
  test.setTimeout(120000);
  for (const template of templates) {
    const base = `/templates/${template.id}/`;
    expect(template.files, template.id).toContain("upstream-source.zip");
    expect(template.license, template.id).toBe("MIT");

    const archive = await page.request.get(base + "upstream-source.zip");
    expect(archive.ok(), `${template.id} archive`).toBeTruthy();
    expect((await archive.body()).subarray(0, 2).toString()).toBe("PK");

    const licence = template.files.find((file) => /^LICENSE(\.|$)/.test(file));
    expect(licence, `${template.id} licence file`).toBeTruthy();
    const licenceText = await page.request.get(base + licence!);
    expect(await licenceText.text()).toContain("MIT License");

    const source = await (await page.request.get(base + "SOURCE.json")).json();
    expect(source.commit, `${template.id} pinned commit`).toMatch(/^[0-9a-f]{40}$/);
    expect(source.images.length, `${template.id} images`).toBeGreaterThan(0);
    for (const image of source.images) {
      expect(image.origin, `${template.id} ${image.file}`).toBeTruthy();
      expect(image.license, `${template.id} ${image.file}`).toBeTruthy();
    }
  }
});

test("the manifest page counts match the built pages, and no page keeps an em dash", async ({
  page,
}) => {
  test.setTimeout(180000);
  for (const template of templates) {
    expect(template.pageCount, template.id).toBe(template.pages.length);
    expect(template.pages, template.id).toContain(template.entry);
    await page.goto(`/templates/${template.id}/${template.entry}`, {
      waitUntil: "load",
    });
    const text = await page.locator("body").innerText();
    expect(text.includes("—"), `${template.id} em dash`).toBe(false);
    await expect(
      page.getByText("Demonstration content", { exact: false }).first(),
    ).toBeAttached();
  }
});

test("the collection has its own tab in the catalogue and lists every template", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Create a website", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publisher library", exact: true })
    .click();
  await expect(
    page.getByText("CloudCannon's MIT template line", { exact: false }),
  ).toBeVisible();
  for (const template of templates) {
    await expect(
      page.getByRole("button", { name: `Explore ${template.name}` }),
    ).toBeVisible();
  }
});
