import { NextResponse, type NextRequest } from "next/server";
import { getCertificate } from "@/data/certificates";
import { renderCertificatePdf } from "@/lib/certificatePdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/certificates/[certificateId]/pdf">
) {
  const { certificateId } = await ctx.params;
  const record = getCertificate(certificateId);

  if (!record) {
    return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
  }

  if (record.pdfPath) {
    return NextResponse.redirect(new URL(record.pdfPath, request.url));
  }

  try {
    const pdfBuffer = await renderCertificatePdf(record.certificateId);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${record.certificateId}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error(`[certificates/pdf] Failed to render ${record.certificateId}:`, err);
    return NextResponse.json({ error: "Could not generate PDF." }, { status: 502 });
  }
}
