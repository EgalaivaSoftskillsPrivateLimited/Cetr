import { prisma } from "@/lib/prisma";
import type { Certificate as CertificateRow, Program } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";

export interface CertificateRecord {
  certificateId: string;
  recipientName: string;
  programName: string;
  /** e.g. "Appreciation" — rendered as "Certificate Of Appreciation". */
  certificateType: string;
  duration: string;
  companyName: string;
  issueDate: string;
  founderName: string;
  founderTitle: string;
  pdfPath?: string;
}

/**
 * Metadata only — no PDFs are persisted. Certificates are re-rendered on
 * demand (view/print/email) from this record via /certificate-print.
 */
export interface IssuedCertificate extends Omit<CertificateRecord, "pdfPath"> {
  email: string;
  phone: string;
  college: string;
  quizAnswers: Record<string, string>;
  quizScore: number;
  workshopRating: number;
  usefulnessRating: number;
  engagementRating: number;
  practicalRating: number;
  likedMost?: string;
  improvementSuggestion?: string;
  issuedAt: string;
  emailSent: boolean;
  /** How this certificate was created. Missing/undefined means self-serve (the default, pre-existing behavior). */
  source?: "self-serve" | "bulk-admin";
  /** The claim link this certificate was issued through, if any (self-serve only). */
  claimToken?: string;
}

type CertificateWithProgram = CertificateRow & { program: Program };

function toIssuedCertificate(row: CertificateWithProgram): IssuedCertificate {
  return {
    certificateId: row.certificateId,
    recipientName: row.recipientName,
    programName: row.program.name,
    certificateType: row.program.certificateType,
    duration: row.duration,
    companyName: row.companyName,
    issueDate: row.issueDate,
    founderName: row.founderName,
    founderTitle: row.founderTitle,
    email: row.email,
    phone: row.phone,
    college: row.college,
    quizAnswers: row.quizAnswers as Record<string, string>,
    quizScore: row.quizScore,
    workshopRating: row.workshopRating,
    usefulnessRating: row.usefulnessRating,
    engagementRating: row.engagementRating,
    practicalRating: row.practicalRating,
    likedMost: row.likedMost ?? undefined,
    improvementSuggestion: row.improvementSuggestion ?? undefined,
    issuedAt: row.issuedAt.toISOString(),
    emailSent: row.emailSent,
    source: (row.source as IssuedCertificate["source"]) ?? undefined,
  };
}

function decodeId(certificateId: string): string {
  try {
    return decodeURIComponent(certificateId).trim();
  } catch {
    return certificateId.trim();
  }
}

async function resolveProgramId(name: string, certificateType: string): Promise<number> {
  const program = await prisma.program.upsert({
    where: { name_certificateType: { name, certificateType } },
    create: { name, certificateType },
    update: {},
  });
  return program.id;
}

export async function findIssuedCertificate(certificateId: string): Promise<IssuedCertificate | undefined> {
  const row = await prisma.certificate.findUnique({
    where: { certificateId: decodeId(certificateId) },
    include: { program: true },
  });
  return row ? toIssuedCertificate(row) : undefined;
}

export async function certificateIdExists(certificateId: string): Promise<boolean> {
  const row = await prisma.certificate.findUnique({
    where: { certificateId: decodeId(certificateId) },
    select: { certificateId: true },
  });
  return row !== null;
}

/** Every issued certificate, newest first. */
export async function listIssuedCertificates(): Promise<IssuedCertificate[]> {
  const rows = await prisma.certificate.findMany({
    include: { program: true },
    orderBy: { issuedAt: "desc" },
  });
  return rows.map(toIssuedCertificate);
}

export async function saveIssuedCertificate(record: IssuedCertificate): Promise<void> {
  const programId = await resolveProgramId(record.programName, record.certificateType);

  const data = {
    claimToken: record.claimToken ?? null,
    programId,
    duration: record.duration,
    companyName: record.companyName,
    founderName: record.founderName,
    founderTitle: record.founderTitle,
    issueDate: record.issueDate,
    recipientName: record.recipientName,
    email: record.email,
    phone: record.phone,
    college: record.college,
    quizAnswers: record.quizAnswers as Prisma.InputJsonValue,
    quizScore: record.quizScore,
    workshopRating: record.workshopRating,
    usefulnessRating: record.usefulnessRating,
    engagementRating: record.engagementRating,
    practicalRating: record.practicalRating,
    likedMost: record.likedMost ?? null,
    improvementSuggestion: record.improvementSuggestion ?? null,
    issuedAt: new Date(record.issuedAt),
    emailSent: record.emailSent,
    source: record.source ?? null,
  };

  await prisma.certificate.upsert({
    where: { certificateId: record.certificateId },
    create: { certificateId: record.certificateId, ...data },
    update: data,
  });
}

export async function markCertificateEmailSent(certificateId: string, emailSent: boolean): Promise<void> {
  await prisma.certificate.updateMany({
    where: { certificateId: decodeId(certificateId) },
    data: { emailSent },
  });
}
