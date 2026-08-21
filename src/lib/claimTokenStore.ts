import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import type { ClaimToken as ClaimTokenRow, Certificate as CertificateRow, Program } from "@/generated/prisma/client";

export interface ClaimToken {
  token: string;
  createdAt: string;
  createdBy: string;
  used: boolean;
  usedAt?: string;
  certificateId?: string;
  /** Course/program this link's certificate will be issued for. */
  programName: string;
  /** e.g. "Appreciation" — rendered as "Certificate Of Appreciation". */
  certificateType: string;
}

type ClaimTokenWithRelations = ClaimTokenRow & {
  program: Program;
  certificate: CertificateRow | null;
};

function toClaimToken(row: ClaimTokenWithRelations): ClaimToken {
  return {
    token: row.token,
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy,
    used: row.used,
    usedAt: row.usedAt?.toISOString(),
    certificateId: row.certificate?.certificateId ?? undefined,
    programName: row.program.name,
    certificateType: row.program.certificateType,
  };
}

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

async function resolveProgramId(name: string, certificateType: string): Promise<number> {
  const program = await prisma.program.upsert({
    where: { name_certificateType: { name, certificateType } },
    create: { name, certificateType },
    update: {},
  });
  return program.id;
}

/** Generates `count` fresh single-use claim links (1-500), all for the same course/certificate type. */
export async function createClaimTokens(
  count: number,
  createdBy: string,
  programName: string,
  certificateType: string
): Promise<ClaimToken[]> {
  const programId = await resolveProgramId(programName, certificateType);

  return prisma.$transaction(async (tx) => {
    const created: ClaimToken[] = [];
    for (let i = 0; i < count; i += 1) {
      const row = await tx.claimToken.create({
        data: { token: generateToken(), programId, createdBy },
        include: { program: true, certificate: true },
      });
      created.push(toClaimToken(row));
    }
    return created;
  });
}

export async function findClaimToken(token: string): Promise<ClaimToken | undefined> {
  const row = await prisma.claimToken.findUnique({
    where: { token },
    include: { program: true, certificate: true },
  });
  return row ? toClaimToken(row) : undefined;
}

/** Newest first. */
export async function listClaimTokens(): Promise<ClaimToken[]> {
  const rows = await prisma.claimToken.findMany({
    include: { program: true, certificate: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toClaimToken);
}

/**
 * Atomically marks a token used and links it to the issued certificate.
 * Returns false (without writing) if the token doesn't exist or was already
 * used — callers must check this before creating the certificate record.
 */
export async function claimToken(token: string, _certificateId: string): Promise<boolean> {
  // _certificateId isn't written here — it's recorded via
  // certificates.claimToken when the certificate row is inserted (see
  // certificateStore.saveIssuedCertificate), which is the only point both
  // rows exist and the FK can be satisfied.
  try {
    const { count } = await prisma.claimToken.updateMany({
      where: { token, used: false },
      data: { used: true, usedAt: new Date() },
    });
    return count === 1;
  } catch {
    return false;
  }
}
