/** Reusable SMS / notification message templates. Use renderTemplate() to fill. */

export const SMS_TEMPLATES = {
  applicationReceived:
    "Hi {{studentName}}, your accommodation application for {{houseName}} has been received. Your room request is awaiting approval. We will update you shortly.",
  applicationApproved:
    "Hi {{studentName}}, your application for {{houseName}} has been approved. Please complete your payment using the secure payment link sent to your email and student portal.",
  applicationRejected:
    "Hi {{studentName}}, thank you for applying to {{houseName}}. Unfortunately we are unable to offer you a room at this time. Please contact us for other options.",
  paymentLinkGenerated:
    "Hi {{studentName}}, a payment request of {{amount}} for {{houseName}} is ready. Pay securely via your student portal or the link in your email.",
  paymentCompleted:
    "Hi {{studentName}}, we have received your payment of {{amount}}. Thank you! Your receipt {{receiptNumber}} is available in your portal.",
  paymentReminder:
    "Hi {{studentName}}, this is a friendly reminder that you have an outstanding balance of {{amount}} for {{houseName}}. Please settle it via your portal.",
  movedIn:
    "Hi {{studentName}}, welcome to {{houseName}}! Your room {{roomNumber}} is ready. Enjoy your stay.",
} as const;

export const EMAIL_SUBJECTS = {
  applicationReceived: "We've received your accommodation application",
  newApplicationAlert: "New accommodation application received",
  applicationApproved: "Your accommodation application is approved 🎉",
  applicationRejected: "Update on your accommodation application",
  paymentRequest: "Your payment request is ready",
  paymentConfirmation: "Payment received — thank you",
  invoice: "Your invoice from {{houseName}}",
  receipt: "Your receipt {{receiptNumber}}",
  statement: "Your account statement",
  announcement: "{{title}}",
  serviceUpdate: "Service update: {{title}}",
} as const;
