import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApp } from "../server/app.mjs";
import {
  BillingError,
  PaymentRequiredError,
  SKUS,
  createBilling,
  createPlatformClient,
  platformConfig,
  requestKey,
  subjects,
} from "../server/platform-billing.mjs";

const ORG = { id: "org_1", name: "Personal", role: "owner" };
const PAY_BASE = "http://platform.test/pay";

// A stand-in for the platform's internal API. Prices are set here, never against
// the running service: nothing is priced for real until the owner sets prices.
function fakePlatform({ prices = {}, linked = true, charges = [] } = {}) {
  const created = [];
  const byKey = new Map();
  const store = charges.map((charge) => ({ ...charge }));
  const client = {
    prices: async () =>
      new Map(
        Object.entries(prices).map(([sku, unitPriceMicro]) => [
          sku,
          { sku, unitPriceMicro, description: "" },
        ]),
      ),
    user: async (sub) =>
      sub === "platform-user"
        ? {
            user: { id: sub, email: "owner@example.test" },
            organizations: [ORG],
          }
        : null,
    createCharge: async ({
      idempotencyKey,
      sku,
      units,
      subject,
      description,
      userId,
      organizationId,
    }) => {
      created.push({
        idempotencyKey,
        sku,
        units,
        subject,
        description,
        userId,
        organizationId,
      });
      if (byKey.has(idempotencyKey))
        return {
          free: false,
          charge: byKey.get(idempotencyKey),
          created: false,
        };
      if (!prices[sku]) return { free: true };
      const charge = {
        id: `charge_${created.length}`,
        sku,
        subject,
        description,
        amountMicro: prices[sku] * (units ?? 1),
        asset: "USDC",
        status: "open",
        expiresAt: new Date(Date.now() + 1_800_000).toISOString(),
        payUrl: `${PAY_BASE}/charge_${created.length}`,
      };
      byKey.set(idempotencyKey, charge);
      store.push(charge);
      return { free: false, charge, created: true };
    },
    charge: async (id) => store.findLast((c) => c.id === id) ?? null,
    latestChargeFor: async (subject) =>
      store.findLast((c) => c.subject === subject) ?? null,
  };
  const pool = {
    query: async (_sql, [userId]) => ({
      rows:
        linked && userId === "studio-user"
          ? [{ accountId: "platform-user" }]
          : [],
    }),
  };
  return {
    billing: createBilling({
      pool,
      client,
      accountUrl: "http://platform.test/account",
    }),
    created,
    store,
  };
}

const publish = {
  sku: SKUS.publish,
  subject: subjects.publish("p1", 3),
  description: "Publish a-site",
};

test("an unpriced action is free and needs no shared account", async () => {
  const { billing, created } = fakePlatform({ linked: false });
  assert.deepEqual(await billing.requirePaid("studio-user", publish), {
    ok: true,
    free: true,
  });
  assert.deepEqual(
    await billing.requirePaid(null, {
      sku: SKUS.generateSite,
      subject: "generate-site:anonymous:abc12345",
    }),
    { ok: true, free: true },
  );
  assert.equal(created.length, 0);
});

test("a priced action is refused with the charge's payment sheet, and is not charged twice", async () => {
  const { billing, created } = fakePlatform({
    prices: { [SKUS.publish]: 250_000 },
  });
  const refusal = await billing.requirePaid("studio-user", publish).then(
    () => null,
    (error) => error,
  );
  assert.ok(refusal instanceof PaymentRequiredError);
  assert.equal(refusal.status, 402);
  assert.equal(refusal.code, "payment_required");
  assert.equal(refusal.payUrl, `${PAY_BASE}/charge_1`);
  assert.equal(refusal.chargeId, "charge_1");
  assert.equal(refusal.amountMicro, 250_000);
  assert.equal(refusal.description, "Publish a-site");

  // The same action again replays the open charge instead of creating a second one.
  await assert.rejects(
    billing.requirePaid("studio-user", publish),
    (error) => error.chargeId === "charge_1",
  );
  assert.equal(created.length, 1);
  assert.deepEqual(created[0], {
    idempotencyKey: "publish:p1:3",
    sku: SKUS.publish,
    units: 1,
    subject: "publish:p1:3",
    description: "Publish a-site",
    userId: "platform-user",
    organizationId: "org_1",
  });
});

