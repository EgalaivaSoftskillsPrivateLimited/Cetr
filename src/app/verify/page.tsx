import Link from "next/link";
import VerifyForm from "@/components/VerifyForm";
import { btnSecondary, CornerHandles, Eyebrow } from "@/ui";

export default function VerifyLandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper-soft px-5 py-10">
      <div className="relative w-full max-w-[420px] rounded-[28px] border-[1.5px] border-dashed border-ink/15 bg-paper p-9 text-center shadow-[0_40px_80px_rgba(0,0,0,0.35)]">
        <CornerHandles />
        <Eyebrow>Certificate Lookup</Eyebrow>
        <h1 className="mt-2 text-2xl font-extrabold uppercase tracking-tight text-ink">
          Verify a Certificate
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/60">
          Enter a certificate ID to confirm it was issued by Egalaiva Technologies.
        </p>
        <div className="mt-6">
          <VerifyForm />
        </div>
        <Link href="/" className={`${btnSecondary} mt-6 w-full`}>
          ← Back Home
        </Link>
      </div>
    </main>
  );
}
