import crypto from "crypto";

/**
 * Paynow integration abstraction.
 *
 * In `development` mode (no real keys) this returns deterministic mock
 * responses so the full payment workflow is testable end-to-end. When real
 * PAYNOW_INTEGRATION_ID / PAYNOW_INTEGRATION_KEY are provided and
 * PAYNOW_MODE=live, the same functions talk to the real Paynow API — no
 * architectural changes required.
 */

const PAYNOW_INITIATE_URL = "https://www.paynow.co.zw/interface/initiatetransaction";
const PAYNOW_REMOTE_URL = "https://www.paynow.co.zw/interface/remotetransaction";

export interface PaynowConfig {
  integrationId: string;
  integrationKey: string;
  returnUrl: string;
  resultUrl: string;
  /**
   * When the Paynow integration is in TEST mode, Paynow rejects a request
   * unless `authemail` equals the merchant's registered email. Set
   * PAYNOW_AUTH_EMAIL to that email while testing; leave it blank in live so
   * each payer's own email is used.
   */
  authEmail: string;
  mode: "development" | "live";
}

export function getPaynowConfig(): PaynowConfig {
  return {
    integrationId: process.env.PAYNOW_INTEGRATION_ID || "",
    integrationKey: process.env.PAYNOW_INTEGRATION_KEY || "",
    returnUrl: process.env.PAYNOW_RETURN_URL || "http://localhost:3000/student/payments/return",
    resultUrl: process.env.PAYNOW_RESULT_URL || "http://localhost:3000/api/payments/paynow/result",
    authEmail: process.env.PAYNOW_AUTH_EMAIL || "",
    mode:
      process.env.PAYNOW_MODE === "live" &&
      process.env.PAYNOW_INTEGRATION_ID &&
      process.env.PAYNOW_INTEGRATION_KEY
        ? "live"
        : "development",
  };
}

export interface InitiatePaymentInput {
  reference: string;
  amount: number;
  email: string;
  description: string;
}

export interface InitiatePaymentResult {
  ok: boolean;
  redirectUrl?: string;
  pollUrl?: string;
  providerRef?: string;
  error?: string;
  mode: "development" | "live";
}

// Paynow signs requests with a SHA512 hash of concatenated values + key.
function paynowHash(values: Record<string, string>, key: string): string {
  const concat = Object.values(values).join("") + key;
  return crypto.createHash("sha512").update(concat).digest("hex").toUpperCase();
}

function toUrlEncoded(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
}

function parsePaynowResponse(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  // Paynow returns URL-encoded key=value pairs separated by "&" (its API
  // format); some endpoints use newlines. Split on both so parsing is robust —
  // otherwise a whole response collapses into the first key and every call
  // looks "declined".
  for (const pair of text.split(/[&\r\n]+/)) {
    const idx = pair.indexOf("=");
    if (idx < 0) continue;
    const key = pair.slice(0, idx).trim().toLowerCase();
    if (!key) continue;
    const raw = pair.slice(idx + 1).trim().replace(/\+/g, " ");
    try {
      out[key] = decodeURIComponent(raw);
    } catch {
      out[key] = raw;
    }
  }
  return out;
}

/** Create a Paynow payment (or a mock one in development). */
export async function createPaynowPayment(
  input: InitiatePaymentInput,
): Promise<InitiatePaymentResult> {
  const config = getPaynowConfig();

  if (config.mode === "development") {
    // Mock: route the user to our own simulated checkout page.
    const redirectUrl = `${process.env.APP_URL || "http://localhost:3000"}/student/payments/checkout?ref=${encodeURIComponent(
      input.reference,
    )}`;
    return {
      ok: true,
      mode: "development",
      redirectUrl,
      pollUrl: `mock://poll/${input.reference}`,
      providerRef: `MOCK-${input.reference}`,
    };
  }

  try {
    const returnUrl = `${config.returnUrl}${config.returnUrl.includes("?") ? "&" : "?"}ref=${encodeURIComponent(input.reference)}`;
    const values: Record<string, string> = {
      id: config.integrationId,
      reference: input.reference,
      amount: input.amount.toFixed(2),
      additionalinfo: input.description,
      returnurl: returnUrl,
      resulturl: config.resultUrl,
      authemail: config.authEmail || input.email,
      status: "Message",
    };
    values.hash = paynowHash(values, config.integrationKey);

    const res = await fetch(PAYNOW_INITIATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: toUrlEncoded(values),
    });
    const parsed = parsePaynowResponse(await res.text());

    if (parsed.status?.toLowerCase() === "ok") {
      return {
        ok: true,
        mode: "live",
        redirectUrl: parsed.browserurl,
        pollUrl: parsed.pollurl,
        providerRef: parsed.paynowreference,
      };
    }
    return { ok: false, mode: "live", error: parsed.error || "Paynow error" };
  } catch (e) {
    return { ok: false, mode: "live", error: (e as Error).message };
  }
}

