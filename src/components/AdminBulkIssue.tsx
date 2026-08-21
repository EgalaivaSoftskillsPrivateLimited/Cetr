"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, btnSecondary, CornerHandles, Eyebrow } from "@/ui";
import { CERTIFICATE_TYPES, DEFAULT_CERTIFICATE_TYPE, WORKSHOP_PROGRAM_NAME } from "@/lib/workshop";

interface ColumnMapping {
  fullName: string;
  email: string;
  phone: string;
  college: string;
}

interface BulkRowResult {
  row: number;
  fullName: string;
  email: string;
  status: "success" | "error";
  certificateId?: string;
  emailSent?: boolean;
  error?: string;
}

interface BulkIssueJob {
  id: string;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  status: "running" | "done";
  results: BulkRowResult[];
}

type Phase = "upload" | "mapping" | "processing" | "done";

function guessColumn(headers: string[], keywords: string[]): string {
  const lower = headers.map((h) => h.toLowerCase());
  for (const kw of keywords) {
    const idx = lower.findIndex((h) => h.includes(kw));
    if (idx !== -1) return headers[idx];
  }
  return "";
}

const selectClass =
  "w-full rounded-xl border border-ink/12 bg-paper px-4 py-2.5 text-[15px] text-ink outline-none focus:border-blue";

