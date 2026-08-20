import Link from "next/link";
import { getCertificate } from "@/data/certificates";
import { AnnotationTag, btnPrimary, btnSecondary, CornerHandles, Eyebrow } from "@/ui";

export const dynamic = "force-dynamic";

export default async function VerifyPage({
  params,
}: PageProps<"/verify/[certificateId]">) {
  const { certificateId } = await params;
  const record = getCertificate(certificateId);

  if (!record) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-navy px-5 py-10">
        <div className="relative w-full max-w-[420px] rounded-[28px] border-[1.5px] border-dashed border-ink/15 bg-paper p-9 text-center shadow-[0_40px_80px_rgba(0,0,0,0.35)]">
          <CornerHandles />
          <Eyebrow>Verification Failed</Eyebrow>
          <h1 className="mt-2 text-2xl font-extrabold uppercase tracking-tight text-ink">
            Certificate Not Found
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
            No certificate matches ID{" "}
            <span className="font-mono text-ink">{certificateId}</span>. Double-check the ID
            or QR code and try again.
          </p>
          <Link href="/verify" className={`${btnPrimary} mt-6 w-full`}>
            Try Another ID
          </Link>
          <Link href="/" className={`${btnSecondary} mt-3 w-full`}>
            ← Back Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-5 py-10">
      <div className="relative w-full max-w-[460px] rounded-[28px] border-[1.5px] border-dashed border-ink/15 bg-paper p-9 text-center shadow-[0_40px_80px_rgba(0,0,0,0.35)]">
        <CornerHandles />
        <AnnotationTag className="absolute -top-4 right-6 rotate-3 bg-blue">
          ✓ Verified
        </AnnotationTag>

        <div className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-blue" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M4 12l5 5 11-11" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <Eyebrow>Certificate Verified</Eyebrow>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
          {record.recipientName}
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Issued by {record.companyName} on {record.issueDate}
        </p>

        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 rounded-xl border border-ink/10 bg-ink/[0.03] p-4 text-left text-sm">
          <dt className="text-ink/45">Program</dt>
          <dd className="font-semibold text-ink">{record.programName}</dd>
          <dt className="text-ink/45">Duration</dt>
          <dd className="font-semibold text-ink">{record.duration}</dd>
          <dt className="text-ink/45">Issued by</dt>
          <dd className="font-semibold text-ink">
            {record.founderName} ({record.founderTitle})
          </dd>
          <dt className="text-ink/45">Certificate ID</dt>
          <dd className="font-mono text-xs font-semibold text-ink">{record.certificateId}</dd>
        </dl>

        <div className="mt-6 flex flex-col gap-3">
          <a
            href={`/api/certificates/${encodeURIComponent(record.certificateId)}/pdf`}
            className={`${btnPrimary} w-full`}
          >
            Download Certificate (PDF) →
          </a>
          <a
            href={`/certificate-print?id=${encodeURIComponent(record.certificateId)}`}
            target="_blank"
            rel="noreferrer"
            className={`${btnSecondary} w-full`}
          >
            View Certificate
          </a>
          <Link href="/" className={`${btnSecondary} w-full`}>
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
