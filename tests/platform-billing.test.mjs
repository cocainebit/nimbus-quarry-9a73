import test from "node:test";
import assert from "node:assert/strict";
import { BillingError, SKUS, createBilling, createPlatformClient, platformConfig } from "../server/platform-billing.mjs";

const ORG = { id: "org_1", name: "Personal", role: "owner" };

function fakePlatform({ prices = {}, linked = true, balance = 0 } = {}) {
  const debits = [];
  const seen = new Map();
  const client = {
    prices: async () => new Map(Object.entries(prices).map(([sku, unitPriceMicro]) => [sku, { sku, unitPriceMicro, description: "" }])),
    user: async (sub) => (sub === "platform-user" ? { user: { id: sub }, organizations: [ORG] } : null),
    balance: async () => balance,
    debit: async ({ idempotencyKey, organizationId, sku, units }) => {
      debits.push({ idempotencyKey, organizationId, sku, units });
      if (seen.has(idempotencyKey)) return { status: 200, outcome: { status: "replayed", ...seen.get(idempotencyKey) } };
      const cost = prices[sku] * units;
      if (balance < cost) return { status: 402, outcome: { status: "insufficient_funds" } };
      balance -= cost;
      const result = { amountMicro: cost, balanceAfterMicro: balance };
      seen.set(idempotencyKey, result);
      return { status: 200, outcome: { status: "applied", ...result } };
    },
  };
  const pool = { query: async (_sql, [userId]) => ({ rows: linked && userId === "studio-user" ? [{ accountId: "platform-user" }] : [] }) };
  return { billing: createBilling({ pool, client, accountUrl: "http://platform.test/account" }), debits };
}

test("unpriced actions are free and need no shared account", async () => {
  const { billing, debits } = fakePlatform({ linked: false });
  await billing.ensureCanPay("studio-user", SKUS.publish);
  assert.deepEqual(await billing.charge("studio-user", SKUS.publish), { charged: false });
  await billing.ensureCanPay(null, SKUS.generateSite);
  assert.equal(debits.length, 0);
});

test("a priced action needs a linked shared account", async () => {
  const { billing } = fakePlatform({ prices: { [SKUS.publish]: 100_000 }, linked: false });
  await assert.rejects(billing.ensureCanPay("studio-user", SKUS.publish), (e) => e instanceof BillingError && e.status === 402 && e.code === "account_required" && e.accountUrl === "http://platform.test/account");
  await assert.rejects(billing.charge("studio-user", SKUS.publish), (e) => e.code === "account_required");
});

test("a priced action refuses when the balance is short and charges once per key when it is not", async () => {
  const poor = fakePlatform({ prices: { [SKUS.designApp]: 500_000 }, balance: 100_000 });
  await assert.rejects(poor.billing.ensureCanPay("studio-user", SKUS.designApp), (e) => e.code === "insufficient_funds");
  await assert.rejects(poor.billing.charge("studio-user", SKUS.designApp), (e) => e.code === "insufficient_funds");

  const { billing, debits } = fakePlatform({ prices: { [SKUS.publish]: 250_000 }, balance: 1_000_000 });
  await billing.ensureCanPay("studio-user", SKUS.publish);
  assert.deepEqual(await billing.charge("studio-user", SKUS.publish, { idempotencyKey: "publish:p1:3" }), { charged: true, amountMicro: 250_000, balanceAfterMicro: 750_000 });
  assert.equal((await billing.charge("studio-user", SKUS.publish, { idempotencyKey: "publish:p1:3" })).charged, false);
  assert.deepEqual(debits.map((d) => [d.organizationId, d.sku, d.idempotencyKey]), [
    ["org_1", SKUS.publish, "publish:p1:3"],
    ["org_1", SKUS.publish, "publish:p1:3"],
  ]);
});

test("the summary says whether credits are connected and lists only this product's priced SKUs", async () => {
  assert.deepEqual(await fakePlatform({ linked: false }).billing.summary("studio-user"), { connected: false, accountUrl: "http://platform.test/account" });
  const summary = await fakePlatform({ prices: { [SKUS.publish]: 250_000, "cubicle.minute.cpu2-mem4": 3334 }, balance: 42 }).billing.summary("studio-user");
  assert.equal(summary.connected, true);
  assert.equal(summary.balanceMicro, 42);
  assert.deepEqual(summary.prices.map((p) => p.sku), [SKUS.publish]);
});

test("the platform client reports an unreachable service as 503 and sends the service token", async () => {
  const calls = [];
  const client = createPlatformClient({
    url: "http://platform.test",
    serviceToken: "service-token-that-is-long-enough-000",
    fetchImpl: async (url, init) => {
      calls.push({ url, auth: init.headers.authorization, key: init.headers["idempotency-key"] });
      if (url.endsWith("/usage")) return new Response(JSON.stringify({ status: "applied" }), { status: 200 });
      throw new TypeError("fetch failed");
    },
  });
  await assert.rejects(client.balance("org_1"), (e) => e instanceof BillingError && e.status === 503);
  assert.equal((await client.debit({ idempotencyKey: "k1", organizationId: "org_1", sku: SKUS.publish })).status, 200);
  assert.equal(calls.at(-1).auth, "Bearer service-token-that-is-long-enough-000");
  assert.equal(calls.at(-1).key, "k1");
});

test("the shared account is off unless every setting is present", () => {
  assert.equal(platformConfig({ PLATFORM_URL: "http://p.test" }), null);
  assert.deepEqual(
    platformConfig({ PLATFORM_URL: "http://p.test/", PLATFORM_CLIENT_ID: "id", PLATFORM_CLIENT_SECRET: "secret", PLATFORM_SERVICE_TOKEN: "token" }),
    { url: "http://p.test", clientId: "id", clientSecret: "secret", serviceToken: "token" },
  );
});
