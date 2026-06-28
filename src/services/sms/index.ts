import { prisma } from "@/lib/prisma";
import { MessageStatus } from "@prisma/client";
import { renderTemplate } from "@/lib/utils";
import { SMS_TEMPLATES } from "@/constants/messages";

export interface SmsResult {
  ok: boolean;
  provider: string;
  error?: string;
}

/**
 * Provider adapter contract. New providers (Twilio, BulkSMS, Africa's Talking,
 * etc.) implement this interface — the rest of the app never depends on a
 * specific vendor.
 */
export interface SmsProvider {
  name: string;
  isConfigured(): boolean;
  send(to: string, body: string): Promise<SmsResult>;
}

// ── BulkSMS-style HTTP adapter (placeholder, ready for real keys) ──
const bulkSmsProvider: SmsProvider = {
  name: "bulksms",
  isConfigured() {
    return Boolean(process.env.BULKSMS_API_KEY && process.env.BULKSMS_BASE_URL);
  },
  async send(to, body) {
    try {
      const res = await fetch(`${process.env.BULKSMS_BASE_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BULKSMS_API_KEY}`,
        },
        body: JSON.stringify({
          to,
          from: process.env.BULKSMS_SENDER_ID || "SHousing",
          body,
        }),
      });
      if (!res.ok) {
        return {
          ok: false,
          provider: this.name,
          error: `HTTP ${res.status}`,
        };
      }
      return { ok: true, provider: this.name };
    } catch (e) {
      return { ok: false, provider: this.name, error: (e as Error).message };
    }
  },
};

// ── Development mock provider ──────────────────────────────────
const mockProvider: SmsProvider = {
  name: "mock",
  isConfigured() {
    return true;
  },
  async send(to, body) {
    console.info(`📱 [DEV SMS] to=${to} body="${body}"`);
    return { ok: true, provider: "mock" };
  },
};

function activeProvider(): SmsProvider {
  if (bulkSmsProvider.isConfigured()) return bulkSmsProvider;
  return mockProvider;
}

/** Send a single SMS, logging the attempt. */
export async function sendSMS(to: string, body: string): Promise<SmsResult> {
  const provider = activeProvider();
  const result = await provider.send(to, body);
  await prisma.smsLog
    .create({
      data: {
        to,
        body,
        provider: result.provider,
        status: result.ok ? MessageStatus.SENT : MessageStatus.FAILED,
        error: result.error,
      },
    })
    .catch(() => undefined);
  return result;
}

/** Send the same message to many recipients. */
export async function sendBulkSMS(
  recipients: string[],
  body: string,
): Promise<{ sent: number; failed: number; results: SmsResult[] }> {
  const results: SmsResult[] = [];
  let sent = 0;
  let failed = 0;
  for (const to of recipients) {
    const r = await sendSMS(to, body);
    results.push(r);
    r.ok ? sent++ : failed++;
  }
  return { sent, failed, results };
}

/** Send a status SMS using a named template. */
export async function sendStatusSMS(
  to: string,
  template: keyof typeof SMS_TEMPLATES,
  data: Record<string, string | number>,
): Promise<SmsResult> {
  const body = renderTemplate(SMS_TEMPLATES[template], data);
  return sendSMS(to, body);
}

export function smsProviderStatus() {
  return {
    provider: activeProvider().name,
    configured: bulkSmsProvider.isConfigured(),
    mode: bulkSmsProvider.isConfigured() ? "live" : "development (mock)",
  };
}
