import type { PlatformConfig } from "@/core/platform/types";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  BLESSBRI PROPERTIES — platform configuration
 *  (Mufudzi House and Siphiwe House)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * This file is the ONLY thing that differs between the two housing platforms
 * that run on this operating system. Everything under `src/core/` is shared and
 * byte-identical across both repositories; if you find yourself about to fork a
 * file in `src/core/`, add a setting here instead.
 *
 * The public marketing site (src/app/page.tsx, /houses, /about and
 * src/components/marketing/**) is deliberately NOT driven by this file — each
 * platform keeps its own independent brand, copy and imagery.
 */
export const platformConfig: PlatformConfig = {
  key: "blessbri",
  name: "Blessbri Properties",
  legalName: "Blessbri Properties",
  tagline: "Comfortable, secure student housing at Mufudzi and Siphiwe House.",

  appUrl: process.env.APP_URL ?? "http://localhost:3000",

  contact: {
    email: "info@blessbriproperties.co.zw",
    phone: "+263 77 000 0000",
    address: "Zimbabwe",
  },

  senders: {
    emailFrom:
      process.env.RESEND_FROM_EMAIL ??
      process.env.EMAIL_FROM ??
      "Blessbri Properties <notifications@blessbriproperties.co.zw>",
    smsSenderId: process.env.SMSPOP_SENDER_ID ?? "BlessProps",
  },

  billing: {
    currency: "USD",
    semesterMonths: 4,
    transportMonthlyFee: 15,
    // Confirmed sharing-tier rates. The single-room rate is not yet fixed, so
    // rooms of that type fall back to their own `price` column, which the owner
    // sets per room.
    rentByRoomType: {
      SHARED_DOUBLE: 120,
      SHARED_TRIPLE: 90,
    },
    defaultMonthlyRent: 120,
    paymentTermsDays: 7,
    allowPartialPayments: true,
    allowCombinedPayments: true,
  },

  documents: {
    invoicePrefix: "INV",
    receiptPrefix: "RCT",
    statementPrefix: "STM",
  },
};
