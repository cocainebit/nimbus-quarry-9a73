import { test, expect } from "./runtime-fixture";
test("catalogue client portal: persisted projects, related requests, board status and searchable table", async ({
  page,
  browser,
}) => {
  test.setTimeout(60000);
  const suffix = Date.now().toString(36);
  const slug = `portal-${suffix}`;
  await page.goto("/");
  await page
    .getByRole("button", { name: "Account & server projects", exact: true })
    .click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const account = page.getByRole("dialog", {
    name: "Account and server projects",
  });
  await account.getByRole("button", { name: "Create account instead" }).click();
  await account.getByLabel("Name", { exact: true }).fill("Portal owner");
  await account
    .getByLabel("Email", { exact: true })
    .fill(`portal-owner-${suffix}@example.com`);
  await account
    .getByLabel("Password", { exact: true })
    .fill("Portal-password-1234");
  await account
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(account).not.toBeVisible();
  await page
    .getByRole("button", { name: "Starter templates", exact: true })
    .click();
  const card = page.locator(".catalog-card").filter({
    has: page.getByRole("heading", { name: "Client space", exact: true }),
  });
  await expect(card).toBeVisible();
  await page.screenshot({ path: "docs/app-catalogue.png", fullPage: true });
  await card.getByRole("button", { name: "Use this app" }).click();
  await page.getByRole("button", { name: "App layout", exact: true }).click();
  const design = page.getByRole("dialog", { name: "App layout", exact: true });
  await design.getByRole("button", { name: /Editorial Paper, ink/ }).click();
  await design
    .getByLabel("Navigation layout", { exact: true })
    .selectOption("topbar");
  await design
    .getByLabel("Dashboard heading", { exact: true })
    .fill("A clearer view of your client work.");
  await design
    .getByRole("button", { name: "+ Add data widget", exact: true })
    .click();
  const widgetEditor = design.locator(".design-widget-editor").last();
  await widgetEditor
    .getByLabel("Widget title", { exact: true })
    .fill("Live projects");
  await widgetEditor
    .getByLabel("Collection", { exact: true })
    .selectOption({ label: "Projects" });
  await expect(design.locator(".design-live-preview")).toHaveClass(
    /app-nav-topbar/,
  );
  await design.locator(".design-controls").evaluate((el) => {
    el.scrollTop = 0;
  });
  await page.screenshot({ path: "docs/design-studio.png", fullPage: true });
  await design.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "App backend", exact: true }).click();
  const backend = page.getByRole("dialog", {
    name: "App backend",
    exact: true,
  });
  await expect(backend.locator(".backend-collection")).toHaveCount(3);
  await backend.getByLabel("Site address").fill(slug);
  await backend
    .getByRole("button", { name: "Publish app", exact: true })
    .click();
  await expect(
    backend.getByRole("link", { name: "Open published app" }),
  ).toBeVisible();
  const savedProjects = await (await page.request.get("/api/projects")).json();
  const saved = savedProjects.find(
    (p: any) => p.document.app?.template === "portal",
  );
  const details = await (
    await page.request.get(`/api/projects/${saved.document.id}/backend`)
  ).json();
  const requests = details.collections.find((c: any) => c.name === "Requests");
  const workflow = await page.request.post(
    `/api/projects/${saved.document.id}/workflows`,
    {
      headers: { Origin: "http://127.0.0.1:5173" },
      data: {
        name: "Request received",
        collectionId: requests.id,
        event: "record.created",
        action: {
          type: "notification",
          message: "Your request is ready for review.",
        },
        enabled: true,
      },
    },
  );
  expect(workflow.status()).toBe(201);
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:5173",
  });
  context.setDefaultTimeout(7000);
  const member = await context.newPage();
  try {
    await member.goto(`/sites/${slug}/`);
    await member
      .getByRole("button", { name: "Create account instead" })
      .click();
    await member.getByLabel("Name", { exact: true }).fill("Client member");
    await member
      .getByLabel("Email", { exact: true })
      .fill(`portal-member-${suffix}@example.com`);
    await member
      .getByLabel("Password", { exact: true })
      .fill("Member-password-1234");
    await member
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await member
      .getByRole("button", { name: "New project", exact: true })
      .click();
    let dialog = member.getByRole("dialog", {
      name: "New record",
      exact: true,
    });
    await dialog
      .getByLabel("Project name *", { exact: true })
      .fill("Website refresh");
    await dialog
      .getByLabel("Description", { exact: true })
      .fill("A real client engagement");
    await dialog
      .getByRole("combobox", { name: /^Status/ })
      .selectOption("active");
    await dialog
      .getByRole("button", { name: "Save record", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    await expect(
      member.getByRole("heading", {
        name: "A clearer view of your client work.",
        exact: true,
      }),
    ).toBeVisible();
    const liveWidget = member.locator(".app-widget").filter({
      has: member.getByRole("heading", {
        name: "Live projects",
        exact: true,
      }),
    });
    await expect(liveWidget.locator(".app-widget-number")).toHaveText("1");
    await expect(member.locator(".application-shell")).toHaveClass(
      /app-nav-topbar/,
    );
    const runtimeStyles = await member
      .locator(".application-shell")
      .evaluate((el) => ({
        primary: getComputedStyle(el).getPropertyValue("--app-primary").trim(),
        font: getComputedStyle(el).fontFamily,
      }));
    expect(runtimeStyles.primary).toBe("#96402c");
    expect(runtimeStyles.font).toContain("Georgia");
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
      .fill("Approve homepage direction");
    await dialog
      .getByRole("combobox", { name: /^Project/ })
      .selectOption({ label: "Website refresh" });
    await dialog
      .getByLabel("Details *", { exact: true })
      .fill("Review the layout and approve the content direction");
    await dialog
      .getByRole("combobox", { name: /^Status/ })
      .selectOption("submitted");
    await dialog
      .getByRole("button", { name: "Save record", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    await expect(member.locator(".app-board")).toContainText(
      "Approve homepage direction",
    );
    await member
      .getByLabel("Status for Approve homepage direction")
      .selectOption("in_progress");
    await expect(
      member.locator(".app-board-column").filter({
        has: member.locator("h3").filter({ hasText: "in_progress" }),
      }),
    ).toContainText("Approve homepage direction");
    await member.reload();
    await member
      .locator(".application-sidebar")
      .getByRole("button", { name: /Requests/ })
      .click();
    await expect(
      member.getByLabel("Status for Approve homepage direction"),
    ).toHaveValue("in_progress");
    await member
      .getByRole("button", { name: "Table view", exact: true })
      .click();
    await expect(member.locator(".app-table-wrap")).toContainText(
      "Website refresh",
    );
    await member
      .getByRole("textbox", { name: "Search records" })
      .fill("nothing matches this");
    await expect(
      member.getByRole("heading", { name: "No matching records" }),
    ).toBeVisible();
    await member
      .getByRole("textbox", { name: "Search records" })
      .fill("homepage");
    await expect(member.locator(".app-table-wrap")).toContainText(
      "Approve homepage direction",
    );
    await member.screenshot({
      path: "docs/client-portal-working.png",
      fullPage: true,
    });
    await member
      .locator(".application-sidebar")
      .getByRole("button", { name: /Files/ })
      .click();
    await member.locator("input[type=file]").setInputFiles({
      name: "brief.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("A real client project brief."),
    });
    await expect(
      member.getByRole("link", { name: "brief.txt", exact: true }),
    ).toBeVisible();
    await member
      .locator(".application-sidebar")
      .getByRole("button", { name: /Documents/ })
      .click();
    await member
      .getByRole("button", { name: "Add record", exact: true })
      .click();
    dialog = member.getByRole("dialog", { name: "New record", exact: true });
    await dialog
      .getByLabel("Document name *", { exact: true })
      .fill("Project brief");
    await dialog
      .getByRole("combobox", { name: /^Related request/ })
      .selectOption({ label: "Approve homepage direction" });
    await dialog
      .getByRole("combobox", { name: /^Document \*/ })
      .selectOption({ label: "brief.txt" });
    await dialog
      .getByRole("button", { name: "Save record", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    await expect(member.locator(".app-table-wrap")).toContainText(
      "Project brief",
    );
    const downloadUrl = await member
      .getByRole("link", { name: "Download file ↗" })
      .getAttribute("href");
    const download = await context.request.get(downloadUrl!);
    expect(download.status()).toBe(200);
    expect(await download.text()).toBe("A real client project brief.");
    await member
      .locator(".application-sidebar")
      .getByRole("button", { name: /Activity/ })
      .click();
    await expect(
      member.getByText("Your request is ready for review.", { exact: true }),
    ).toBeVisible({ timeout: 10000 });
    await member
      .locator(".application-sidebar")
      .getByRole("button", { name: "Overview", exact: true })
      .click();
    await member.screenshot({
      path: "docs/client-portal-overview.png",
      fullPage: true,
    });
    await member.setViewportSize({ width: 390, height: 844 });
    expect(
      await member.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  } finally {
    await context.close();
  }
});
