import { NextResponse, type NextRequest } from "next/server";
import { buildVerificationUrl } from "@/utils/qrcode";
import { renderCertificatePdf } from "@/lib/certificatePdf";
import { findIssuedCertificate, markCertificateEmailSent } from "@/lib/certificateStore";
import { sendCertificateEmail } from "@/lib/mailer";

export async function POST(
  _request: NextRequest,
  ctx: RouteContext<"/api/certificates/[certificateId]/email">
) {
  const { certificateId } = await ctx.params;
  const record = findIssuedCertificate(certificateId);

  if (!record) {
    return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
  }

  try {
    const pdfBuffer = await renderCertificatePdf(certificateId);
    await sendCertificateEmail({
      to: record.email,
      recipientName: record.recipientName,
      certificateId,
      verificationUrl: buildVerificationUrl(certificateId),
      pdfBuffer,
    });
    markCertificateEmailSent(certificateId, true);
    return NextResponse.json({ emailSent: true });
  } catch (err) {
    markCertificateEmailSent(certificateId, false);
    const message = err instanceof Error ? err.message : "Unknown email error.";
    console.error(`[certificates/email] Failed to resend ${certificateId}:`, err);
    return NextResponse.json({ emailSent: false, error: message }, { status: 502 });
  }
}
