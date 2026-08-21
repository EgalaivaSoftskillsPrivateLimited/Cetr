import { query, resolveProgramId } from "@/lib/db";

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

interface CertificateRow {
  certificate_id: string;
  recipient_name: string;
  program_name: string;
  certificate_type: string;
  duration: string;
  company_name: string;
  issue_date: string;
  founder_name: string;
  founder_title: string;
  email: string;
  phone: string;
  college: string;
  quiz_answers: Record<string, string>;
  quiz_score: number;
  workshop_rating: number;
  usefulness_rating: number;
  engagement_rating: number;
  practical_rating: number;
  liked_most: string | null;
  improvement_suggestion: string | null;
  issued_at: Date;
  email_sent: boolean;
  source: string | null;
}

const SELECT_WITH_PROGRAM = `
  SELECT
    c.certificate_id, c.recipient_name,
    p.name AS program_name, p.certificate_type,
    c.duration, c.company_name, c.issue_date, c.founder_name, c.founder_title,
    c.email, c.phone, c.college,
    c.quiz_answers, c.quiz_score,
    c.workshop_rating, c.usefulness_rating, c.engagement_rating, c.practical_rating,
    c.liked_most, c.improvement_suggestion,
    c.issued_at, c.email_sent, c.source
  FROM certificates c
  JOIN programs p ON p.id = c.program_id
`;

function toIssuedCertificate(row: CertificateRow): IssuedCertificate {
  return {
    certificateId: row.certificate_id,
    recipientName: row.recipient_name,
    programName: row.program_name,
    certificateType: row.certificate_type,
    duration: row.duration,
    companyName: row.company_name,
    issueDate: row.issue_date,
    founderName: row.founder_name,
    founderTitle: row.founder_title,
    email: row.email,
    phone: row.phone,
    college: row.college,
    quizAnswers: row.quiz_answers,
    quizScore: row.quiz_score,
    workshopRating: row.workshop_rating,
    usefulnessRating: row.usefulness_rating,
    engagementRating: row.engagement_rating,
    practicalRating: row.practical_rating,
    likedMost: row.liked_most ?? undefined,
    improvementSuggestion: row.improvement_suggestion ?? undefined,
    issuedAt: row.issued_at.toISOString(),
    emailSent: row.email_sent,
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

export async function findIssuedCertificate(certificateId: string): Promise<IssuedCertificate | undefined> {
  const rows = await query<CertificateRow>(`${SELECT_WITH_PROGRAM} WHERE c.certificate_id = $1`, [
    decodeId(certificateId),
  ]);
  return rows[0] ? toIssuedCertificate(rows[0]) : undefined;
}

export async function certificateIdExists(certificateId: string): Promise<boolean> {
  const rows = await query<{ exists: boolean }>(
    "SELECT EXISTS(SELECT 1 FROM certificates WHERE certificate_id = $1) AS exists",
    [decodeId(certificateId)]
  );
  return rows[0].exists;
}

/** Every issued certificate, newest first. */
export async function listIssuedCertificates(): Promise<IssuedCertificate[]> {
  const rows = await query<CertificateRow>(`${SELECT_WITH_PROGRAM} ORDER BY c.issued_at DESC`);
  return rows.map(toIssuedCertificate);
}

export async function saveIssuedCertificate(record: IssuedCertificate): Promise<void> {
  const programId = await resolveProgramId(record.programName, record.certificateType);

  await query(
    `INSERT INTO certificates (
       certificate_id, claim_token, program_id,
       duration, company_name, founder_name, founder_title, issue_date,
       recipient_name, email, phone, college,
       quiz_answers, quiz_score,
       workshop_rating, usefulness_rating, engagement_rating, practical_rating,
       liked_most, improvement_suggestion,
       issued_at, email_sent, source
     ) VALUES (
       $1, $2, $3,
       $4, $5, $6, $7, $8,
       $9, $10, $11, $12,
       $13, $14,
       $15, $16, $17, $18,
       $19, $20,
       $21, $22, $23
     )
     ON CONFLICT (certificate_id) DO UPDATE SET
       claim_token = EXCLUDED.claim_token,
       program_id = EXCLUDED.program_id,
       duration = EXCLUDED.duration,
       company_name = EXCLUDED.company_name,
       founder_name = EXCLUDED.founder_name,
       founder_title = EXCLUDED.founder_title,
       issue_date = EXCLUDED.issue_date,
       recipient_name = EXCLUDED.recipient_name,
       email = EXCLUDED.email,
       phone = EXCLUDED.phone,
       college = EXCLUDED.college,
       quiz_answers = EXCLUDED.quiz_answers,
       quiz_score = EXCLUDED.quiz_score,
       workshop_rating = EXCLUDED.workshop_rating,
       usefulness_rating = EXCLUDED.usefulness_rating,
       engagement_rating = EXCLUDED.engagement_rating,
       practical_rating = EXCLUDED.practical_rating,
       liked_most = EXCLUDED.liked_most,
       improvement_suggestion = EXCLUDED.improvement_suggestion,
       issued_at = EXCLUDED.issued_at,
       email_sent = EXCLUDED.email_sent,
       source = EXCLUDED.source`,
    [
      record.certificateId,
      record.claimToken ?? null,
      programId,
      record.duration,
      record.companyName,
      record.founderName,
      record.founderTitle,
      record.issueDate,
      record.recipientName,
      record.email,
      record.phone,
      record.college,
      JSON.stringify(record.quizAnswers),
      record.quizScore,
      record.workshopRating,
      record.usefulnessRating,
      record.engagementRating,
      record.practicalRating,
      record.likedMost ?? null,
      record.improvementSuggestion ?? null,
      record.issuedAt,
      record.emailSent,
      record.source ?? null,
    ]
  );
}

export async function markCertificateEmailSent(certificateId: string, emailSent: boolean): Promise<void> {
  await query("UPDATE certificates SET email_sent = $1 WHERE certificate_id = $2", [
    emailSent,
    decodeId(certificateId),
  ]);
}
