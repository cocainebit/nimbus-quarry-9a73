// Connects Plotform to the shared platform service (~/platform): one account
// across products, and one payment per paid action. Nothing is stored up and
// nothing carries between products. When someone does something that costs
// money, Plotform asks the platform for a charge, answers its own client with
// 402 and the charge's payment sheet, and does the work only once that charge
// is paid.
//
// Prices belong to the platform's catalog. A SKU with no price is free, so an
// action stays exactly as it was until the owner sets a price for it.
import { createHash } from "node:crypto";

/** This product's name in the platform's charge records. */
export const SERVICE = "plotform";

export const SKUS = {
  generateSite: "plotform.ai.generate-site",
  refineSection: "plotform.ai.refine",
  designApp: "plotform.ai.design-app",
  backendDraft: "plotform.ai.backend-draft",
  publish: "plotform.publish",
};

/**
 * A subject names the action a payment belongs to. A retried request builds the
 * same subject, finds the payment already made for it, and is never charged a
 * second time. Publishing is keyed by project revision; an AI action is keyed by
 * the request id the client sends and reuses on retry.
 */
export const subjects = {
  publish: (projectId, revision) => `publish:${projectId}:${revision}`,
  action: (name, scope, key) => `${name}:${scope}:${key}`,
};

/**
 * The request id a client sends with a paid action, or a digest of the request
 * itself when it sends none, which is just as stable across a retry.
 */
export function requestKey(req) {
  const sent = req.get?.("x-plotform-request-id");
  if (sent && /^[A-Za-z0-9_.:-]{8,100}$/.test(sent)) return sent;
  return createHash("sha256")
    .update(JSON.stringify(req?.body ?? null))
    .digest("hex")
    .slice(0, 32);
}

export function platformConfig(env = process.env) {
  const url = env.PLATFORM_URL?.replace(/\/+$/, "");
  const complete = Boolean(
    url &&
    env.PLATFORM_CLIENT_ID &&
    env.PLATFORM_CLIENT_SECRET &&
    env.PLATFORM_SERVICE_TOKEN,
  );
  return complete
    ? {
        url,
        clientId: env.PLATFORM_CLIENT_ID,
        clientSecret: env.PLATFORM_CLIENT_SECRET,
        serviceToken: env.PLATFORM_SERVICE_TOKEN,
      }
    : null;
}

export class BillingError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    Object.assign(this, extra);
  }
}

/** Thrown before the work happens, so the caller can answer 402 with the payment sheet. */
export class PaymentRequiredError extends BillingError {
  constructor({
    payUrl,
    chargeId,
    amountMicro,
    asset,
    description,
    expiresAt,
  }) {
    super(
      402,
      "This action is paid for on its own. Complete the payment to continue.",
      {
        code: "payment_required",
        payUrl,
        chargeId,
        amountMicro,
        asset,
        description,
        expiresAt,
      },
    );
  }
}

const UNAVAILABLE = "Payments are unavailable right now. Try again shortly.";

/**
 * Server-to-server client for the platform's internal API (SPEC.md v0.2).
 *
 * The contract names the charge fields but not the envelope the read routes wrap
 * them in, so both a bare charge and `{ charge }` or `{ charges: [...] }` are
 * accepted. `payUrl` comes back from the create route; for a charge read back
 * later it is the platform's own payment sheet for that charge id.
 */
