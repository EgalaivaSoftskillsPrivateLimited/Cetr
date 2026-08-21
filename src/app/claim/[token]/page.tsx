import Link from "next/link";
import { findClaimToken } from "@/lib/claimTokenStore";
import { getCertificate } from "@/data/certificates";
import { btnPrimary, CornerHandles, Eyebrow } from "@/ui";
import ClaimFlow from "@/components/ClaimFlow";

function InvalidLinkCard({
  heading,
  message,
}: {
  heading: string;
  message: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper-soft px-5 py-10">
      <div className="relative w-full max-w-[420px] rounded-[28px] border-[1.5px] border-dashed border-ink/15 bg-paper p-9 text-center shadow-[0_40px_80px_rgba(0,0,0,0.35)]">
        <CornerHandles />
        <Eyebrow>Link Unavailable</Eyebrow>
        <h1 className="mt-2 text-2xl font-extrabold uppercase tracking-tight text-ink">
          {heading}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/60">{message}</p>
        <Link href="/" className={`${btnPrimary} mt-6 w-full`}>
          ← Back Home
        </Link>
      </div>
    </main>
  );
}

export default async function ClaimTokenPage({
  params,
}: PageProps<"/claim/[token]">) {
  const { token } = await params;
  const claim = findClaimToken(token);

  if (!claim) {
    return (
      <InvalidLinkCard
        heading="Invalid Link"
        message="This certificate claim link doesn't exist. Double-check the link your workshop organizer sent you."
      />
    );
  }

  if (claim.used) {
    const certificate = claim.certificateId ? getCertificate(claim.certificateId) : undefined;
    return (
      <InvalidLinkCard
        heading="Link Already Used"
        message={
          certificate
            ? `This link was already used to issue a certificate to ${certificate.recipientName}. Each link works once — contact your workshop organizer if you need a new one.`
            : "This link has already been used. Each link works once — contact your workshop organizer if you need a new one."
        }
      />
    );
  }

  return <ClaimFlow token={token} programName={claim.programName} />;
}
