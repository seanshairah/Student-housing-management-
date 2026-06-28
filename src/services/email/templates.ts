import { renderTemplate } from "@/lib/utils";

interface BrandedOptions {
  heading: string;
  intro: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}

/** Wrap content in a clean, responsive branded email shell. */
export function brandedEmail(opts: BrandedOptions): string {
  const cta =
    opts.ctaLabel && opts.ctaUrl
      ? `<tr><td style="padding:8px 0 24px;">
           <a href="${opts.ctaUrl}" style="display:inline-block;background:#157857;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:10px;font-size:15px;">${opts.ctaLabel}</a>
         </td></tr>`
      : "";
  return `<!doctype html><html><body style="margin:0;background:#f4f6f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f3f31;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr><td style="background:#157857;padding:20px 28px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">Student Housing</span>
        </td></tr>
        <tr><td style="padding:28px 28px 8px;">
          <h1 style="margin:0 0 8px;font-size:21px;line-height:1.3;color:#0f3f31;">${opts.heading}</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3a4a44;">${opts.intro}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="font-size:15px;line-height:1.6;color:#3a4a44;">${opts.bodyHtml}</td></tr>
            ${cta}
          </table>
        </td></tr>
        <tr><td style="padding:18px 28px 28px;border-top:1px solid #eef0ef;">
          <p style="margin:0;font-size:12px;color:#8a978f;">${opts.footerNote ?? "This is an automated message from the Student Housing management platform."}</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#aab4ae;">© Student Housing · Mufudzi House &amp; Siphiwe House</p>
    </td></tr>
  </table></body></html>`;
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:6px 0;color:#8a978f;font-size:13px;width:42%;">${label}</td><td style="padding:6px 0;color:#0f3f31;font-size:14px;font-weight:600;">${value}</td></tr>`;
}

export function detailTable(rows: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;border:1px solid #eef0ef;border-radius:10px;padding:8px 14px;">${rows
    .map(([l, v]) => row(l, v))
    .join("")}</table>`;
}

// ── Concrete templates ────────────────────────────────────────
export interface TemplateData {
  [key: string]: string | number;
}

export const emailTemplates = {
  applicationReceived: (d: TemplateData) =>
    brandedEmail({
      heading: "We've received your application 🎉",
      intro: `Hi ${d.studentName}, thank you for applying for accommodation at ${d.houseName}.`,
      bodyHtml: `Your application reference is <strong>${d.reference}</strong>. Our team is reviewing it and you'll hear from us soon. ${detailTable(
        [
          ["House", String(d.houseName)],
          ["Room", String(d.roomName || "To be assigned")],
          ["Status", "Awaiting review"],
        ],
      )}`,
      ctaLabel: "View your portal",
      ctaUrl: String(d.portalUrl || "#"),
    }),

  newApplicationAlert: (d: TemplateData) =>
    brandedEmail({
      heading: "New accommodation application",
      intro: `A new application has been submitted for ${d.houseName}.`,
      bodyHtml: detailTable([
        ["Applicant", String(d.studentName)],
        ["Email", String(d.email)],
        ["Phone", String(d.phone)],
        ["House", String(d.houseName)],
        ["Room", String(d.roomName || "—")],
        ["Reference", String(d.reference)],
      ]),
      ctaLabel: "Review application",
      ctaUrl: String(d.reviewUrl || "#"),
    }),

  applicationApproved: (d: TemplateData) =>
    brandedEmail({
      heading: "Your application is approved!",
      intro: `Great news ${d.studentName} — your application for ${d.houseName} has been approved.`,
      bodyHtml: `Please complete your payment of <strong>${d.amount}</strong> to secure your room. ${detailTable(
        [
          ["House", String(d.houseName)],
          ["Room", String(d.roomName || "—")],
          ["Amount due", String(d.amount)],
        ],
      )}`,
      ctaLabel: "Pay now",
      ctaUrl: String(d.paymentUrl || "#"),
    }),

  applicationRejected: (d: TemplateData) =>
    brandedEmail({
      heading: "Update on your application",
      intro: `Hi ${d.studentName}, thank you for your interest in ${d.houseName}.`,
      bodyHtml: `Unfortunately we're unable to offer you a room at this time. ${
        d.reason ? `<br/><br/><em>${d.reason}</em>` : ""
      }<br/><br/>Please reach out if you'd like to explore other options.`,
    }),

  paymentRequest: (d: TemplateData) =>
    brandedEmail({
      heading: "Your payment request is ready",
      intro: `Hi ${d.studentName}, here is your payment request for ${d.houseName}.`,
      bodyHtml: detailTable([
        ["Invoice", String(d.invoiceNumber)],
        ["Description", String(d.description)],
        ["Amount", String(d.amount)],
        ["Due date", String(d.dueDate || "—")],
      ]),
      ctaLabel: "Pay securely",
      ctaUrl: String(d.paymentUrl || "#"),
    }),

  paymentConfirmation: (d: TemplateData) =>
    brandedEmail({
      heading: "Payment received — thank you!",
      intro: `Hi ${d.studentName}, we've successfully received your payment.`,
      bodyHtml: detailTable([
        ["Receipt", String(d.receiptNumber)],
        ["Amount paid", String(d.amount)],
        ["Reference", String(d.reference)],
        ["Date", String(d.date)],
      ]),
      ctaLabel: "Download receipt",
      ctaUrl: String(d.receiptUrl || "#"),
    }),

  invoice: (d: TemplateData) =>
    brandedEmail({
      heading: `Invoice ${d.invoiceNumber}`,
      intro: `Hi ${d.studentName}, please find your invoice details below.`,
      bodyHtml: detailTable([
        ["Invoice", String(d.invoiceNumber)],
        ["Description", String(d.description)],
        ["Amount", String(d.amount)],
        ["Status", String(d.status)],
        ["Due date", String(d.dueDate || "—")],
      ]),
      ctaLabel: "View invoice",
      ctaUrl: String(d.invoiceUrl || "#"),
    }),

  receipt: (d: TemplateData) =>
    brandedEmail({
      heading: `Receipt ${d.receiptNumber}`,
      intro: `Hi ${d.studentName}, thank you for your payment. Here is your receipt.`,
      bodyHtml: detailTable([
        ["Receipt", String(d.receiptNumber)],
        ["Amount", String(d.amount)],
        ["Reference", String(d.reference)],
        ["Date", String(d.date)],
      ]),
    }),

  statement: (d: TemplateData) =>
    brandedEmail({
      heading: "Your account statement",
      intro: `Hi ${d.studentName}, here is a summary of your account.`,
      bodyHtml: detailTable([
        ["Total invoiced", String(d.totalDue)],
        ["Total paid", String(d.totalPaid)],
        ["Outstanding balance", String(d.balance)],
      ]),
      ctaLabel: "View full statement",
      ctaUrl: String(d.statementUrl || "#"),
    }),

  announcement: (d: TemplateData) =>
    brandedEmail({
      heading: String(d.title),
      intro: String(d.intro || "A new announcement from your housing team."),
      bodyHtml: String(d.body),
    }),

  serviceUpdate: (d: TemplateData) =>
    brandedEmail({
      heading: `Service update: ${d.title}`,
      intro: String(d.intro || "There's an update on a service request."),
      bodyHtml: String(d.body),
    }),
};

export type EmailTemplateName = keyof typeof emailTemplates;

export function renderEmail(
  template: EmailTemplateName,
  data: TemplateData,
): string {
  return emailTemplates[template](data);
}

export { renderTemplate };
