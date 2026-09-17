// Connects Plotform to the shared platform service (~/platform): one account and
// one credit balance across products. Owners sign in through the platform (OIDC,
// configured in auth.mjs); this module reads their balance and charges paid actions.
//
// Prices are owned by the platform's catalog. A SKU with no price is free, so
// nothing is charged until the owner sets a price with `pnpm admin price set`.
import { randomUUID } from "node:crypto";

export const SKUS = {
  generateSite: "plotform.ai.generate-site",
  refineSection: "plotform.ai.refine",
  designApp: "plotform.ai.design-app",
  backendDraft: "plotform.ai.backend-draft",
  publish: "plotform.publish",
};

export function platformConfig(env = process.env) {
  const url = env.PLATFORM_URL?.replace(/\/+$/, "");
  const complete = Boolean(url && env.PLATFORM_CLIENT_ID && env.PLATFORM_CLIENT_SECRET && env.PLATFORM_SERVICE_TOKEN);
  return complete
    ? { url, clientId: env.PLATFORM_CLIENT_ID, clientSecret: env.PLATFORM_CLIENT_SECRET, serviceToken: env.PLATFORM_SERVICE_TOKEN }
    : null;
}

export class BillingError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    Object.assign(this, extra);
  }
}

/** Server-to-server client for the platform's internal API. */
export function createPlatformClient({ url, serviceToken, fetchImpl = fetch, timeoutMs = 5000 }) {
  async function call(path, init = {}) {
    let response;
    try {
      response = await fetchImpl(url + path, {
        ...init,
        headers: { authorization: `Bearer ${serviceToken}`, "content-type": "application/json", ...(init.headers || {}) },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new BillingError(503, "Credits are unavailable right now. Try again shortly.");
    }
    const body = await response.json().catch(() => null);
    return { status: response.status, body };
  }
  return {
    async prices() {
      const { status, body } = await call("/internal/v1/prices");
      if (status !== 200) throw new BillingError(503, "Credits are unavailable right now. Try again shortly.");
      return new Map(body.prices.map((price) => [price.sku, price]));
    },
    async user(sub) {
      const { status, body } = await call(`/internal/v1/users/${encodeURIComponent(sub)}`);
      if (status === 404) return null;
      if (status !== 200) throw new BillingError(503, "Credits are unavailable right now. Try again shortly.");
      return body;
    },
    async balance(organizationId) {
      const { status, body } = await call(`/internal/v1/orgs/${encodeURIComponent(organizationId)}/balance`);
      if (status !== 200) throw new BillingError(503, "Credits are unavailable right now. Try again shortly.");
      return body.balanceMicro;
    },
    async debit({ idempotencyKey, organizationId, sku, units = 1 }) {
      const { status, body } = await call("/internal/v1/usage", {
        method: "POST",
        headers: { "idempotency-key": idempotencyKey },
        body: JSON.stringify({ organizationId, sku, units }),
      });
      return { status, outcome: body };
    },
  };
}

/**
 * Billing for signed-in studio owners. Everything reads the platform through
 * `client`; prices are cached briefly because they change rarely.
 */
export function createBilling({ pool, client, accountUrl, pricesTtlMs = 30_000, now = Date.now }) {
  let cachedPrices = null;
  let pricesAt = 0;
  async function prices() {
    if (!cachedPrices || now() - pricesAt > pricesTtlMs) {
      cachedPrices = await client.prices();
      pricesAt = now();
    }
    return cachedPrices;
  }

  /** The platform user linked to a studio user, from better-auth's account table. */
  async function platformSub(studioUserId) {
    const { rows } = await pool.query(`SELECT "accountId" FROM studio_account WHERE "userId"=$1 AND "providerId"='platform' LIMIT 1`, [studioUserId]);
    return rows[0]?.accountId ?? null;
  }

  /** The organization whose credits pay for this owner's actions: their personal (owner) organization. */
  async function organizationFor(studioUserId) {
    const sub = await platformSub(studioUserId);
    if (!sub) return null;
    const user = await client.user(sub);
    const organization = user?.organizations?.find((org) => org.role === "owner") ?? user?.organizations?.[0];
    return organization ? { sub, organization } : null;
  }

  return {
    accountUrl,
    /** What the dashboard shows. Never throws for a missing link; says what to do instead. */
    async summary(studioUserId) {
      const linked = await organizationFor(studioUserId);
      if (!linked) return { connected: false, accountUrl };
      const [balanceMicro, catalog] = await Promise.all([client.balance(linked.organization.id), prices()]);
      return {
        connected: true,
        accountUrl,
        organization: { id: linked.organization.id, name: linked.organization.name },
        balanceMicro,
        prices: Object.values(SKUS)
          .filter((sku) => catalog.has(sku))
          .map((sku) => ({ sku, unitPriceMicro: catalog.get(sku).unitPriceMicro, description: catalog.get(sku).description })),
      };
    },

    /**
     * Refuses up front when a priced action cannot be paid: no shared account, or a
     * balance below the price. Used before slow work (AI calls) that is charged only
     * after it succeeds, so a failed generation costs nothing.
     */
    async ensureCanPay(studioUserId, sku, units = 1) {
      const catalog = await prices();
      if (!catalog.has(sku)) return;
      const linked = await organizationFor(studioUserId);
      if (!linked)
        throw new BillingError(402, "This action uses credits. Sign in with your shared account to use them.", { code: "account_required", accountUrl });
      const cost = catalog.get(sku).unitPriceMicro * units;
      if ((await client.balance(linked.organization.id)) < cost)
        throw new BillingError(402, "Not enough credits for this action. Add credits in your account, then try again.", { code: "insufficient_funds", accountUrl });
    },

    /**
     * Charges a paid action for a studio owner. An unpriced SKU is free and returns
     * without charging. Throws BillingError(402) when the owner has no shared account
     * or not enough credit, so callers refuse before doing the work.
     */
    async charge(studioUserId, sku, { idempotencyKey = randomUUID(), units = 1 } = {}) {
      const catalog = await prices();
      if (!catalog.has(sku)) return { charged: false };
      const linked = await organizationFor(studioUserId);
      if (!linked)
        throw new BillingError(402, "This action uses credits. Sign in with your shared account to use them.", { code: "account_required", accountUrl });
      const { status, outcome } = await client.debit({ idempotencyKey, organizationId: linked.organization.id, sku, units });
      if (status === 200) return { charged: outcome.status === "applied", amountMicro: outcome.amountMicro, balanceAfterMicro: outcome.balanceAfterMicro };
      if (status === 402)
        throw new BillingError(402, "Not enough credits for this action. Add credits in your account, then try again.", { code: "insufficient_funds", accountUrl });
      if (status === 422) return { charged: false };
      throw new BillingError(503, "Credits are unavailable right now. Try again shortly.");
    },
  };
}