export default function AdminBulkIssue({ username }: { username: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("upload");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    fullName: "",
    email: "",
    phone: "",
    college: "",
  });
  const [programName, setProgramName] = useState(WORKSHOP_PROGRAM_NAME);
  const [certificateType, setCertificateType] = useState<string>(DEFAULT_CERTIFICATE_TYPE);

  const [job, setJob] = useState<BulkIssueJob | null>(null);

  const handleFileSelected = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/bulk-issue/parse", { method: "POST", body: formData });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Couldn't read this file.");
        return;
      }

      setHeaders(body.headers);
      setRows(body.rows);
      setMapping({
        fullName: guessColumn(body.headers, ["name"]),
        email: guessColumn(body.headers, ["email", "mail"]),
        phone: guessColumn(body.headers, ["phone", "mobile", "contact", "whatsapp"]),
        college: guessColumn(body.headers, ["college", "organization", "institution", "education", "school"]),
      });
      setPhase("mapping");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const pollJob = (jobId: string) => {
    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/bulk-issue/status/${jobId}`);
        if (!res.ok) return;
        const data: BulkIssueJob = await res.json();
        setJob(data);
        if (data.status === "done") {
          window.clearInterval(interval);
          setPhase("done");
        }
      } catch {
        // transient — next tick will retry
      }
    }, 1200);
  };

  const handleGenerate = async () => {
    if (!mapping.fullName || !mapping.email) {
      setError("Map at least the Full Name and Email columns.");
      return;
    }
    setError(null);
    setIsStarting(true);
    try {
      const res = await fetch("/api/admin/bulk-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mapping, rows, programName, certificateType }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Couldn't start bulk issuance.");
        return;
      }
      setJob({ id: body.jobId, total: rows.length, processed: 0, succeeded: 0, failed: 0, status: "running", results: [] });
      setPhase("processing");
      pollJob(body.jobId);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleStartOver = () => {
    setPhase("upload");
    setHeaders([]);
    setRows([]);
    setJob(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const successfulLinks =
    job?.results
      .filter((r) => r.status === "success" && r.certificateId)
      .map((r) => `${window.location.origin}/verify/${r.certificateId}`) ?? [];

  return (
    <div className="min-h-screen bg-paper px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow>Admin · {username}</Eyebrow>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
              Bulk issue from file.
            </h1>
            <p className="mt-2 text-sm text-ink/60">
              Upload a spreadsheet to generate a certificate for each row directly.
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className={`${btnSecondary} px-4 py-2.5`}
            >
              ← Links Dashboard
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/certificates")}
              className={`${btnSecondary} px-4 py-2.5`}
            >
              View Certificates
            </button>
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

          <p className="text-sm text-ink/60">
            No quiz or feedback step for these — certificates are issued straight from the
            spreadsheet, and nothing is emailed unless SMTP is configured.
          </p>

          {error && (
            <p className="mt-3 text-xs font-semibold text-danger" role="alert">
              {error}
            </p>
          )}

          {phase === "upload" && (
            <div className="mt-5 flex flex-col gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelected}
                disabled={isUploading}
                className="text-sm text-ink/70 file:mr-3 file:rounded-lg file:border-0 file:bg-blue file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-wide file:text-white"
              />
              {isUploading && <p className="text-xs text-ink/50">Reading file…</p>}
            </div>
          )}

          {phase === "mapping" && (
            <div className="mt-5 flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-ink/65">
                    Course / Program
                  </label>
                  <input
                    type="text"
                    value={programName}
                    onChange={(e) => setProgramName(e.target.value)}
                    className={selectClass}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-ink/65">
                    Certificate Type
                  </label>
                  <input
                    type="text"
                    list="bulk-certificate-type-options"
                    value={certificateType}
                    onChange={(e) => setCertificateType(e.target.value)}
                    placeholder={DEFAULT_CERTIFICATE_TYPE}
                    className={selectClass}
                  />
                  <datalist id="bulk-certificate-type-options">
                    {CERTIFICATE_TYPES.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-tight text-ink">
                  Map Columns
                </h2>
                <p className="mt-1 text-xs text-ink/50">
                  {rows.length} row{rows.length === 1 ? "" : "s"} detected. Full Name and Email
                  are required.
                </p>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(
                    [
                      ["fullName", "Full Name *"],
                      ["email", "Email *"],
                      ["phone", "Phone"],
                      ["college", "College / Organization"],
                    ] as const
                  ).map(([field, label]) => (
                    <div key={field} className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wide text-ink/65">
                        {label}
                      </label>
                      <select
                        value={mapping[field]}
                        onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                        className={selectClass}
                      >
                        <option value="">— None —</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-tight text-ink">Preview</h2>
                <div className="mt-2 overflow-x-auto rounded-xl border border-ink/10">
                  <table className="w-full min-w-[480px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-ink/10 text-[10px] font-bold uppercase tracking-wide text-ink/40">
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Phone</th>
                        <th className="p-2">College</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 5).map((r, i) => (
                        <tr key={i} className="border-b border-ink/5 last:border-0">
                          <td className="p-2">{mapping.fullName ? r[mapping.fullName] : "—"}</td>
                          <td className="p-2">{mapping.email ? r[mapping.email] : "—"}</td>
                          <td className="p-2">{mapping.phone ? r[mapping.phone] : "—"}</td>
                          <td className="p-2">{mapping.college ? r[mapping.college] : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isStarting}
                  className={`${btnPrimary} px-6 py-2.5`}
                >
                  {isStarting ? "Starting…" : `Generate ${rows.length} Certificates →`}
                </button>
                <button type="button" onClick={handleStartOver} className={`${btnSecondary} px-6 py-2.5`}>
                  Start Over
                </button>
              </div>
            </div>
          )}

          {(phase === "processing" || phase === "done") && job && (
            <div className="mt-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold uppercase tracking-wide text-ink/70">
                  {phase === "processing"
                    ? `Generating… ${job.processed} of ${job.total}`
                    : "Done"}
                </p>
                <p className="text-xs font-bold uppercase tracking-wide text-ink/45">
                  {job.succeeded} Succeeded · {job.failed} Failed
                </p>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-2 rounded-full bg-blue transition-all duration-300"
                  style={{ width: `${job.total > 0 ? (job.processed / job.total) * 100 : 0}%` }}
                />
              </div>

              {phase === "done" && (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(successfulLinks.join("\n"));
                    }}
                    disabled={successfulLinks.length === 0}
                    className={`${btnSecondary} px-6 py-2.5`}
                  >
                    Copy All Verify Links
                  </button>
                  <button type="button" onClick={handleStartOver} className={`${btnPrimary} px-6 py-2.5`}>
                    Issue Another Batch →
                  </button>
                </div>
              )}

              {job.results.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-ink/10">
                  <table className="w-full min-w-[560px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-ink/10 text-[10px] font-bold uppercase tracking-wide text-ink/40">
                        <th className="p-2">Row</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Certificate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {job.results.map((r) => (
                        <tr key={r.row} className="border-b border-ink/5 last:border-0">
                          <td className="p-2 text-ink/50">{r.row}</td>
                          <td className="p-2">{r.fullName}</td>
                          <td className="p-2">{r.email}</td>
                          <td className="p-2">
                            {r.status === "success" ? (
                              <span className="inline-flex items-center rounded-full bg-lime px-2.5 py-1 text-[11px] font-bold text-lime-ink">
                                Issued{r.emailSent ? " · Emailed" : ""}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full border border-danger/30 px-2.5 py-1 text-[11px] font-bold text-danger">
                                {r.error ?? "Failed"}
                              </span>
                            )}
                          </td>
                          <td className="p-2 font-mono">{r.certificateId ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
