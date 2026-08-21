import { randomBytes } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

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

const STORE_DIR = path.join(process.cwd(), "private");
const STORE_PATH = path.join(STORE_DIR, "claim-tokens.json");

type Store = Record<string, ClaimToken>;

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

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Generates `count` fresh single-use claim links (1-500), all for the same course/certificate type. */
export function createClaimTokens(
  count: number,
  createdBy: string,
  programName: string,
  certificateType: string
): ClaimToken[] {
  const store = readStore();
  const created: ClaimToken[] = [];

  for (let i = 0; i < count; i += 1) {
    let token = generateToken();
    while (token in store) {
      token = generateToken();
    }
    const record: ClaimToken = {
      token,
      createdAt: new Date().toISOString(),
      createdBy,
      used: false,
      programName,
      certificateType,
    };
    store[token] = record;
    created.push(record);
  }

  writeStore(store);
  return created;
}

export function findClaimToken(token: string): ClaimToken | undefined {
  return readStore()[token];
}

/** Newest first. */
export function listClaimTokens(): ClaimToken[] {
  return Object.values(readStore()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Atomically marks a token used and links it to the issued certificate.
 * Returns false (without writing) if the token doesn't exist or was already
 * used — callers must check this before creating the certificate record.
 */
export function claimToken(token: string, certificateId: string): boolean {
  const store = readStore();
  const record = store[token];
  if (!record || record.used) return false;

  record.used = true;
  record.usedAt = new Date().toISOString();
  record.certificateId = certificateId;
  writeStore(store);
  return true;
}
