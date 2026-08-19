import nodemailer from "nodemailer";

interface SendCertificateEmailInput {
  to: string;
  recipientName: string;
  certificateId: string;
  verificationUrl: string;
  pdfBuffer: Buffer;
}

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS."
    );
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendCertificateEmail({
  to,
  recipientName,
  certificateId,
  verificationUrl,
  pdfBuffer,
}: SendCertificateEmailInput): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from: `"Egalaiva Technologies" <${from}>`,
    to,
    subject: "Your AI Engineering Workshop Certificate",
    text: [
      `Hi ${recipientName},`,
      "",
      "Thank you for completing the AI Engineering Workshop. Your certificate is attached as a PDF.",
      "",
      `Certificate ID: ${certificateId}`,
      `Verify it any time at: ${verificationUrl}`,
      "",
      "— Egalaiva Technologies",
    ].join("\n"),
    html: `
      <p>Hi ${recipientName},</p>
      <p>Thank you for completing the <strong>AI Engineering Workshop</strong>. Your certificate is attached as a PDF.</p>
      <p><strong>Certificate ID:</strong> ${certificateId}<br/>
      Verify it any time at: <a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>— Egalaiva Technologies</p>
    `,
    attachments: [
      {
        filename: `${certificateId}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}
