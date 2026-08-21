import { NextResponse, type NextRequest } from "next/server";
import { getAdminUsernameFromRequest } from "@/lib/adminAuth";
import { createBulkIssueJob } from "@/lib/bulkIssueJobs";
import { runBulkIssueJob, type BulkRowInput } from "@/lib/bulkIssueRunner";
import { DEFAULT_CERTIFICATE_TYPE, WORKSHOP_PROGRAM_NAME } from "@/lib/workshop";

const MAX_ROWS = 1000;

interface ColumnMapping {
  fullName?: string;
  email?: string;
  phone?: string;
  college?: string;
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

  const {
    mapping,
    rows,
    programName,
    certificateType,
  } = body as {
    mapping?: ColumnMapping;
    rows?: Record<string, string>[];
    programName?: string;
    certificateType?: string;
  };

  if (!mapping?.fullName || !mapping?.email) {
    return NextResponse.json(
      { error: "Map at least the Full Name and Email columns." },
      { status: 400 }
    );
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows to issue." }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Too many rows (max ${MAX_ROWS}).` }, { status: 400 });
  }

  const mappedRows: BulkRowInput[] = rows.map((r) => ({
    fullName: mapping.fullName ? r[mapping.fullName] : undefined,
    email: mapping.email ? r[mapping.email] : undefined,
    phone: mapping.phone ? r[mapping.phone] : undefined,
    college: mapping.college ? r[mapping.college] : undefined,
  }));

  const resolvedProgramName = programName?.trim() || WORKSHOP_PROGRAM_NAME;
  const resolvedCertificateType = certificateType?.trim() || DEFAULT_CERTIFICATE_TYPE;

  const job = createBulkIssueJob(mappedRows.length, username);
  void runBulkIssueJob(job.id, mappedRows, resolvedProgramName, resolvedCertificateType);

  return NextResponse.json({ jobId: job.id }, { status: 202 });
}
