import {
  findIssuedCertificate,
  type CertificateRecord,
} from "@/lib/certificateStore";
import {
  DEFAULT_CERTIFICATE_TYPE,
  WORKSHOP_COMPANY_NAME,
  WORKSHOP_DURATION,
  WORKSHOP_FOUNDER_NAME,
  WORKSHOP_FOUNDER_TITLE,
  WORKSHOP_PROGRAM_NAME,
} from "@/lib/workshop";

export type { CertificateRecord };

const SEED_CERTIFICATES: Record<string, CertificateRecord> = {
  "CERT-2025-8892": {
    certificateId: "CERT-2025-8892",
    recipientName: "Sample Recipient",
    programName: WORKSHOP_PROGRAM_NAME,
    certificateType: DEFAULT_CERTIFICATE_TYPE,
    duration: WORKSHOP_DURATION,
    companyName: WORKSHOP_COMPANY_NAME,
    issueDate: "19 Aug, 2026",
    founderName: WORKSHOP_FOUNDER_NAME,
    founderTitle: WORKSHOP_FOUNDER_TITLE,
    pdfPath: "/certificates/CERT-2025-8892.pdf",
  },
};

export function getCertificate(certificateId: string): CertificateRecord | undefined {
  let id = certificateId.trim();
  try {
    id = decodeURIComponent(certificateId).trim();
  } catch {
    id = certificateId.trim();
  }
  if (!id) return undefined;

  const seeded = SEED_CERTIFICATES[id];
  if (seeded) return seeded;

  const issued = findIssuedCertificate(id);
  if (!issued) return undefined;

  return {
    certificateId: issued.certificateId,
    recipientName: issued.recipientName,
    programName: issued.programName,
    certificateType: issued.certificateType,
    duration: issued.duration,
    companyName: issued.companyName,
    issueDate: issued.issueDate,
    founderName: issued.founderName,
    founderTitle: issued.founderTitle,
  };
}
