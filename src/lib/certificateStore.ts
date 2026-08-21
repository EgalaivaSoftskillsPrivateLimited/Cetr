import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

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
}

const STORE_DIR = path.join(process.cwd(), "private");
const STORE_PATH = path.join(STORE_DIR, "certificates-store.json");

type Store = Record<string, IssuedCertificate>;

function readStore(): Store {
  try {
    return JSON.parse(readFileSync(STORE_PATH, "utf-8")) as Store;
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  mkdirSync(STORE_DIR, { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

function decodeId(certificateId: string): string {
  try {
    return decodeURIComponent(certificateId).trim();
  } catch {
    return certificateId.trim();
  }
}

export function findIssuedCertificate(certificateId: string): IssuedCertificate | undefined {
  return readStore()[decodeId(certificateId)];
}

export function certificateIdExists(certificateId: string): boolean {
  return decodeId(certificateId) in readStore();
}

/** Every issued certificate, newest first. */
export function listIssuedCertificates(): IssuedCertificate[] {
  return Object.values(readStore()).sort(
    (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
  );
}

export function saveIssuedCertificate(record: IssuedCertificate): void {
  const store = readStore();
  store[record.certificateId] = record;
  writeStore(store);
}

export function markCertificateEmailSent(certificateId: string, emailSent: boolean): void {
  const store = readStore();
  const record = store[decodeId(certificateId)];
  if (!record) return;
  record.emailSent = emailSent;
  writeStore(store);
}
