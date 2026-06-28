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
      ? `<tr><td style="padding:12px 0 8px;">
           <a href="${opts.ctaUrl}" style="display:inline-block;background:#171716;color:#ffffff;text-decoration:none;font-weight:600;padding:13px 26px;border-radius:10px;font-size:15px;letter-spacing:-0.1px;">${opts.ctaLabel}</a>
         </td></tr>`
      : "";
  return `<!doctype html><html><body style="margin:0;background:#faf9f7;font-family:ui-sans-serif,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#171716;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f7;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border:1px solid #ececeb;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:30px 36px 0;">
          <div style="display:inline-flex;align-items:center;gap:9px;">
            <span style="display:inline-block;width:26px;height:26px;border-radius:7px;background:#171716;"></span>
            <span style="font-size:16px;font-weight:700;letter-spacing:-0.2px;color:#171716;">Student Housing</span>
          </div>
        </td></tr>
        <tr><td style="padding:26px 36px 8px;">
          <h1 style="margin:0 0 12px;font-size:23px;line-height:1.3;font-weight:700;letter-spacing:-0.4px;color:#171716;">${opts.heading}</h1>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#52524d;">${opts.intro}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="font-size:15px;line-height:1.65;color:#52524d;">${opts.bodyHtml}</td></tr>
            ${cta}
          </table>
        </td></tr>
        <tr><td style="padding:24px 36px 30px;">
          <div style="border-top:1px solid #ececeb;padding-top:18px;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#a3a39d;">${opts.footerNote ?? "This is an automated message from the Student Housing platform. You're receiving it because you have an application or account with us."}</p>
          </div>
        </td></tr>
      </table>
      <p style="margin:18px 0 0;font-size:11px;color:#b8b8b3;">Student Housing · Mufudzi House &amp; Siphiwe House</p>
    </td></tr>
  </table></body></html>`;
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:7px 0;color:#a3a39d;font-size:13px;width:44%;">${label}</td><td style="padding:7px 0;color:#171716;font-size:14px;font-weight:600;text-align:right;">${value}</td></tr>`;
}

export function detailTable(rows: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;background:#faf9f7;border:1px solid #ececeb;border-radius:12px;padding:10px 16px;">${rows
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
      bodyHtml: `Your booking has been received and is <strong>awaiting review</strong>. Your application reference is <strong>${d.reference}</strong>. ${detailTable(
        [
          ["House", String(d.houseName)],
          ["Room", String(d.roomName || "To be assigned")],
          ["Status", "Awaiting review"],
        ],
      )}<br/>You'll be notified by <strong>email and SMS</strong> as soon as your application has been reviewed. There's nothing more you need to do for now.`,
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
      heading: "Your application is approved! 🎉",
      intro: `Great news ${d.studentName} — your application for ${d.houseName} has been approved and your student portal account is ready.`,
      bodyHtml: `Use the login details below to sign in to your student portal. Once you sign in, you'll be asked to <strong>pay your rent of ${d.amount}</strong> to activate your account — after that you'll have full access to your dashboard. ${detailTable(
        [
          ["House", String(d.houseName)],
          ["Room", String(d.roomName || "—")],
          ["Rent due", String(d.amount)],
        ],
      )}
      <div style="margin:4px 0 16px;border:1px solid #e2d2bf;border-radius:12px;padding:14px 16px;background:#faf6f1;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#a87c55;letter-spacing:0.02em;text-transform:uppercase;">Your login credentials</p>
        ${detailTable([
          ["Login email", String(d.email)],
          ["Temporary password", String(d.password)],
        ])}
        <p style="margin:0;font-size:12px;color:#8a978f;">For your security, you can change this password after signing in.</p>
      </div>`,
      ctaLabel: "Sign in & pay rent",
      ctaUrl: String(d.loginUrl || "#"),
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
