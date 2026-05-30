/**
 * PayPal REST client.
 *
 * Sandbox vs LIVE switches on PAYPAL_MODE. All exported helpers
 * throw a `PayPalError` (which extends Error and surfaces HTTP
 * status + PayPal error code) so callers can branch on
 * `err instanceof PayPalError` without unwrapping a generic
 * Error.message.
 *
 * The OAuth access token is cached in-process and refreshed
 * ~60s before expiry to avoid burning a token round-trip on every
 * request. The cache is intentionally module-local — serverless
 * cold starts pay the OAuth cost once, then amortize across
 * subsequent invocations of the same lambda instance.
 */

const SANDBOX_BASE = "https://api-m.sandbox.paypal.com";
const LIVE_BASE = "https://api-m.paypal.com";

export function paypalBaseUrl(): string {
  return process.env.PAYPAL_MODE === "LIVE" ? LIVE_BASE : SANDBOX_BASE;
}

/** Persisted on Payment/Subscription rows at create time so the audit
 * surface can read TEST vs LIVE without inferring from approve-URL
 * hosts. Matches the spelling used by getCashfreeMode. */
export function getPaypalMode(): "TEST" | "LIVE" {
  return process.env.PAYPAL_MODE === "LIVE" ? "LIVE" : "TEST";
}

export class PayPalError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly paypalCode: string | undefined,
    message: string,
    public readonly raw?: unknown,
  ) {
    super(message);
    this.name = "PayPalError";
  }
}

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

let cached: CachedToken | null = null;

async function readErrorBody(res: Response): Promise<{ message: string; code: string | undefined; raw: unknown }> {
  const text = await res.text();
  try {
    const json = JSON.parse(text) as {
      error_description?: string;
      error?: string;
      message?: string;
      name?: string;
      details?: Array<{ description?: string }>;
    };
    const message =
      json.error_description ||
      json.message ||
      json.details?.[0]?.description ||
      json.error ||
      `HTTP ${res.status}`;
    const code = json.name || json.error;
    return { message, code, raw: json };
  } catch {
    return { message: text || `HTTP ${res.status}`, code: undefined, raw: text };
  }
}

export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cached && cached.expiresAt - 60_000 > now) {
    return cached.accessToken;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new PayPalError(
      500,
      "MISSING_ENV",
      "PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not configured",
    );
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await readErrorBody(res);
    throw new PayPalError(res.status, err.code, `OAuth token request failed: ${err.message}`, err.raw);
  }

  const body = (await res.json()) as { access_token: string; expires_in: number };
  cached = {
    accessToken: body.access_token,
    expiresAt: now + body.expires_in * 1000,
  };
  return body.access_token;
}

