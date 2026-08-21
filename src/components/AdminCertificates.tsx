"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import { AnnotationTag, btnPrimary, btnSecondary, CornerHandles, Eyebrow } from "@/ui";
import type { IssuedCertificate } from "@/lib/certificateStore";

type SourceFilter = "all" | "self-serve" | "bulk-admin";
type EmailFilter = "all" | "sent" | "not-sent";

const ALL = "__all__";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SourcePill({ source }: { source?: "self-serve" | "bulk-admin" }) {
  return source === "bulk-admin" ? (
    <span className="inline-flex items-center rounded-full border border-blue/30 px-2.5 py-1 text-[11px] font-bold text-blue">
      Bulk
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-lime px-2.5 py-1 text-[11px] font-bold text-lime-ink">
      Self-Serve
    </span>
  );
}

export default function AdminCertificates({
  username,
  certificates,
}: {
  username: string;
  certificates: IssuedCertificate[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [emailFilter, setEmailFilter] = useState<EmailFilter>("all");
  const [courseFilter, setCourseFilter] = useState(ALL);
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const courses = useMemo(
    () => Array.from(new Set(certificates.map((c) => c.programName))).sort(),
    [certificates]
  );
  const types = useMemo(
    () => Array.from(new Set(certificates.map((c) => c.certificateType))).sort(),
    [certificates]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

    return certificates.filter((c) => {
      if (sourceFilter !== "all" && (c.source ?? "self-serve") !== sourceFilter) return false;
      if (emailFilter === "sent" && !c.emailSent) return false;
      if (emailFilter === "not-sent" && c.emailSent) return false;
      if (courseFilter !== ALL && c.programName !== courseFilter) return false;
      if (typeFilter !== ALL && c.certificateType !== typeFilter) return false;

      const issuedAt = new Date(c.issuedAt).getTime();
      if (from !== null && issuedAt < from) return false;
      if (to !== null && issuedAt > to) return false;

      if (!q) return true;
      return (
        c.recipientName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.certificateId.toLowerCase().includes(q) ||
        c.college.toLowerCase().includes(q)
      );
    });
  }, [certificates, search, sourceFilter, emailFilter, courseFilter, typeFilter, fromDate, toDate]);

  const hasActiveFilters =
    search.trim() !== "" ||
    sourceFilter !== "all" ||
    emailFilter !== "all" ||
    courseFilter !== ALL ||
    typeFilter !== ALL ||
    fromDate !== "" ||
    toDate !== "";

  const handleClearFilters = () => {
    setSearch("");
    setSourceFilter("all");
    setEmailFilter("all");
    setCourseFilter(ALL);
    setTypeFilter(ALL);
    setFromDate("");
    setToDate("");
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const handleExport = () => {
    const sheetRows = filtered.map((c) => ({
      "Certificate ID": c.certificateId,
      "Full Name": c.recipientName,
      Email: c.email,
      Phone: c.phone,
      College: c.college,
      Course: c.programName,
      "Certificate Type": c.certificateType,
      "Quiz Score": c.quizScore,
      "Workshop Rating": c.workshopRating,
      "Usefulness Rating": c.usefulnessRating,
      "Engagement Rating": c.engagementRating,
      "Practical Rating": c.practicalRating,
      "Liked Most": c.likedMost ?? "",
      "Improvement Suggestion": c.improvementSuggestion ?? "",
      Source: c.source ?? "self-serve",
      "Email Sent": c.emailSent ? "Yes" : "No",
      "Issued At": c.issuedAt,
    }));
    const sheet = XLSX.utils.json_to_sheet(sheetRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Certificates");
    XLSX.writeFile(workbook, `certificates-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-paper px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow>Admin · {username}</Eyebrow>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
              Everyone who&apos;s been issued a certificate.
            </h1>
            <p className="mt-2 text-sm text-ink/60">{certificates.length} issued in total</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <Link href="/admin" className={`${btnSecondary} px-4 py-2.5`}>
              ← Links Dashboard
            </Link>
            <Link href="/admin/bulk" className={`${btnSecondary} px-4 py-2.5`}>
              Bulk Issue From File
            </Link>
            <button type="button" onClick={handleLogout} className={`${btnSecondary} px-4 py-2.5`}>
              Log Out
            </button>
          </div>
        </div>

        <div className="relative rounded-2xl border border-dashed border-ink/15 p-6">
          <CornerHandles />
          <span className="absolute -top-2.5 left-4 bg-paper px-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/40">
            Filters
          </span>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-ink/65" htmlFor="search">
                  Search
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="Name, email, college, or certificate ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-ink/12 bg-paper px-4 py-2.5 text-[15px] text-ink outline-none focus:border-blue sm:w-64"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-ink/65" htmlFor="course">
                  Course
                </label>
                <select
                  id="course"
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="rounded-xl border border-ink/12 bg-paper px-4 py-2.5 text-[15px] text-ink outline-none focus:border-blue"
                >
                  <option value={ALL}>All</option>
                  {courses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-ink/65" htmlFor="type">
                  Certificate Type
                </label>
                <select
                  id="type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-xl border border-ink/12 bg-paper px-4 py-2.5 text-[15px] text-ink outline-none focus:border-blue"
                >
                  <option value={ALL}>All</option>
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-ink/65" htmlFor="source">
                  Source
                </label>
                <select
                  id="source"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
                  className="rounded-xl border border-ink/12 bg-paper px-4 py-2.5 text-[15px] text-ink outline-none focus:border-blue"
                >
                  <option value="all">All</option>
                  <option value="self-serve">Self-Serve</option>
                  <option value="bulk-admin">Bulk</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-ink/65" htmlFor="email">
                  Emailed
                </label>
                <select
                  id="email"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value as EmailFilter)}
                  className="rounded-xl border border-ink/12 bg-paper px-4 py-2.5 text-[15px] text-ink outline-none focus:border-blue"
                >
                  <option value="all">All</option>
                  <option value="sent">Sent</option>
                  <option value="not-sent">Not Sent</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-ink/65" htmlFor="fromDate">
                  Issued From
                </label>
                <input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="rounded-xl border border-ink/12 bg-paper px-4 py-2.5 text-[15px] text-ink outline-none focus:border-blue"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-ink/65" htmlFor="toDate">
                  Issued To
                </label>
                <input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rounded-xl border border-ink/12 bg-paper px-4 py-2.5 text-[15px] text-ink outline-none focus:border-blue"
                />
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="rounded-xl border border-ink/15 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-ink/60 transition-colors hover:bg-ink/5"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="relative">
              <AnnotationTag className="absolute -top-8 right-0 hidden -rotate-3 sm:inline-flex">
                → Download
              </AnnotationTag>
              <button
                type="button"
                onClick={handleExport}
                disabled={filtered.length === 0}
                className={`${btnPrimary} px-6 py-2.5`}
              >
                Export To Excel ↓
              </button>
            </div>
          </div>

          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-ink/45">
            Showing {filtered.length} of {certificates.length}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-dashed border-ink/15">
          <CornerHandles />
          <span className="absolute -top-2.5 left-4 z-10 bg-paper px-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/40">
            Component
          </span>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-ink/40">
                  <th className="px-5 pb-3 pt-6">Name</th>
                  <th className="px-3 pb-3 pt-6">Email</th>
                  <th className="px-3 pb-3 pt-6">Phone</th>
                  <th className="px-3 pb-3 pt-6">Course</th>
                  <th className="px-3 pb-3 pt-6">Quiz</th>
                  <th className="px-3 pb-3 pt-6">Source</th>
                  <th className="px-3 pb-3 pt-6">Emailed</th>
                  <th className="px-3 pb-3 pt-6">Issued</th>
                  <th className="px-5 pb-3 pt-6">Certificate</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-sm text-ink/40">
                      No certificates match.
                    </td>
                  </tr>
                )}
                {filtered.map((c) => (
                  <Fragment key={c.certificateId}>
                    <tr
                      onClick={() =>
                        setExpandedId((id) => (id === c.certificateId ? null : c.certificateId))
                      }
                      className="cursor-pointer border-b border-ink/5 last:border-0 hover:bg-ink/[0.02]"
                    >
                      <td className="px-5 py-3 font-semibold text-ink">{c.recipientName}</td>
                      <td className="px-3 py-3 text-xs text-ink/70">{c.email}</td>
                      <td className="px-3 py-3 text-xs text-ink/70">{c.phone}</td>
                      <td className="px-3 py-3 text-xs text-ink/55">
                        {c.programName}
                        <span className="text-ink/35"> · {c.certificateType}</span>
                      </td>
                      <td className="px-3 py-3 text-xs text-ink/55">{c.quizScore} / 4</td>
                      <td className="px-3 py-3">
                        <SourcePill source={c.source} />
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {c.emailSent ? (
                          <span className="text-blue">Yes</span>
                        ) : (
                          <span className="text-ink/35">No</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-ink/55">{formatDate(c.issuedAt)}</td>
                      <td className="px-5 py-3 text-xs">
                        <Link
                          href={`/verify/${encodeURIComponent(c.certificateId)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-blue hover:underline"
                        >
                          {c.certificateId}
                        </Link>
                      </td>
                    </tr>
                    {expandedId === c.certificateId && (
                      <tr className="border-b border-ink/5 bg-ink/[0.02] last:border-0">
                        <td colSpan={9} className="px-5 py-4">
                          <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                            <div>
                              <p className="font-bold uppercase tracking-wide text-ink/50">
                                Ratings
                              </p>
                              <p className="mt-1 text-ink/70">
                                Workshop {c.workshopRating}/5 · Usefulness {c.usefulnessRating}/5 ·
                                Engagement {c.engagementRating}/5 · Practical {c.practicalRating}/5
                              </p>
                            </div>
                            <div>
                              <p className="font-bold uppercase tracking-wide text-ink/50">
                                College / Organization
                              </p>
                              <p className="mt-1 text-ink/70">{c.college || "—"}</p>
                            </div>
                            <div>
                              <p className="font-bold uppercase tracking-wide text-ink/50">
                                What They Liked Most
                              </p>
                              <p className="mt-1 text-ink/70">{c.likedMost || "—"}</p>
                            </div>
                            <div>
                              <p className="font-bold uppercase tracking-wide text-ink/50">
                                Improvement Suggestion
                              </p>
                              <p className="mt-1 text-ink/70">{c.improvementSuggestion || "—"}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
