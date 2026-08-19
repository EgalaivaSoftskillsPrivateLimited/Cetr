import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { CertificateRecord } from "@/data/certificates";

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

export function findIssuedCertificate(certificateId: string): IssuedCertificate | undefined {
  return readStore()[certificateId];
}

export function certificateIdExists(certificateId: string): boolean {
  return certificateId in readStore();
}

export function saveIssuedCertificate(record: IssuedCertificate): void {
  const store = readStore();
  store[record.certificateId] = record;
  writeStore(store);
}

export function markCertificateEmailSent(certificateId: string, emailSent: boolean): void {
  const store = readStore();
  const record = store[certificateId];
  if (!record) return;
  record.emailSent = emailSent;
  writeStore(store);
}