test("an action whose charge is paid goes ahead, and one for another subject does not", async () => {
  const paid = {
    id: "charge_paid",
    subject: subjects.publish("p1", 3),
    status: "paid",
    amountMicro: 250_000,
  };
  const { billing, created } = fakePlatform({
    prices: { [SKUS.publish]: 250_000 },
    charges: [paid],
  });
  assert.deepEqual(await billing.requirePaid("studio-user", publish), {
    ok: true,
    chargeId: "charge_paid",
  });
  assert.equal(created.length, 0);
  await assert.rejects(
    billing.requirePaid("studio-user", {
      ...publish,
      subject: subjects.publish("p1", 4),
    }),
    (error) => error instanceof PaymentRequiredError,
  );
});

test("an expired charge is replaced by a new one under a new key", async () => {
  const stale = {
    id: "charge_stale",
    subject: subjects.publish("p1", 3),
    status: "open",
    amountMicro: 250_000,
    expiresAt: new Date(Date.now() - 1000).toISOString(),
  };
  const { billing, created } = fakePlatform({
    prices: { [SKUS.publish]: 250_000 },
    charges: [stale],
  });
  await assert.rejects(
    billing.requirePaid("studio-user", publish),
    (error) => error.chargeId === "charge_1",
  );
  assert.equal(created[0].idempotencyKey, "publish:p1:3#charge_stale");
});

test("an owner without a linked shared account still gets a payment sheet, with no owner on the charge", async () => {
  const { billing, created } = fakePlatform({
    prices: { [SKUS.designApp]: 500_000 },
    linked: false,
  });
  await assert.rejects(
    billing.requirePaid("studio-user", {
      sku: SKUS.designApp,
      subject: subjects.action("design-app", "p1", "req-12345678"),
    }),
    (error) =>
      error instanceof PaymentRequiredError &&
      error.payUrl === `${PAY_BASE}/charge_1`,
  );
  assert.equal(created[0].userId, undefined);
  assert.equal(created[0].organizationId, undefined);
});

test("the header says the account is connected, and never a balance", async () => {
  assert.deepEqual(
    await fakePlatform({ linked: false }).billing.account("studio-user"),
    { connected: false, accountUrl: "http://platform.test/account" },
  );
  const account = await fakePlatform().billing.account("studio-user");
  assert.deepEqual(account, {
    connected: true,
    accountUrl: "http://platform.test/account",
    email: "owner@example.test",
    organization: "Personal",
  });
  assert.equal("balanceMicro" in account, false);
});

test("a request id from the client keys the action, and an identical retry without one keys itself", () => {
  const sent = (id) =>
    requestKey({ get: () => id, body: { prompt: "a client portal" } });
  assert.equal(
    sent("11111111-2222-3333-4444-555555555555"),
    "11111111-2222-3333-4444-555555555555",
  );
  assert.equal(sent("no"), sent(undefined));
  assert.notEqual(
    requestKey({ get: () => null, body: { prompt: "one" } }),
    requestKey({ get: () => null, body: { prompt: "two" } }),
  );
});

