import { test, expect, type Page } from "./runtime-fixture";
const password = "Browser-cloud-password-123";
async function account(page: Page, email: string, signup = false) {
  await page.getByRole("button", { name: "Account & server projects" }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const modal = page.getByRole("dialog", {
    name: "Account and server projects",
  });
  if (signup) {
    await modal.getByRole("button", { name: "Create account instead" }).click();
    await modal.getByLabel("Name", { exact: true }).fill("Cloud owner");
  }
  await modal.getByLabel("Email", { exact: true }).fill(email);
  await modal.getByLabel("Password", { exact: true }).fill(password);
  for (let attempt = 0; attempt < 3; attempt++) {
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r
            .url()
            .includes(`/api/auth/${signup ? "sign-up" : "sign-in"}/email`) &&
          r.request().method() === "POST",
      ),
      modal
        .getByRole("button", {
          name: signup ? "Create account" : "Sign in",
          exact: true,
        })
        .click(),
    ]);
    if (response.status() !== 429) break;
    await expect(modal.getByRole("status")).toContainText("Too many requests");
    if (attempt === 2)
      throw Error(
        "Authentication remained rate-limited after bounded retries.",
      );
    // Other test workers share the local IP. Respect BetterAuth's real throttle.
    const seconds = Number(response.headers()["retry-after"]) || 10;
    await page.waitForTimeout(Math.min(15, Math.max(10, seconds)) * 1000 + 250);
  }
  await expect(modal).not.toBeVisible();
  await expect(page.getByText("Server saving enabled")).toBeVisible();
}
test("server workspace persists across browsers, isolates accounts and preserves conflict drafts", async ({
  page,
  browser,
}) => {
  test.setTimeout(60000);
  const suffix = Date.now().toString(36),
    email = `cloud-${suffix}@example.com`,
    name = `Cloud project ${suffix}`;
  await page.goto("/");
  await account(page, email, true);
  await page.getByRole("button", { name: "Build with editable blocks" }).click();
  await page.getByLabel("Project name", { exact: true }).fill(name);
  await page
    .getByLabel("Website brief", { exact: true })
    .last()
    .fill("A project for testing persistent account storage.");
  await page.getByRole("button", { name: "Create demo website" }).click();
  await expect
    .poll(async () =>
      page.evaluate(async () => {
        const r = await fetch("/api/projects");
        return (await r.json()).length;
      }),
    )
    .toBe(1);
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:5173",
  });
  const second = await context.newPage();
  const strangerContext = await browser.newContext({
    baseURL: "http://127.0.0.1:5173",
  });
  const stranger = await strangerContext.newPage();
  try {
    await second.goto("/");
    await account(second, email);
    await expect(
      second.getByRole("button", { name: `Open ${name}`, exact: true }),
    ).toBeVisible();
    const mismatch = await second.evaluate(
      async () =>
        (
          await fetch("/api/projects", {
            headers: { "X-Studio-Account": "different-account" },
          })
        ).status,
    );
    expect(mismatch).toBe(409);
    await stranger.goto("/");
    await account(stranger, `other-${suffix}@example.com`, true);
    await expect(
      stranger.getByRole("button", { name: `Open ${name}`, exact: true }),
    ).toHaveCount(0);
    // Another browser changes the server revision while this tab retains its original baseline.
    const changed = await second.evaluate(async () => {
      const rows = await (await fetch("/api/projects")).json();
      const row = rows[0];
      row.document.name += " remote";
      const r = await fetch(`/api/projects/${row.document.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: row.document, revision: row.revision }),
      });
      return r.status;
    });
    expect(changed).toBe(200);
    await page
      .getByLabel("Project name", { exact: true })
      .fill(`${name} unsaved`);
    await expect(page.getByRole("alert")).toContainText("Not saved");
    await expect(page.getByLabel("Project name", { exact: true })).toHaveValue(
      `${name} unsaved`,
    );
    const serverName = await second.evaluate(
      async () =>
        (await (await fetch("/api/projects")).json())[0].document.name,
    );
    expect(serverName).toBe(`${name} remote`);
    await page.getByRole("button", { name: "Back to projects" }).click();
    await page
      .getByRole("button", { name: "Account & server projects" })
      .click();
    await page
      .getByRole("button", { name: "Save and refresh projects" })
      .click();
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
      "Project changed",
    );
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Close", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: `Open ${name} unsaved`, exact: true }),
    ).toBeVisible();
  } finally {
    await context.close();
    await strangerContext.close();
  }
});
