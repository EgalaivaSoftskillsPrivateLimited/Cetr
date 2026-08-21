-- Distinct (program name, certificate type) pairs a claim link/certificate
-- can reference. Normalizes the pair instead of repeating it as raw text on
-- every claim_tokens/certificates row.
CREATE TABLE IF NOT EXISTS programs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  certificate_type TEXT NOT NULL, -- e.g. "Appreciation"
  UNIQUE (name, certificate_type)
);

-- Single-use links generated from /admin to let a participant claim a
-- certificate for a given program.
CREATE TABLE IF NOT EXISTS claim_tokens (
  token TEXT PRIMARY KEY,
  program_id INTEGER NOT NULL REFERENCES programs (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_claim_tokens_created_at ON claim_tokens (created_at DESC);

-- Metadata for every issued certificate. No PDFs are stored — certificates
-- are re-rendered on demand from this row (see src/lib/certificatePdf.ts).
-- duration/company_name/founder_name/founder_title/issue_date are snapshots
-- at issue time (matching prior JSON-store behavior), not derived via join,
-- so a certificate stays historically accurate if workshop.ts constants
-- change later.
CREATE TABLE IF NOT EXISTS certificates (
  certificate_id TEXT PRIMARY KEY,
  claim_token TEXT REFERENCES claim_tokens (token), -- null for manually seeded/bulk-admin certs
  program_id INTEGER NOT NULL REFERENCES programs (id),

  duration TEXT NOT NULL,
  company_name TEXT NOT NULL,
  founder_name TEXT NOT NULL,
  founder_title TEXT NOT NULL,
  issue_date TEXT NOT NULL, -- display string, e.g. "19 Aug, 2026"

  recipient_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  college TEXT NOT NULL,

  quiz_answers JSONB NOT NULL,
  quiz_score INTEGER NOT NULL,
  workshop_rating INTEGER NOT NULL,
  usefulness_rating INTEGER NOT NULL,
  engagement_rating INTEGER NOT NULL,
  practical_rating INTEGER NOT NULL,
  liked_most TEXT,
  improvement_suggestion TEXT,

  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email_sent BOOLEAN NOT NULL DEFAULT false,
  source TEXT -- 'self-serve' | 'bulk-admin' | null (legacy self-serve)
);

CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates (issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_certificates_email ON certificates (email);
