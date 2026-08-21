-- AlterTable: a claim token can produce at most one certificate.
CREATE UNIQUE INDEX "certificates_claim_token_key" ON "certificates"("claim_token");
