import { test, expect } from "@playwright/test";

// One account across products: a Plotform owner signs in through the shared
// platform account (~/platform on 8760) and comes back signed in, with that
// account named in the header. Needs the platform running and Plotform's .env
// PLATFORM_* settings; skipped otherwise.
//
// Paying for an action is not tested here: a real payment needs a funded wallet
// on a real network. The end to end payment test lives with the platform.
const PLATFORM = "http://127.0.0.1:8760";
const MAILPIT = "http://127.0.0.1:8765";

test("an owner signs in to Plotform with the shared account and sees it in the header", async ({ page, request }) => {
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
  const chip = page.getByRole("link", { name: /Shared account/ });
  await expect(chip).toBeVisible({ timeout: 15_000 });
  await expect(chip).toContainText(email);
  const account = await (await page.request.get("/api/shared-account")).json();
  expect(account).toMatchObject({ enabled: true, connected: true, email, organization: "Personal" });
  // No balance is shown anywhere: each paid action is paid for on its own.
  expect(JSON.stringify(account)).not.toContain("balance");
  await page.screenshot({ path: "/private/tmp/claude-501/-Users-achi/772ad7e0-bb04-4cdf-b09c-c5ba34dc6a58/scratchpad/shots/plotform-shared-account.png" });
});

// The payment prompt itself, driven with a stubbed charge and a stubbed payment
// window: no money moves and no price is set on the platform. It covers the ways
// a payment does not complete, which a real payment test cannot reach on demand.
test("the payment prompt follows one charge, and offers a new one when the payment does not complete", async ({ page }) => {
  let status = "open";
  await page.route("**/api/charges/charge_test", (route) =>
    route.fulfill({
      json: {
        id: "charge_test",
        status,
        amountMicro: 2_500_000,
        asset: "USDC",
        description: "Publish a-site",
        expired: status === "expired",
      },
    }),
  );
  await page.goto("/");
  await page.evaluate(() => {
    // The payment sheet is never really opened.
    (window as any).__sheet = { closed: false, focus() {}, close() {} };
    (window as any).__openedWith = [];
    window.open = ((url: string) => {
      (window as any).__openedWith.push(url);
      return (window as any).__sheet;
    }) as any;
  });
  const outcome = page.evaluate(async () => {
    const module = await import("/src/PaymentPrompt.tsx");
    return module.payForAction({
      payUrl: "http://127.0.0.1:8760/pay/charge_test",
      chargeId: "charge_test",
      amountMicro: 2_500_000,
      asset: "USDC",
      description: "Publish a-site",
    });
  });

  const prompt = page.getByRole("dialog", { name: "Pay for this action" });
  await expect(prompt).toBeVisible();
  await expect(prompt).toContainText("Publish a-site");
  await expect(prompt).toContainText("2.50 USDC");
  expect(await page.evaluate(() => (window as any).__openedWith)).toEqual([
    "http://127.0.0.1:8760/pay/charge_test",
  ]);

  // The payment window is closed without paying.
  await page.evaluate(() => ((window as any).__sheet.closed = true));
  await expect(prompt).toContainText("closed before the payment was complete");

  // Then the charge expires, and trying again asks for a new one.
  status = "expired";
  await expect(prompt).toContainText("expired before it was paid");
  await prompt.getByRole("button", { name: "Try again" }).click();
  expect(await outcome).toBe("again");
  await expect(prompt).toBeHidden();
});

test("the payment prompt continues by itself once the charge is paid", async ({ page }) => {
  await page.route("**/api/charges/charge_paid", (route) =>
    route.fulfill({
      json: { id: "charge_paid", status: "paid", amountMicro: 1_000_000, asset: "USDC", description: "Generate a website" },
    }),
  );
  await page.goto("/");
  await page.evaluate(() => {
    window.open = (() => ({ closed: false, focus() {}, close() {} })) as any;
  });
  const outcome = page.evaluate(async () => {
    const module = await import("/src/PaymentPrompt.tsx");
    return module.payForAction({
      payUrl: "http://127.0.0.1:8760/pay/charge_paid",
      chargeId: "charge_paid",
      amountMicro: 1_000_000,
      asset: "USDC",
      description: "Generate a website",
    });
  });
  await expect(page.getByRole("dialog", { name: "Pay for this action" })).toContainText("Paid. Continuing");
  expect(await outcome).toBe("paid");
});
