import { randomBytes } from "crypto";
import { query, resolveProgramId, withTransaction } from "@/lib/db";

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

interface ClaimTokenRow {
  token: string;
  created_at: Date;
  created_by: string;
  used: boolean;
  used_at: Date | null;
  certificate_id: string | null;
  program_name: string;
  certificate_type: string;
}

const SELECT_WITH_PROGRAM = `
  SELECT
    ct.token, ct.created_at, ct.created_by, ct.used, ct.used_at,
    c.certificate_id,
    p.name AS program_name, p.certificate_type
  FROM claim_tokens ct
  JOIN programs p ON p.id = ct.program_id
  LEFT JOIN certificates c ON c.claim_token = ct.token
`;

function toClaimToken(row: ClaimTokenRow): ClaimToken {
  return {
    token: row.token,
    createdAt: row.created_at.toISOString(),
    createdBy: row.created_by,
    used: row.used,
    usedAt: row.used_at?.toISOString(),
    certificateId: row.certificate_id ?? undefined,
    programName: row.program_name,
    certificateType: row.certificate_type,
  };
}

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Generates `count` fresh single-use claim links (1-500), all for the same course/certificate type. */
export async function createClaimTokens(
  count: number,
  createdBy: string,
  programName: string,
  certificateType: string
): Promise<ClaimToken[]> {
  const programId = await resolveProgramId(programName, certificateType);

  return withTransaction(async (client) => {
    const created: ClaimToken[] = [];
    for (let i = 0; i < count; i += 1) {
      const token = generateToken();
      const rows = await client.query<ClaimTokenRow>(
        `INSERT INTO claim_tokens (token, program_id, created_by)
         VALUES ($1, $2, $3)
         RETURNING token, created_at, created_by, used, used_at, NULL::text AS certificate_id, $4::text AS program_name, $5::text AS certificate_type`,
        [token, programId, createdBy, programName, certificateType]
      );
      created.push(toClaimToken(rows[0]));
    }
    return created;
  });
}

export async function findClaimToken(token: string): Promise<ClaimToken | undefined> {
  const rows = await query<ClaimTokenRow>(`${SELECT_WITH_PROGRAM} WHERE ct.token = $1`, [token]);
  return rows[0] ? toClaimToken(rows[0]) : undefined;
}

/** Newest first. */
export async function listClaimTokens(): Promise<ClaimToken[]> {
  const rows = await query<ClaimTokenRow>(`${SELECT_WITH_PROGRAM} ORDER BY ct.created_at DESC`);
  return rows.map(toClaimToken);
}

/**
 * Atomically marks a token used and links it to the issued certificate.
 * Returns false (without writing) if the token doesn't exist or was already
 * used — callers must check this before creating the certificate record.
 */
export async function claimToken(token: string, _certificateId: string): Promise<boolean> {
  // _certificateId isn't written here — it's recorded via
  // certificates.claim_token when the certificate row is inserted (see
  // certificateStore.saveIssuedCertificate), which is the only point both
  // rows exist and the FK can be satisfied.
  return withTransaction(async (client) => {
    const rows = await client.query<{ used: boolean }>(
      "SELECT used FROM claim_tokens WHERE token = $1 FOR UPDATE",
      [token]
    );
    const record = rows[0];
    if (!record || record.used) return false;

    await client.query(
      "UPDATE claim_tokens SET used = true, used_at = now() WHERE token = $1",
      [token]
    );
    return true;
  });
}
