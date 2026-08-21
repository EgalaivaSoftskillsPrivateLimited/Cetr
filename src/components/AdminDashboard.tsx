"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnnotationTag, btnPrimary, btnSecondary, CornerHandles, Eyebrow } from "@/ui";
import { CERTIFICATE_TYPES, DEFAULT_CERTIFICATE_TYPE, WORKSHOP_PROGRAM_NAME } from "@/lib/workshop";

export interface AdminLink {
  token: string;
  createdAt: string;
  createdBy: string;
  used: boolean;
  usedAt?: string;
  certificateId?: string;
  programName: string;
  certificateType: string;
  url: string;
  recipientName?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusPill({ used }: { used: boolean }) {
  return used ? (
    <span className="inline-flex items-center rounded-full bg-lime px-2.5 py-1 text-[11px] font-bold text-lime-ink">
      Claimed
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-blue/30 px-2.5 py-1 text-[11px] font-bold text-blue">
      Unused
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      className="shrink-0 rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink/70 transition-colors hover:bg-ink/5"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

export default function AdminDashboard({
  username,
  initialLinks,
}: {
  username: string;
  initialLinks: AdminLink[];
}) {
  const router = useRouter();
  const [links, setLinks] = useState<AdminLink[]>(initialLinks);
  const [count, setCount] = useState(10);
  const [programName, setProgramName] = useState(WORKSHOP_PROGRAM_NAME);
  const [certificateType, setCertificateType] = useState<string>(DEFAULT_CERTIFICATE_TYPE);
  const [justGenerated, setJustGenerated] = useState<AdminLink[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const unusedCount = links.filter((l) => !l.used).length;

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, programName, certificateType }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Couldn't generate links.");
        return;
      }
      const newLinks: AdminLink[] = body.links;
      setJustGenerated(newLinks);
      setLinks((prev) => [...newLinks, ...prev]);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAll = async () => {
    if (!justGenerated) return;
    await navigator.clipboard.writeText(justGenerated.map((l) => l.url).join("\n"));
    setCopiedAll(true);
    window.setTimeout(() => setCopiedAll(false), 1500);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-paper px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow>Admin · {username}</Eyebrow>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
              Certificate claim links.
            </h1>
            <p className="mt-2 text-sm text-ink/60">
              {links.length} generated · {unusedCount} still unused
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <Link href="/admin/certificates" className={`${btnSecondary} px-4 py-2.5`}>
              View Certificates
            </Link>
            <Link href="/admin/bulk" className={`${btnSecondary} px-4 py-2.5`}>
              Bulk Issue From File
            </Link>
            <button type="button" onClick={handleLogout} className={`${btnSecondary} px-4 py-2.5`}>
              Log Out
            </button>
          </div>
        </div>

        <div className="relative rounded-2xl border border-dashed border-ink/15 p-6 md:p-8">
          <CornerHandles />
          <span className="absolute -top-2.5 left-4 bg-paper px-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/40">
            Component
          </span>

          <h2 className="text-lg font-extrabold uppercase tracking-tight text-ink">
            Generate Links
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            Each link opens the certificate claim flow once. It&apos;s marked used only after
            that person successfully receives their certificate.
          </p>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wide text-ink/65" htmlFor="programName">
                Course / Program
              </label>
              <input
                id="programName"
                type="text"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                className="w-56 rounded-xl border border-ink/12 bg-paper px-4 py-2.5 text-[15px] text-ink outline-none focus:border-blue"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wide text-ink/65" htmlFor="certificateType">
                Certificate Type
              </label>
              <input
                id="certificateType"
                type="text"
                list="certificate-type-options"
                value={certificateType}
                onChange={(e) => setCertificateType(e.target.value)}
                placeholder={DEFAULT_CERTIFICATE_TYPE}
                className="w-40 rounded-xl border border-ink/12 bg-paper px-4 py-2.5 text-[15px] text-ink outline-none focus:border-blue"
              />
              <datalist id="certificate-type-options">
                {CERTIFICATE_TYPES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wide text-ink/65" htmlFor="count">
                Number Of Links
              </label>
              <input
                id="count"
                type="number"
                min={1}
                max={500}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-32 rounded-xl border border-ink/12 bg-paper px-4 py-2.5 text-[15px] text-ink outline-none focus:border-blue"
              />
            </div>
            <div className="relative">
              <AnnotationTag className="absolute -top-8 right-0 hidden -rotate-3 bg-blue sm:inline-flex">
                → Generate
              </AnnotationTag>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || count < 1 || !programName.trim()}
                className={`${btnPrimary} px-6 py-2.5`}
              >
                {isGenerating ? "Generating…" : `Generate ${count || 0} Links →`}
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-3 text-xs font-semibold text-danger" role="alert">
              {error}
            </p>
          )}

          {justGenerated && (
            <div className="mt-5 rounded-xl border border-blue/20 bg-blue/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-blue">
                  {justGenerated.length} New Link{justGenerated.length === 1 ? "" : "s"}
                </p>
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="text-xs font-bold uppercase tracking-wide text-blue hover:underline"
                >
                  {copiedAll ? "Copied ✓" : "Copy All"}
                </button>
              </div>
              <ul className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
                {justGenerated.map((l) => (
                  <li key={l.token} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink/70">
                      {l.url}
                    </span>
                    <CopyButton text={l.url} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-dashed border-ink/15">
          <CornerHandles />
          <span className="absolute -top-2.5 left-4 z-10 bg-paper px-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/40">
            Component
          </span>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-ink/40">
                  <th className="px-5 pb-3 pt-6">Status</th>
                  <th className="px-3 pb-3 pt-6">Course</th>
                  <th className="px-3 pb-3 pt-6">Link</th>
                  <th className="px-3 pb-3 pt-6">Created</th>
                  <th className="px-5 pb-3 pt-6">Claimed By</th>
                </tr>
              </thead>
              <tbody>
                {links.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-ink/40">
                      No links generated yet.
                    </td>
                  </tr>
                )}
                {links.map((l) => (
                  <tr key={l.token} className="border-b border-ink/5 last:border-0">
                    <td className="px-5 py-3">
                      <StatusPill used={l.used} />
                    </td>
                    <td className="px-3 py-3 text-xs text-ink/55">
                      {l.programName}
                      <span className="text-ink/35"> · {l.certificateType}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex max-w-[260px] items-center gap-2">
                        <span className="truncate font-mono text-xs text-ink/70">{l.url}</span>
                        {!l.used && <CopyButton text={l.url} />}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-ink/55">{formatDate(l.createdAt)}</td>
                    <td className="px-5 py-3 text-xs text-ink/55">
                      {l.recipientName ?? (l.used ? l.certificateId : "—")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