async function paypalFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown },
): Promise<T> {
  const token = await getAccessToken();
  const { json, headers, ...rest } = init;
  const res = await fetch(`${paypalBaseUrl()}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(headers as Record<string, string> | undefined),
    },
    body: json !== undefined ? JSON.stringify(json) : (rest.body as BodyInit | undefined),
  });

  if (!res.ok) {
    const err = await readErrorBody(res);
    throw new PayPalError(res.status, err.code, `PayPal ${path} failed: ${err.message}`, err.raw);
  }

  // 204 No Content (e.g. cancel subscription)
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

/* ============================== subscriptions ============================== */

export interface PayPalSubscription {
  id: string;
  status: "APPROVAL_PENDING" | "APPROVED" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";
  status_update_time?: string;
  plan_id: string;
  start_time?: string;
  billing_info?: {
    next_billing_time?: string;
    last_payment?: { time?: string; amount?: { value: string; currency_code: string } };
  };
  links?: Array<{ href: string; rel: string; method: string }>;
}

export interface CreateSubscriptionOpts {
  userId: string;
  /** Stored in custom_id so the webhook can map back to our Mongo doc
   * without an extra lookup. Keep ≤127 chars per PayPal limit. */
  customId: string;
  returnUrl: string;
  cancelUrl: string;
  brandName?: string;
}

export interface CreateSubscriptionResult {
  id: string;
  approveUrl: string;
  raw: PayPalSubscription;
}

export async function createSubscription(
  opts: CreateSubscriptionOpts,
): Promise<CreateSubscriptionResult> {
  const planId = process.env.PAYPAL_PLAN_ID;
  if (!planId) {
    throw new PayPalError(500, "MISSING_ENV", "PAYPAL_PLAN_ID not configured");
  }

  const body = {
    plan_id: planId,
    custom_id: opts.customId.slice(0, 127),
    application_context: {
      brand_name: opts.brandName || "Internet Keeda",
      user_action: "SUBSCRIBE_NOW",
      return_url: opts.returnUrl,
      cancel_url: opts.cancelUrl,
    },
  };

  const raw = await paypalFetch<PayPalSubscription>("/v1/billing/subscriptions", {
    method: "POST",
    json: body,
  });

  const approveLink = raw.links?.find((l) => l.rel === "approve")?.href;
  if (!approveLink) {
    throw new PayPalError(
      502,
      "NO_APPROVE_LINK",
      "PayPal subscription create returned no approve link",
      raw,
    );
  }

  return { id: raw.id, approveUrl: approveLink, raw };
}

export function getSubscription(id: string): Promise<PayPalSubscription> {
  return paypalFetch<PayPalSubscription>(`/v1/billing/subscriptions/${id}`, {
    method: "GET",
  });
}

export async function cancelSubscription(id: string, reason: string): Promise<void> {
  await paypalFetch<void>(`/v1/billing/subscriptions/${id}/cancel`, {
    method: "POST",
    json: { reason },
  });
}

/* ============================== one-time orders ============================ */

export interface PayPalOrder {
  id: string;
  status:
    | "CREATED"
    | "SAVED"
    | "APPROVED"
    | "VOIDED"
    | "COMPLETED"
    | "PAYER_ACTION_REQUIRED";
  intent: string;
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    amount?: { value: string; currency_code: string };
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: { value: string; currency_code: string };
      }>;
    };
  }>;
  links?: Array<{ href: string; rel: string; method: string }>;
}

export interface CreateOneTimeOrderOpts {
  amountUsd: number;
  description: string;
  customId: string;
  referenceId: string;
  returnUrl: string;
  cancelUrl: string;
  brandName?: string;
}

export interface CreateOneTimeOrderResult {
  id: string;
  approveUrl: string;
  raw: PayPalOrder;
}

export async function createOneTimeOrder(
  opts: CreateOneTimeOrderOpts,
): Promise<CreateOneTimeOrderResult> {
  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: opts.referenceId,
        custom_id: opts.customId.slice(0, 127),
        description: opts.description.slice(0, 127),
        amount: {
          currency_code: "USD",
          value: opts.amountUsd.toFixed(2),
        },
      },
    ],
    application_context: {
      brand_name: opts.brandName || "Internet Keeda",
      user_action: "PAY_NOW",
      shipping_preference: "NO_SHIPPING",
      return_url: opts.returnUrl,
      cancel_url: opts.cancelUrl,
    },
  };

  const raw = await paypalFetch<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    json: body,
  });

  const approveLink = raw.links?.find((l) => l.rel === "approve")?.href;
  if (!approveLink) {
    throw new PayPalError(
      502,
      "NO_APPROVE_LINK",
      "PayPal order create returned no approve link",
      raw,
    );
  }

  return { id: raw.id, approveUrl: approveLink, raw };
}

export function getOrder(id: string): Promise<PayPalOrder> {
  return paypalFetch<PayPalOrder>(`/v2/checkout/orders/${id}`, { method: "GET" });
}

export function captureOrder(id: string): Promise<PayPalOrder> {
  return paypalFetch<PayPalOrder>(`/v2/checkout/orders/${id}/capture`, {
    method: "POST",
    json: {},
  });
}

export interface PayPalRefund {
  id: string;
  status:
    | "CANCELLED"
    | "FAILED"
    | "PENDING"
    | "COMPLETED";
  amount?: { value: string; currency_code: string };
  create_time?: string;
  update_time?: string;
  links?: Array<{ href: string; rel: string; method: string }>;
}

export interface RefundCaptureOpts {
  /** PayPal capture id (purchase_units[].payments.captures[].id). NOT
   * the order id — refunds happen against captures, not orders. */
  captureId: string;
  /** Amount string like "30.00". Required for the explicit-amount form;
   * PayPal also accepts an empty body for a full refund, but always
   * sending the amount makes the audit trail self-evident. */
  amountValue: string;
  currencyCode: string;
  noteToPayer?: string;
  /** Idempotency key — PayPal honors `PayPal-Request-Id` on this
   * endpoint, so a retry against the same id returns the original
   * refund instead of double-charging. */
  requestId?: string;
}

export function refundCapture(opts: RefundCaptureOpts): Promise<PayPalRefund> {
  const headers: Record<string, string> = {};
  if (opts.requestId) headers["PayPal-Request-Id"] = opts.requestId;
  return paypalFetch<PayPalRefund>(
    `/v2/payments/captures/${opts.captureId}/refund`,
    {
      method: "POST",
      headers,
      json: {
        amount: {
          value: opts.amountValue,
          currency_code: opts.currencyCode,
        },
        note_to_payer: opts.noteToPayer || "Refund issued by Internet Keeda admin",
      },
    },
  );
}

/* ============================== webhook verify ============================= */

export interface VerifyWebhookOpts {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
  /** Parsed event body. PayPal expects the body re-serialized verbatim
   * inside the verify call, so callers should pass the parsed object —
   * not the raw string. */
  webhookEvent: unknown;
}

export async function verifyWebhookSignature(opts: VerifyWebhookOpts): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    throw new PayPalError(500, "MISSING_ENV", "PAYPAL_WEBHOOK_ID not configured");
  }

  const body = {
    auth_algo: opts.authAlgo,
    cert_url: opts.certUrl,
    transmission_id: opts.transmissionId,
    transmission_sig: opts.transmissionSig,
    transmission_time: opts.transmissionTime,
    webhook_id: webhookId,
    webhook_event: opts.webhookEvent,
  };

  const res = await paypalFetch<{ verification_status: string }>(
    "/v1/notifications/verify-webhook-signature",
    { method: "POST", json: body },
  );
  return res.verification_status === "SUCCESS";
}
