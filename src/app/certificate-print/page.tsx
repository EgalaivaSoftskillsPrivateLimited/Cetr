import { notFound } from "next/navigation";
import Certificate from "@/components/Certificate";
import { getCertificate } from "@/data/certificates";
import { buildVerificationUrl } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

const DEFAULT_CERTIFICATE_ID = "CERT-2025-8892";

export default async function CertificatePrintPage({
  searchParams,
}: PageProps<"/certificate-print">) {
  const { id } = await searchParams;
  const rawId = Array.isArray(id) ? id[0] : id;
  const certificateId = rawId ?? DEFAULT_CERTIFICATE_ID;

  const record = getCertificate(certificateId);

  if (!record) {
    notFound();
  }

  return (
    <Certificate
      recipientName={record.recipientName}
      programName={record.programName}
      duration={record.duration}
      companyName={record.companyName}
      issueDate={record.issueDate}
      founderName={record.founderName}
      founderTitle={record.founderTitle}
      certificateId={record.certificateId}
      verificationUrl={buildVerificationUrl(record.certificateId)}
    />
  );
}
