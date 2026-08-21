-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "programs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "certificate_type" TEXT NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_tokens" (
    "token" TEXT NOT NULL,
    "program_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMPTZ(6),

    CONSTRAINT "claim_tokens_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "certificates" (
    "certificate_id" TEXT NOT NULL,
    "claim_token" TEXT,
    "program_id" INTEGER NOT NULL,
    "duration" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "founder_name" TEXT NOT NULL,
    "founder_title" TEXT NOT NULL,
    "issue_date" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "college" TEXT NOT NULL,
    "quiz_answers" JSONB NOT NULL,
    "quiz_score" INTEGER NOT NULL,
    "workshop_rating" INTEGER NOT NULL,
    "usefulness_rating" INTEGER NOT NULL,
    "engagement_rating" INTEGER NOT NULL,
    "practical_rating" INTEGER NOT NULL,
    "liked_most" TEXT,
    "improvement_suggestion" TEXT,
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("certificate_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "programs_name_certificate_type_key" ON "programs"("name", "certificate_type");

-- CreateIndex
CREATE INDEX "idx_claim_tokens_created_at" ON "claim_tokens"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_certificates_email" ON "certificates"("email");

-- CreateIndex
CREATE INDEX "idx_certificates_issued_at" ON "certificates"("issued_at" DESC);

-- AddForeignKey
ALTER TABLE "claim_tokens" ADD CONSTRAINT "claim_tokens_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_claim_token_fkey" FOREIGN KEY ("claim_token") REFERENCES "claim_tokens"("token") ON DELETE SET NULL ON UPDATE CASCADE;