test("the same idempotency key replays one charge rather than creating another", async () => {
  const keys = [];
  const client = createPlatformClient({
    url: "http://platform.test",
    serviceToken: "service-token-that-is-long-enough-000",
    fetchImpl: async (url, init) => {
      keys.push({
        url,
        auth: init.headers.authorization,
        key: init.headers["idempotency-key"],
      });
      const created =
        keys.filter((call) => call.key === "publish:p1:3").length === 1;
      return new Response(
        JSON.stringify({
          charge: { id: "charge_1", status: "open", amountMicro: 250_000 },
          created,
        }),
        { status: created ? 201 : 200 },
      );
    },
  });
  const body = {
    idempotencyKey: "publish:p1:3",
    sku: SKUS.publish,
    subject: "publish:p1:3",
  };
  const first = await client.createCharge(body);
  const replay = await client.createCharge(body);
  assert.equal(first.created, true);
  assert.equal(replay.created, false);
  assert.equal(replay.charge.id, first.charge.id);
  // No payUrl in the answer, so the charge's own payment sheet on the platform is used.
  assert.equal(replay.charge.payUrl, "http://platform.test/pay/charge_1");
  assert.equal(
    keys.at(-1).auth,
    "Bearer service-token-that-is-long-enough-000",
  );
  assert.equal(keys.at(-1).key, "publish:p1:3");
});

test("an unreachable platform is a 503 and the action does not run", async () => {
  const client = createPlatformClient({
    url: "http://platform.test",
    serviceToken: "service-token-that-is-long-enough-000",
    fetchImpl: async () => {
      throw new TypeError("fetch failed");
    },
  });
  await assert.rejects(
    client.prices(),
    (error) => error instanceof BillingError && error.status === 503,
  );

  let ran = false;
  const billing = createBilling({
    pool: { query: async () => ({ rows: [] }) },
    client,
    accountUrl: "http://platform.test/account",
  });
  await assert.rejects(
    billing.requirePaid("studio-user", publish).then(() => {
      ran = true;
    }),
    (error) => error.status === 503 && error.message.includes("unavailable"),
  );
  assert.equal(ran, false);
});

test("a paid AI route answers 402 with the payment sheet and never calls the model", async (t) => {
  let called = false;
  const refuse = {
    requirePaid: async (_userId, { subject }) => {
      if (subject.endsWith("paid-request-0001")) return { ok: true };
      throw new PaymentRequiredError({
        payUrl: `${PAY_BASE}/charge_1`,
        chargeId: "charge_1",
        amountMicro: 250_000,
        asset: "USDC",
        description: "Generate a website",
      });
    },
  };
  const server = createApp({
    model: "test-model",
    billing: refuse,
    fetchImpl: async () => {
      called = true;
      return new Response(
        JSON.stringify({
          message: {
            content: JSON.stringify({
              pages: [
                {
                  name: "Home",
                  slug: "home",
                  description: "A studio that needs a simple website.",
                  sections: [
                    {
                      kind: "hero",
                      title: "A working studio",
                      body: "Visit us on the corner.",
                    },
                  ],
                },
              ],
            }),
          },
        }),
      );
    },
  }).listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise(
        (resolve) => (server.closeAllConnections(), server.close(resolve)),
      ),
  );
  const base = `http://127.0.0.1:${server.address().port}`;
  const ask = (requestId) =>
    fetch(`${base}/api/generate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-plotform-request-id": requestId,
      },
      body: JSON.stringify({
        name: "A site",
        brief: "A small studio that needs a simple website.",
      }),
    });

  const refused = await ask("needs-payment-0001");
  assert.equal(refused.status, 402);
  assert.deepEqual(await refused.json(), {
    error:
      "This action is paid for on its own. Complete the payment to continue.",
    code: "payment_required",
    payUrl: `${PAY_BASE}/charge_1`,
    chargeId: "charge_1",
    amountMicro: 250_000,
    asset: "USDC",
    description: "Generate a website",
  });
  assert.equal(called, false);

  const allowed = await ask("paid-request-0001");
  assert.equal(allowed.status, 200);
  assert.equal(called, true);
});

test("the shared account is off unless every setting is present", () => {
  assert.equal(platformConfig({ PLATFORM_URL: "http://p.test" }), null);
  assert.deepEqual(
    platformConfig({
      PLATFORM_URL: "http://p.test/",
      PLATFORM_CLIENT_ID: "id",
      PLATFORM_CLIENT_SECRET: "secret",
      PLATFORM_SERVICE_TOKEN: "token",
    }),
    {
      url: "http://p.test",
      clientId: "id",
      clientSecret: "secret",
      serviceToken: "token",
    },
  );
});