// ── Express Checkout (mobile money — EcoCash / OneMoney) ──────────
export type MobileMethod = "ecocash" | "onemoney";

export interface InitiateMobileInput {
  reference: string;
  amount: number;
  email: string;
  phone: string; // the payer's mobile number
  method: MobileMethod;
  description: string;
}

export interface InitiateMobileResult {
  ok: boolean;
  pollUrl?: string;
  instructions?: string; // shown to the payer ("check your phone…")
  providerRef?: string;
  error?: string;
  mode: "development" | "live";
  status?: "sent" | "error";
}

/** Normalise a mobile number to the local 07xxxxxxxx format Paynow expects. */
export function toPaynowPhone(phone: string): string {
  let p = (phone || "").replace(/[^\d]/g, "");
  if (p.startsWith("00")) p = p.slice(2);
  if (p.startsWith("263")) p = "0" + p.slice(3);
  else if (p.startsWith("7") && p.length === 9) p = "0" + p;
  return p;
}

/**
 * Initiate an EcoCash / OneMoney "Express Checkout" payment. This asks Paynow
 * to push a USSD prompt to the payer's phone (they approve with their PIN) —
 * no browser redirect. Poll the returned pollUrl to see when it's paid.
 */
export async function createPaynowMobilePayment(
  input: InitiateMobileInput,
): Promise<InitiateMobileResult> {
  const config = getPaynowConfig();
  const phone = toPaynowPhone(input.phone);

  if (config.mode === "development") {
    return {
      ok: true,
      mode: "development",
      pollUrl: `mock://poll/${input.reference}`,
      providerRef: `MOCK-${input.reference}`,
      status: "sent",
      instructions: `Test mode: a real ${input.method === "ecocash" ? "EcoCash" : "OneMoney"} prompt would be sent to ${phone}. This will auto-confirm shortly.`,
    };
  }

  try {
    const values: Record<string, string> = {
      id: config.integrationId,
      reference: input.reference,
      amount: input.amount.toFixed(2),
      additionalinfo: input.description,
      returnurl: config.returnUrl,
      resulturl: config.resultUrl,
      authemail: config.authEmail || input.email,
      phone,
      method: input.method,
      status: "Message",
    };
    values.hash = paynowHash(values, config.integrationKey);

    const res = await fetch(PAYNOW_REMOTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: toUrlEncoded(values),
    });
    const parsed = parsePaynowResponse(await res.text());

    if (parsed.status?.toLowerCase() === "ok") {
      return {
        ok: true,
        mode: "live",
        pollUrl: parsed.pollurl,
        instructions:
          parsed.instructions ||
          "Check your phone and enter your PIN to approve the payment.",
        providerRef: parsed.paynowreference,
        status: "sent",
      };
    }
    return {
      ok: false,
      mode: "live",
      status: "error",
      error:
        parsed.error ||
        "Paynow declined this mobile payment. Confirm the number and that your account supports this method.",
    };
  } catch (e) {
    return { ok: false, mode: "live", status: "error", error: (e as Error).message };
  }
}

export interface VerifyResult {
  paid: boolean;
  status: string;
  raw?: Record<string, string>;
}

/**
 * Paynow statuses that mean the money has actually been received by the
 * merchant. "Paid" is the immediate confirmation; "Awaiting Delivery" and
 * "Delivered" are later fulfilment states that still imply the funds cleared.
 * We deliberately do NOT include initiated ("Created"/"Sent") or any
 * negative/reversal state, so a payment is only ever marked paid when Paynow
 * has genuinely confirmed the funds.
 */
const PAID_STATUSES = new Set(["paid", "awaiting delivery", "delivered"]);

/** True when Paynow reports a status that means the funds were received. */
export function isPaynowPaidStatus(status: string | undefined | null): boolean {
  return PAID_STATUSES.has((status || "").trim().toLowerCase());
}

/** Poll Paynow (or simulate) to verify payment status. */
export async function verifyPaynowPayment(
  pollUrl: string,
): Promise<VerifyResult> {
  const config = getPaynowConfig();
  if (config.mode === "development" || pollUrl.startsWith("mock://")) {
    return { paid: true, status: "Paid" };
  }
  try {
    const res = await fetch(pollUrl);
    const parsed = parsePaynowResponse(await res.text());
    return {
      paid: isPaynowPaidStatus(parsed.status),
      status: parsed.status || "Unknown",
      raw: parsed,
    };
  } catch (e) {
    return { paid: false, status: `Error: ${(e as Error).message}` };
  }
}

/** Parse a Paynow server-to-server result webhook payload. */
export function parsePaynowResult(
  body: Record<string, string>,
): { reference: string; paid: boolean; status: string } {
  return {
    reference: body.reference || "",
    paid: isPaynowPaidStatus(body.status),
    status: body.status || "Unknown",
  };
}

export function paynowProviderStatus() {
  const config = getPaynowConfig();
  return {
    mode: config.mode,
    configured: Boolean(config.integrationId && config.integrationKey),
  };
}
