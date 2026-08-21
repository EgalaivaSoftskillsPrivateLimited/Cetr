import Link from "next/link";
import { btnPrimary, btnSecondary, CornerHandles, Eyebrow } from "@/ui";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper-soft px-5 py-10">
      <div className="relative w-full max-w-[420px] rounded-[28px] border-[1.5px] border-dashed border-ink/15 bg-paper p-9 text-center shadow-[0_40px_80px_rgba(0,0,0,0.35)]">
        <CornerHandles />
        <Eyebrow>Egalaiva Technologies</Eyebrow>
        <h1 className="mt-2 text-2xl font-extrabold uppercase tracking-tight text-ink">
          Certificate Portal
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/60">
          AI Engineering Workshop certificates are issued through a personal, one-time claim
          link sent by your workshop organizer. If you attended, check your email or messages
          for your link.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link href="/verify" className={`${btnPrimary} w-full`}>
            Verify A Certificate →
          </Link>
          <Link href="/admin/login" className={`${btnSecondary} w-full`}>
            Admin Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
