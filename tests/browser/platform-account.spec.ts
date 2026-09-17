import { test, expect } from "@playwright/test";

// One account across products: a Plotform owner signs in through the shared
// platform account (~/platform on 8760) and comes back signed in, with the shared
// credit balance in the header. Needs the platform running and Plotform's .env
// PLATFORM_* settings; skipped otherwise.
const PLATFORM = "http://127.0.0.1:8760";
const MAILPIT = "http://127.0.0.1:8765";

test("an owner signs in to Plotform with the shared account and sees shared credits", async ({ page, request }) => {
  const platformUp = await request.get(`${PLATFORM}/healthz`).then((r) => r.ok()).catch(() => false);
  const status = await (await request.get("/api/backend-status")).json();
  test.skip(!platformUp || !status.sharedAccount, "The platform service or Plotform's PLATFORM_* settings are not available");

  const email = `owner.${Date.now()}@example.test`;
  await page.goto("/");
  await page.getByRole("button", { name: "Account & server projects" }).click();
  await page.getByRole("button", { name: "Continue with your account" }).click();

  await page.waitForURL(`${PLATFORM}/sign-in**`);
  await expect(page.getByText("to continue to Plotform")).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Email me a code" }).click();
  await expect(page.getByLabel("Six-digit code")).toBeVisible();

  let code = "";
  await expect(async () => {
    const found = await (await request.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)).json();
    const message = await (await request.get(`${MAILPIT}/api/v1/message/${found.messages[0].ID}`)).json();
    code = /code is (\d{6})/.exec(message.Text)![1]!;
  }).toPass({ timeout: 10_000 });
  await page.getByLabel("Six-digit code").fill(code);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await page.waitForURL("http://127.0.0.1:5173/**");
  await expect(page.getByRole("link", { name: /Credits 0\.00 USDC/ })).toBeVisible({ timeout: 15_000 });
  const credits = await (await page.request.get("/api/credits")).json();
  expect(credits).toMatchObject({ enabled: true, connected: true, balanceMicro: 0, organization: { name: "Personal" } });
  await page.screenshot({ path: "/private/tmp/claude-501/-Users-achi/772ad7e0-bb04-4cdf-b09c-c5ba34dc6a58/scratchpad/shots/plotform-shared-account.png" });
});
