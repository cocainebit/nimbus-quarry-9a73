import { test, expect } from "./runtime-fixture";
test("publish an app, register a member, persist private records and receive a contact message", async ({
  page,
  browser,
}) => {
  const suffix = Date.now().toString(36);
  const slug = `runtime-${suffix}`;
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Build with editable blocks" }).click();
  await page
    .getByLabel("Project name", { exact: true })
    .fill(`Runtime ${suffix}`);
  await page
    .getByLabel("Website brief", { exact: true })
    .last()
    .fill("A personal task tracker. Pages: Home, Contact.");
  await page.getByRole("button", { name: "Create demo website" }).click();
  await page.getByRole("button", { name: "App backend", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "App backend" });
  await panel.getByRole("button", { name: "Create account instead" }).click();
  await panel.getByLabel("Name", { exact: true }).fill("App owner");
  await panel
    .getByLabel("Email", { exact: true })
    .fill(`owner-${suffix}@example.com`);
  await panel
    .getByLabel("Password", { exact: true })
    .fill("Browser-password-1234");
  await panel
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "Save backend project", exact: true })
    .click();
  await panel.getByLabel("Collection name").fill("Tasks");
  await panel
    .getByRole("button", { name: "Create collection", exact: true })
    .click();
  await expect(panel.locator(".backend-collection")).toContainText("Tasks");
  await panel.getByLabel("Site address").fill(slug);
  await panel.getByRole("button", { name: "Publish app", exact: true }).click();
  await expect(
    panel.getByRole("link", { name: "Open published app" }),
  ).toBeVisible();
  const memberContext = await browser.newContext({
    baseURL: "http://127.0.0.1:5173",
  });
  memberContext.setDefaultTimeout(5000);
  const memberPage = await memberContext.newPage();
  try {
    await memberPage.goto(`/sites/${slug}/account`);
    await memberPage
      .getByRole("button", { name: "Create account instead" })
      .click();
    await memberPage.getByLabel("Name", { exact: true }).fill("Member");
    await memberPage
      .getByLabel("Email", { exact: true })
      .fill(`member-${suffix}@example.com`);
    await memberPage
      .getByLabel("Password", { exact: true })
      .fill("Member-password-1234");
    await memberPage
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await memberPage
      .getByLabel("Title *", { exact: true })
      .fill("Ship the working backend");
    await memberPage
      .getByRole("button", { name: "Add record", exact: true })
      .click();
    await expect(memberPage.locator(".backend-record")).toContainText(
      "Ship the working backend",
    );
    await memberPage.reload();
    await expect(memberPage.locator(".backend-record")).toContainText(
      "Ship the working backend",
    );
    await memberPage
      .getByRole("button", { name: "Edit record", exact: true })
      .click();
    await memberPage
      .getByLabel("Title *", { exact: true })
      .fill("Backend verified");
    await memberPage
      .getByRole("button", { name: "Save record", exact: true })
      .click();
    await expect(memberPage.locator(".backend-record")).toContainText(
      "Backend verified",
    );
    await memberPage.screenshot({
      path: "docs/generated-app-backend.png",
      fullPage: true,
    });
    await memberPage
      .getByRole("button", { name: "Sign out", exact: true })
      .click();
    await expect(memberPage.locator(".backend-record")).toHaveCount(0);
    await memberPage.goto(`/sites/${slug}/`);
    await memberPage
      .getByRole("link", { name: "Contact", exact: true })
      .click();
    await memberPage.getByLabel("Your name").fill("Visitor");
    await memberPage.getByLabel("Email address").fill("visitor@example.com");
    await memberPage
      .getByLabel("How can we help?")
      .fill("Please share more details about this app.");
    await memberPage.getByRole("button", { name: "Send message" }).click();
    await expect(memberPage.getByRole("status").last()).toContainText(
      "Your message has been received.",
    );
    await panel.getByRole("button", { name: "Close", exact: true }).click();
    await page
      .getByRole("button", { name: "App backend", exact: true })
      .click();
    await expect(panel).toContainText(
      "Please share more details about this app.",
    );
    await panel.getByRole("button", { name: "Inspect records" }).click();
    await expect(panel.locator("pre")).toContainText("Backend verified");
    await page.screenshot({ path: "docs/backend-management.png" });
    await panel.getByRole("button", { name: "Unpublish", exact: true }).click();
    await expect(
      panel.getByRole("link", { name: "Open published app" }),
    ).toHaveCount(0);
    expect(errors).toEqual([]);
  } catch (error) {
    console.log(await memberPage.locator("body").innerText());
    throw error;
  } finally {
    await memberContext.close();
  }
});
