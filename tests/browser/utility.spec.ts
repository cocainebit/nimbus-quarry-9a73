import { test, expect } from "@playwright/test";
import { unzipSync, strFromU8 } from "fflate";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
const pixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS1kAAAAASUVORK5CYII=",
  "base64",
);
test("build a business site, export assets, run it and receive a real inquiry", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Build with editable blocks" }).click();
  await page.getByLabel("Project name", { exact: true }).fill("Useful Studio");
  await page
    .getByLabel("Website brief", { exact: true })
    .last()
    .fill("A design studio. Pages: Home, Pricing, Contact.");
  await page.getByRole("button", { name: "Create demo website" }).click();
  await page.locator(".section-edit summary").first().click();
  const hero = page.locator(".section-edit").first();
  await hero.getByLabel("Button label", { exact: true }).fill("See our plans");
  await hero
    .getByLabel("Button destination")
    .selectOption({ label: "Page: Pricing" });
  await hero
    .getByLabel("Upload image")
    .setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: pixel });
  await hero.getByLabel("Image description").fill("A sample image");
  await page.getByRole("button", { name: "Pricing 02", exact: true }).click();
  await page.getByText("Page URL & search settings", { exact: true }).click();
  await page.getByLabel("URL slug").fill("plans");
  await page.getByLabel("Search title").fill("Design plans | Useful Studio");
  await page
    .getByLabel("Search description")
    .fill("Choose a design service for your next project.");
  const pricing = page
    .locator(".section-edit")
    .filter({ has: page.locator("summary", { hasText: /02pricing/ }) });
  await pricing.locator("summary").first().click();
  await pricing.locator(".items-editor summary").first().click();
  await pricing
    .getByLabel("Item title", { exact: true })
    .first()
    .fill("Starter project");
  await pricing
    .getByLabel("Price", { exact: true })
    .first()
    .fill("$250 / project");
  await pricing
    .getByRole("textbox", { name: "Item description", exact: true })
    .first()
    .fill("One landing page\nTwo revisions");
  await page.getByRole("button", { name: "Add section", exact: true }).click();
  await page
    .getByRole("button", { name: "Team Add section →", exact: true })
    .click();
  await expect(page.locator(".section-edit")).toHaveCount(5);
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download website (.zip)" }).click();
  const downloaded = await pending;
  const files = unzipSync(
    new Uint8Array(await fs.readFile((await downloaded.path())!)),
  );
  expect(files["plans.html"]).toBeTruthy();
  expect(files["assets/image-1.png"]).toBeTruthy();
  expect(strFromU8(files["index.html"])).toContain('href="plans.html"');
  expect(strFromU8(files["plans.html"])).toContain(
    "<title>Design plans | Useful Studio</title>",
  );
  expect(strFromU8(files["plans.html"])).toContain("$250 / project");
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "site-studio-export-"));
  let child: ReturnType<typeof spawn> | undefined;
  try {
    for (const [name, data] of Object.entries(files)) {
      await fs.mkdir(path.dirname(path.join(dir, name)), { recursive: true });
      await fs.writeFile(path.join(dir, name), data);
    }
    child = spawn(process.execPath, ["server.mjs"], {
      cwd: dir,
      env: { ...process.env, PORT: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const url = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(Error("Export server did not start")),
        10000,
      );
      child!.once("error", reject);
      child!.stdout!.on("data", (chunk) => {
        const match = String(chunk).match(/http:\/\/127.0.0.1:\d+/);
        if (match) {
          clearTimeout(timer);
          resolve(match[0]);
        }
      });
    });
    await page.goto(url);
    await page.getByRole("link", { name: "See our plans" }).click();
    await expect(page).toHaveURL(`${url}/plans.html`);
    await expect(page.getByText("$250 / project")).toBeVisible();
    await page.locator(".faq-list details summary").first().click();
    await expect(page.locator(".faq-list details").first()).toHaveAttribute(
      "open",
      "",
    );
    await page.getByRole("link", { name: "Contact", exact: true }).click();
    await page.getByLabel("Your name", { exact: true }).fill("Test Customer");
    await page.getByLabel("Email address").fill("customer@example.com");
    await page
      .getByLabel("How can we help?")
      .fill("We would like a new website for our studio.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("status")).toHaveText(
      "Thank you. Your message has been received.",
    );
    const message = JSON.parse(
      (
        await fs.readFile(path.join(dir, "data/submissions.jsonl"), "utf8")
      ).trim(),
    );
    expect(message.email).toBe("customer@example.com");
    expect((await request.get(`${url}/data/submissions.jsonl`)).status()).toBe(
      404,
    );
    expect((await request.get(`${url}/project.json`)).status()).toBe(404);
    expect(
      (
        await request.post(`${url}/api/contact`, {
          data: { name: "", email: "wrong", message: "x" },
        })
      ).status(),
    ).toBe(400);
    await page.screenshot({
      path: "docs/exported-contact.png",
      fullPage: true,
    });
  } finally {
    child?.kill();
    await fs.rm(dir, { recursive: true, force: true });
  }
  // Reopen the portable document in a fresh project.
  await page.goto("http://127.0.0.1:5173/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "project.json",
    mimeType: "application/json",
    buffer: Buffer.from(files["project.json"]),
  });
  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue(
    "Useful Studio (imported)",
  );
  await page.getByRole("button", { name: "Pricing 02", exact: true }).click();
  await expect(page.locator(".section-edit")).toHaveCount(5);
});
test("targeted AI changes are reviewed before applying and can be undone", async ({
  page,
}) => {
  await page.route("**/api/refine", async (route) => {
    const input = route.request().postDataJSON();
    const target = input.page.sections.find(
      (s: { id: string }) => s.id === input.sectionId,
    );
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        sections: [{ ...target, title: "Your next project starts here." }],
      }),
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Open Forma Studio", exact: true })
    .click();
  await page.locator(".section-edit summary").first().click();
  await page
    .getByRole("button", { name: "Refine section with AI", exact: true })
    .first()
    .click();
  await page
    .getByLabel("What should change?")
    .fill("Make this hero more direct and focused on project enquiries.");
  await page
    .getByRole("button", { name: "Generate a draft", exact: true })
    .click();
  await expect(page.locator(".draft-review")).toContainText(
    "Your next project starts here.",
  );
  await expect(page.locator(".map-section").first()).toContainText(
    "Spaces for a slower kind of living.",
  );
  await page.getByRole("button", { name: "Apply draft", exact: true }).click();
  await expect(page.locator(".map-section").first()).toContainText(
    "Your next project starts here.",
  );
  await page
    .getByRole("button", { name: "Undo last edit", exact: true })
    .click();
  await expect(page.locator(".map-section").first()).toContainText(
    "Spaces for a slower kind of living.",
  );
});

