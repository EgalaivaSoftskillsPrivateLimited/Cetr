import { NextResponse, type NextRequest } from "next/server";
import { getAdminUsernameFromRequest } from "@/lib/adminAuth";
import { createClaimTokens, listClaimTokens } from "@/lib/claimTokenStore";
import { getCertificate } from "@/data/certificates";
import { getSiteUrl } from "@/lib/siteUrl";
import { DEFAULT_CERTIFICATE_TYPE, WORKSHOP_PROGRAM_NAME } from "@/lib/workshop";

const MAX_COUNT = 500;

function toClaimUrl(token: string): string {
  return `${getSiteUrl()}/claim/${token}`;
}

export async function GET(request: NextRequest) {
  const username = getAdminUsernameFromRequest(request);
  if (!username) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const links = listClaimTokens().map((t) => ({
    ...t,
    url: toClaimUrl(t.token),
    recipientName: t.certificateId ? getCertificate(t.certificateId)?.recipientName : undefined,
  }));

  return NextResponse.json({ links });
}

export async function POST(request: NextRequest) {
  const username = getAdminUsernameFromRequest(request);
  if (!username) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { count, programName, certificateType } = body as {
    count?: number;
    programName?: string;
    certificateType?: string;
  };
  if (!Number.isInteger(count) || count! < 1 || count! > MAX_COUNT) {
    return NextResponse.json(
      { error: `count must be an integer between 1 and ${MAX_COUNT}.` },
      { status: 400 }
    );
  }

  const resolvedProgramName = programName?.trim() || WORKSHOP_PROGRAM_NAME;
  const resolvedCertificateType = certificateType?.trim() || DEFAULT_CERTIFICATE_TYPE;

  const created = createClaimTokens(count!, username, resolvedProgramName, resolvedCertificateType);
  const links = created.map((t) => ({ ...t, url: toClaimUrl(t.token) }));

  return NextResponse.json({ links });
}
