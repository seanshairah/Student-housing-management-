import { NextResponse, type NextRequest } from "next/server";
import { parsePaynowResult, verifyAndSettle } from "@/services/payments";

/**
 * Paynow server-to-server result webhook.
 *
 * SECURITY: this endpoint is unauthenticated and the POST body is attacker-
 * controllable, so we NEVER trust its `status`. We only take the `reference`
 * from it and then re-poll Paynow authoritatively (`verifyAndSettle`) to decide
 * whether the payment is really paid. A forged "status=Paid" cannot settle a
 * payment that Paynow hasn't actually confirmed.
 *
 * Accepts form-urlencoded (Paynow default) or JSON. Always returns 200 "ok"
 * so Paynow does not retry indefinitely; errors are logged, never thrown.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let body: Record<string, string> = {};

    if (contentType.includes("application/json")) {
      const json = await req.json().catch(() => ({}));
      body = normalize(json);
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        body[key] = value;
      });
    }

    const result = parsePaynowResult(body);
    if (!result.reference) {
      console.error("[paynow/result] Missing reference in payload", body);
      return new NextResponse("ok");
    }

    // Re-poll Paynow as the source of truth; ignore the POSTed status.
    await verifyAndSettle(result.reference);

    return new NextResponse("ok");
  } catch (err) {
    console.error("[paynow/result] Error handling webhook", err);
    // Never 500 — acknowledge so Paynow stops retrying.
    return new NextResponse("ok");
  }
}

function normalize(input: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (input && typeof input === "object") {
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = v == null ? "" : String(v);
    }
  }
  return out;
}