test("sections can be reused across pages with undo and redo", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Open Forma Studio", exact: true })
    .click();
  await page.locator(".section-edit>summary").first().click();
  await page
    .getByRole("button", { name: "Copy section", exact: true })
    .first()
    .click();
  await page.locator(".page-list button").nth(1).click();
  await page
    .getByRole("button", { name: "Paste hero section", exact: true })
    .click();
  await expect(page.locator(".section-edit")).toHaveCount(4);
  await page.locator(".section-edit>summary").last().click();
  await page
    .locator(".section-edit")
    .last()
    .getByRole("combobox", { name: "Move to page", exact: true })
    .selectOption({ label: "Studio" });
  await expect(page.locator(".section-edit")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Undo last edit", exact: true })
    .click();
  await expect(page.locator(".section-edit")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Redo last edit", exact: true })
    .click();
  await expect(page.locator(".section-edit")).toHaveCount(3);
  await page.locator(".page-list button").nth(2).click();
  await expect(page.locator(".section-edit")).toHaveCount(4);
  await expect(page.locator(".save-state")).toHaveText("Saved");
  await page.reload();
  await page
    .getByRole("button", { name: "Open Forma Studio", exact: true })
    .click();
  await page.locator(".page-list button").nth(2).click();
  await expect(page.locator(".section-edit")).toHaveCount(4);
});