export function createPlatformClient({
  url,
  serviceToken,
  fetchImpl = fetch,
  timeoutMs = 5000,
}) {
  async function call(path, init = {}) {
    let response;
    try {
      response = await fetchImpl(url + path, {
        ...init,
        headers: {
          authorization: `Bearer ${serviceToken}`,
          "content-type": "application/json",
          ...(init.headers || {}),
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new BillingError(503, UNAVAILABLE);
    }
    const body = await response.json().catch(() => null);
    return { status: response.status, body };
  }
  const unwrap = (body) => {
    const charge =
      body?.charge ??
      (Array.isArray(body?.charges) ? (body.charges[0] ?? null) : null) ??
      (body?.id ? body : null);
    return charge
      ? {
          ...charge,
          payUrl: body?.payUrl ?? charge.payUrl ?? `${url}/pay/${charge.id}`,
        }
      : null;
  };
  return {
    async prices() {
      const { status, body } = await call("/internal/v1/prices");
      if (status !== 200) throw new BillingError(503, UNAVAILABLE);
      return new Map((body?.prices ?? []).map((price) => [price.sku, price]));
    },
    async user(sub) {
      const { status, body } = await call(
        `/internal/v1/users/${encodeURIComponent(sub)}`,
      );
      if (status === 404) return null;
      if (status !== 200) throw new BillingError(503, UNAVAILABLE);
      return body;
    },
    /** Create or replay a charge. The same idempotency key always returns the same charge. */
    async createCharge({
      idempotencyKey,
      sku,
      units = 1,
      subject,
      description,
      userId,
      organizationId,
    }) {
      const { status, body } = await call("/internal/v1/charges", {
        method: "POST",
        headers: { "idempotency-key": idempotencyKey },
        body: JSON.stringify({
          sku,
          units,
          subject,
          description,
          userId,
          organizationId,
        }),
      });
      if (status === 200 || status === 201) {
        if (body?.free) return { free: true };
        const charge = unwrap(body);
        if (!charge) throw new BillingError(503, UNAVAILABLE);
        return { free: false, charge, created: body?.created !== false };
      }
      // An unknown SKU has no price, so the action is free.
      if (status === 422 || body?.error?.code === "unknown_sku")
        return { free: true };
      throw new BillingError(503, UNAVAILABLE);
    },
    async charge(id) {
      const { status, body } = await call(
        `/internal/v1/charges/${encodeURIComponent(id)}`,
      );
      if (status === 404) return null;
      if (status !== 200) throw new BillingError(503, UNAVAILABLE);
      return unwrap(body);
    },
    /** The latest charge for one of this product's subjects, so a retry finds the payment already made. */
    async latestChargeFor(subject) {
      const { status, body } = await call(
        `/internal/v1/charges?service=${SERVICE}&subject=${encodeURIComponent(subject)}`,
      );
      if (status === 404) return null;
      if (status !== 200) throw new BillingError(503, UNAVAILABLE);
      return unwrap(body);
    },
  };
}

/**
 * Payment checks for studio owners. Everything reads the platform through
 * `client`; prices are cached briefly because they change rarely, and an unpriced
 * SKU never reaches the platform at all.
 */
export function createBilling({
  pool,
  client,
  accountUrl,
  pricesTtlMs = 30_000,
  now = Date.now,
}) {
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
    if (!studioUserId) return null;
    const { rows } = await pool.query(
      `SELECT "accountId" FROM studio_account WHERE "userId"=$1 AND "providerId"='platform' LIMIT 1`,
      [studioUserId],
    );
    return rows[0]?.accountId ?? null;
  }

  /**
   * Who the charge is recorded against. An owner who signed in with the shared
   * account gets it on their own account and personal organization; anyone else
   * still sees the same payment sheet, the charge simply carries no owner.
   */
  async function payerFor(studioUserId) {
    const sub = await platformSub(studioUserId);
    if (!sub) return {};
    const linked = await client.user(sub).catch(() => null);
    const organization =
      linked?.organizations?.find((org) => org.role === "owner") ??
      linked?.organizations?.[0];
    return { userId: sub, organizationId: organization?.id };
  }

  const expired = (charge) =>
    charge.status === "expired" ||
    (charge.expiresAt ? Date.parse(charge.expiresAt) <= now() : false);
  const payable = (charge) =>
    Boolean(charge) &&
    (charge.status === "open" || charge.status === "settlement_pending") &&
    !expired(charge);
  const required = (charge, description) =>
    new PaymentRequiredError({
      payUrl: charge.payUrl,
      chargeId: charge.id,
      amountMicro: charge.amountMicro,
      asset: charge.asset,
      description: charge.description ?? description,
      expiresAt: charge.expiresAt,
    });

  return {
    accountUrl,

    /** What the header shows: whether this owner signed in with the shared account. No balance exists. */
    async account(studioUserId) {
      const sub = await platformSub(studioUserId);
      if (!sub) return { connected: false, accountUrl };
      const linked = await client.user(sub).catch(() => null);
      return {
        connected: true,
        accountUrl,
        email: linked?.user?.email ?? null,
        organization: linked?.organizations?.[0]?.name ?? null,
      };
    },

    /** The charge the browser polls while the payment sheet is open. */
    async chargeStatus(chargeId) {
      const charge = await client.charge(chargeId);
      if (!charge) return null;
      return {
        id: charge.id,
        status: charge.status,
        amountMicro: charge.amountMicro,
        asset: charge.asset,
        description: charge.description,
        expiresAt: charge.expiresAt,
        failureReason: charge.failureReason ?? null,
        payUrl: charge.payUrl,
        expired: charge.status !== "paid" && expired(charge),
      };
    },

    /**
     * The one check every paid action makes, before it does any work.
     *
     * Free when the SKU has no price, and done when this subject has already been
     * paid for, so a retried request continues instead of paying twice. Otherwise
     * it creates or replays the subject's charge and throws PaymentRequiredError,
     * which the route answers as 402 with the payment sheet. A charge that
     * expired or failed is replaced by a new one, keyed so that two clicks still
     * produce a single charge.
     */
    async requirePaid(studioUserId, { sku, subject, description, units = 1 }) {
      const catalog = await prices();
      if (!catalog.has(sku)) return { ok: true, free: true };

      const existing = await client.latestChargeFor(subject);
      if (existing?.status === "paid")
        return { ok: true, chargeId: existing.id };
      if (payable(existing)) throw required(existing, description);

      const key = (existing ? `${subject}#${existing.id}` : subject).slice(
        0,
        200,
      );
      const result = await client.createCharge({
        idempotencyKey: key,
        sku,
        units,
        subject,
        description,
        ...(await payerFor(studioUserId)),
      });
      if (result.free) return { ok: true, free: true };
      if (result.charge.status === "paid")
        return { ok: true, chargeId: result.charge.id };
      throw required(result.charge, description);
    },
  };
}
