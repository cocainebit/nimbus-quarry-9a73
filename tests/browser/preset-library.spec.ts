import { test, expect } from "./runtime-fixture";
import { getLayoutPreset } from "../../shared/app-layouts.mjs";
function contrast(a: string, b: string) {
  const lum = (s: string) => {
    const c = (s.match(/[\d.]+/g) || [])
      .slice(0, 3)
      .map(Number)
      .map((v) => {
        v /= 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
    return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
  };
  const x = lum(a),
    y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
test("upstream dark theme, typography and inbox layout preserve live app collections, widgets and related records", async ({
  page,
  browser,
}) => {
  test.setTimeout(120000);
  const suffix = Date.now().toString(36),
    slug = `theme-${suffix}`,
    origin = "http://127.0.0.1:5173";
  const registered = await page.request.post("/api/auth/sign-up/email", {
    headers: { Origin: origin },
    data: {
      name: "Theme owner",
      email: `theme-owner-${suffix}@example.com`,
      password: "Theme-owner-password-123",
    },
  });
  expect(registered.ok(), await registered.text()).toBeTruthy();
  await page.goto("/");
  await page.getByRole("button", { name: "Account & server projects" }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByRole("button", { name: "Load projects with current session" })
    .click();
  await page
    .getByRole("button", { name: "Starter templates", exact: true })
    .click();
  await page
    .locator(".catalog-card")
    .filter({
      has: page.getByRole("heading", { name: "Client space", exact: true }),
    })
    .getByRole("button", { name: "Use this app" })
    .click();
  await page.getByRole("button", { name: "App layout", exact: true }).click();
  const design = page.getByRole("dialog", { name: "App layout", exact: true });
  await expect(
    design.getByText("123 of 123 presets", { exact: true }),
  ).toBeVisible();
  await design.getByLabel("Theme source").selectOption("daisyUI");
  await page.screenshot({ path: "docs/preset-library.png", fullPage: true });
  await design.getByLabel("Theme appearance").selectOption("dark");
  await design.getByLabel("Search themes").fill("Dracula");
  const card = design.locator(".preset-gallery-card");
  await expect(card).toHaveCount(1);
  await card.click();
  await expect(card).toHaveAttribute("aria-pressed", "true");
  await design.getByLabel("Body typography").selectOption("manrope");
  await design.getByLabel("Heading typography").selectOption("playfair");
  await expect(design.getByText("32 layouts", { exact: true })).toBeVisible();
  await design.getByLabel("Layout category").selectOption("Workspaces");
  await design.getByLabel("Search layouts").fill("Inbox");
  await design.locator(".layout-library-card").click();
  await expect(design.getByLabel("Content layout")).toHaveValue("inbox");
  for (const [device, width, shape] of [
    ["desktop", 1440, "desktop"],
    ["tablet", 1024, "tablet"],
    ["phone", 390, "mobile"],
  ] as const) {
    await design
      .getByRole("button", { name: `Preview ${device}`, exact: true })
      .click();
    await expect
      .poll(() =>
        design
          .locator(".canvas-device-content")
          .evaluate((el) => el.clientWidth),
      )
      .toBe(width);
    const layout = getLayoutPreset("inbox");
    const matrix =
      shape === "mobile" ? layout.mobile.map((slot) => [slot]) : layout[shape];
    await expect
      .poll(() =>
        design
          .locator(".app-composition-grid")
          .evaluate((el) => getComputedStyle(el).gridTemplateAreas),
      )
      .toBe(matrix.map((row) => `"${row.join(" ")}"`).join(" "));
  }
  await design
    .getByRole("button", { name: "Preview desktop", exact: true })
    .click();
  await design.getByLabel("Search layouts").fill("");
  await design.getByLabel("Layout category").selectOption("all");
  await design.locator(".layout-library").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "docs/layout-library.png", fullPage: true });
  await design
    .getByRole("button", {
      name: "Connect dashboard automatically",
      exact: true,
    })
    .click();
  await expect(
    design.getByText(/widgets connected to your existing database/),
  ).toBeVisible();
  await expect(design.locator(".design-live-preview")).toHaveClass(
    /app-layout-inbox/,
  );
  await design.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "App backend", exact: true }).click();
  const backend = page.getByRole("dialog", {
    name: "App backend",
    exact: true,
  });
  await backend.getByLabel("Site address").fill(slug);
  await backend
    .getByRole("button", { name: "Publish app", exact: true })
    .click();
  await expect(
    backend.getByRole("link", { name: "Open published app" }),
  ).toBeVisible();
  const saved = (await (await page.request.get("/api/projects")).json())[0];
  const before = (
    await (
      await page.request.get(`/api/projects/${saved.document.id}/backend`)
    ).json()
  ).collections;
  const context = await browser.newContext({ baseURL: origin });
  const member = await context.newPage();
  try {
    await member.goto(`/sites/${slug}`);
    const auth = member.locator(".app-welcome");
    await expect(auth).toBeVisible();
    const authColors = await auth
      .getByLabel("Email", { exact: true })
      .evaluate((el) => ({
        background: getComputedStyle(el).backgroundColor,
        color: getComputedStyle(el).color,
      }));
    expect(
      contrast(authColors.background, authColors.color),
    ).toBeGreaterThanOrEqual(4.5);
    expect(authColors.background).not.toBe("rgb(255, 255, 255)");
    await auth.getByRole("button", { name: "Create account instead" }).click();
    await auth.getByLabel("Name", { exact: true }).fill("Theme member");
    await auth
      .getByLabel("Email", { exact: true })
      .fill(`theme-member-${suffix}@example.com`);
    await auth
      .getByLabel("Password", { exact: true })
      .fill("Theme-member-password-123");
    await auth
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(member.locator(".application-shell")).toHaveClass(
      /app-layout-inbox/,
    );
    const fonts = await member.locator(".application-shell").evaluate((el) => ({
      body: getComputedStyle(el).fontFamily,
      heading: getComputedStyle(el.querySelector("h1")!).fontFamily,
    }));
    expect(fonts.body).toContain("Manrope");
    expect(fonts.heading).toContain("Playfair");
    await member
      .getByRole("button", { name: "New project", exact: true })
      .click();
    let dialog = member.getByRole("dialog", {
      name: "New record",
      exact: true,
    });
    const colors = await dialog
      .getByLabel("Project name *", { exact: true })
      .evaluate((el) => ({
        background: getComputedStyle(el).backgroundColor,
        color: getComputedStyle(el).color,
      }));
    expect(contrast(colors.background, colors.color)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(colors.background).not.toBe("rgb(255, 255, 255)");
    const primary = await dialog
      .getByRole("button", { name: "Save record", exact: true })
      .evaluate((el) => ({
        background: getComputedStyle(el).backgroundColor,
        color: getComputedStyle(el).color,
      }));
    expect(contrast(primary.background, primary.color)).toBeGreaterThanOrEqual(
      4.5,
    );
    await dialog
      .getByLabel("Project name *", { exact: true })
      .fill("Theme-safe engagement");
    await dialog
      .getByLabel("Description", { exact: true })
      .fill("A real record beneath a configurable presentation.");
    await dialog
      .getByRole("combobox", { name: /^Status/ })
      .selectOption("active");
    await dialog
      .getByRole("button", { name: "Save record", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    const widget = member.locator(".app-widget-count").filter({
      has: member.getByRole("heading", { name: "Projects", exact: true }),
    });
    await expect(widget.locator(".app-widget-number")).toHaveText("1");
    await member.screenshot({ path: "docs/dark-app.png", fullPage: true });
    await member.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() =>
        member.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await expect(widget.locator(".app-widget-number")).toBeVisible();
    await member.setViewportSize({ width: 1440, height: 1000 });
    await member
      .locator(".application-sidebar")
      .getByRole("button", { name: /Requests/ })
      .click();
    await member
      .getByRole("button", { name: "Add record", exact: true })
      .click();
    dialog = member.getByRole("dialog", { name: "New record", exact: true });
    await dialog
      .getByLabel("Request title *", { exact: true })
      .fill("Preserve my relationship");
    await dialog
      .getByRole("combobox", { name: /^Project/ })
      .selectOption({ label: "Theme-safe engagement" });
    await dialog
      .getByLabel("Details *", { exact: true })
      .fill("Verify connected records survive a theme change.");
    await dialog
      .getByRole("combobox", { name: /^Status/ })
      .selectOption("submitted");
    await dialog
      .getByRole("button", { name: "Save record", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    await backend.getByRole("button", { name: "Close", exact: true }).click();
    await page.getByRole("button", { name: "App layout", exact: true }).click();
    await design.getByLabel("Theme source").selectOption("Plotform");
    await design.getByLabel("Search themes").fill("Editorial");
    await design.getByLabel("Theme appearance").selectOption("light");
    await design.getByRole("button", { name: /^Editorial Paper, ink/ }).click();
    await expect(design.getByLabel("Content layout")).toHaveValue("inbox");
    await design.getByRole("button", { name: "Close", exact: true }).click();
    await page
      .getByRole("button", { name: "App backend", exact: true })
      .click();
    const republished = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/projects/${saved.document.id}/publish`) &&
        r.request().method() === "POST",
    );
    await backend
      .getByRole("button", { name: "Publish app", exact: true })
      .click();
    expect((await republished).ok()).toBeTruthy();
    await expect
      .poll(async () => {
        const r = await (
          await page.request.get(`/api/projects/${saved.document.id}`)
        ).json();
        return r.document.app.design.palette.background;
      })
      .toBe("#f5f1e9");
    const after = (
      await (
        await page.request.get(`/api/projects/${saved.document.id}/backend`)
      ).json()
    ).collections;
    expect(after).toEqual(before);
    const current = (
      await (
        await page.request.get(`/api/projects/${saved.document.id}`)
      ).json()
    ).document;
    expect(current.app.design.widgets).toEqual(
      saved.document.app.design.widgets,
    );
    await member.reload();
    await expect(member.locator(".application-shell")).toHaveClass(
      /app-layout-inbox/,
    );
    await expect(widget.locator(".app-widget-number")).toHaveText("1");
    await member
      .locator(".application-sidebar")
      .getByRole("button", { name: /Requests/ })
      .click();
    await expect(member.locator(".app-board")).toContainText(
      "Preserve my relationship",
    );
  } finally {
    await context.close();
  }
});
