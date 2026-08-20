"use client";

import { useEffect, useState } from "react";
import Certificate from "@/components/Certificate";
import { buildVerificationUrl } from "@/lib/siteUrl";
import type { QuizKey, SubmissionData } from "@/lib/submission";
import { QUIZ_QUESTIONS } from "@/data/quiz";
import {
  WORKSHOP_COMPANY_NAME,
  WORKSHOP_DURATION,
  WORKSHOP_FOUNDER_NAME,
  WORKSHOP_FOUNDER_TITLE,
  WORKSHOP_PROGRAM_NAME,
  formatIssueDate,
} from "@/lib/workshop";
import {
  AnnotationTag,
  btnPrimary,
  btnSecondary,
  CornerHandles,
  CursorBadge,
  Eyebrow,
  fieldInput,
} from "@/ui";

type Step = 1 | 2 | 3 | 4;
type QuizPhase = "question" | "result";
type CertificateView = null | "view" | "download";

interface PersonalForm {
  fullName: string;
  email: string;
  phone: string;
  college: string;
}

type PersonalErrors = Partial<Record<keyof PersonalForm, string>>;

interface FeedbackState {
  workshopRating: number;
  usefulnessRating: number;
  engagementRating: number;
  practicalRating: number;
  likedMost: string;
  improvementSuggestion: string;
}

interface IssueCertificateResponse {
  certificateId: string;
  issueDate?: string;
  emailSent: boolean;
  emailError?: string;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PROGRESS_STEPS: { n: 1 | 2 | 3; label: string }[] = [
  { n: 1, label: "PERSONAL" },
  { n: 2, label: "QUIZ" },
  { n: 3, label: "FEEDBACK" },
];

const TAKEAWAYS = [
  "A verified digital certificate",
  "Official proof of completion",
  "A unique certificate ID & QR code",
  "Shareable on LinkedIn & your résumé",
];

function validatePersonal(form: PersonalForm): PersonalErrors {
  const errors: PersonalErrors = {};
  if (form.fullName.trim().length < 2) {
    errors.fullName = "Enter your full name.";
  } else if (form.fullName.trim().length > 80) {
    errors.fullName = "Name is too long for the certificate.";
  }
  if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  const digits = form.phone.replace(/[^0-9]/g, "");
  if (digits.length < 7 || digits.length > 15) {
    errors.phone = "Enter a valid phone number.";
  }
  if (form.college.trim().length < 2) {
    errors.college = "Enter your college or organization.";
  }
  return errors;
}

function quizScoreLabel(score: number): string {
  if (score === 4) return "EXCELLENT";
  if (score === 3) return "GREAT JOB";
  if (score === 2) return "GOOD START";
  return "KEEP LEARNING";
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink/65">
      <span className="h-1 w-1 rounded-full bg-blue" />
      {children}
    </label>
  );
}

const textareaClass =
  "w-full rounded-xl border border-ink/12 bg-paper px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-blue";

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 20c0-4.4 3.4-7 7-7s7 2.6 7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path
        d="M8 3H5a2 2 0 00-2 2c0 8.284 6.716 15 15 15a2 2 0 002-2v-3l-4-1-2 2a12 12 0 01-6-6l2-2-1-4z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CollegeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path d="M12 4L2 9l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path
        d="M6 11.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[17px] w-[17px]">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 9.5h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[17px] w-[17px]">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7v5l3.2 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[17px] w-[17px]">
      <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 13V9M9.5 3h5M12 3v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const WORKSHOP_INFO = [
  { Icon: CalendarIcon, title: "19 August 2026", subtitle: "Wednesday" },
  { Icon: ClockIcon, title: "06:30 PM", subtitle: "Onwards" },
  { Icon: TimerIcon, title: "90 Minutes", subtitle: "Live Online" },
];

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label="Overall workshop rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className="flex h-12 w-12 items-center justify-center text-4xl leading-none transition-transform active:scale-90"
        >
          <span className={value >= n ? "text-lime drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]" : "text-ink/15"}>
            {value >= n ? "★" : "☆"}
          </span>
        </button>
      ))}
    </div>
  );
}

function NumberRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="mt-2 flex gap-2" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onClick={() => onChange(n)}
            className={`flex h-11 flex-1 items-center justify-center rounded-xl border text-sm font-bold transition-colors ${
              value === n
                ? "border-blue bg-blue text-white"
                : "border-ink/12 bg-paper text-ink/50"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="flex flex-col gap-5 bg-navy-soft p-8 text-cream md:p-10">
      <Eyebrow on="dark">Certificate Claim</Eyebrow>
      <h1 className="text-[1.6rem] font-extrabold leading-[1.12] tracking-tight md:text-[2rem]">
        Claim Your Certificate
      </h1>
      <p className="text-sm leading-relaxed text-cream/70">
        Confirm your details, complete a quick knowledge check, and share your
        feedback to receive your AI Engineering Workshop certificate.
      </p>

      <div className="relative rounded-2xl border border-dashed border-white/25 p-4">
        <CornerHandles dark />
        <span className="absolute -top-2.5 left-4 bg-navy-soft px-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">
          AI Engineering Workshop
        </span>
        <ul className="flex flex-col gap-3.5">
          {WORKSHOP_INFO.map(({ Icon, title, subtitle }) => (
            <li key={title} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-lime">
                <Icon />
              </span>
              <span>
                <strong className="block text-sm font-bold">{title}</strong>
                <small className="block text-xs text-cream/45">{subtitle}</small>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-cream/45">
        Already have a certificate?{" "}
        <a href="/verify" className="font-semibold text-lime underline-offset-2 hover:underline">
          Verify it here
        </a>
      </p>

      <hr className="my-1 h-px w-full border-none bg-white/15" />

      <Eyebrow on="dark">What You&apos;ll Get</Eyebrow>
      <ul className="flex flex-col gap-3">
        {TAKEAWAYS.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[13px] leading-snug text-cream/70">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-lime">
              <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                <path d="M2 6l3 3 5-6" stroke="#16210a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {item}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function StepProgress({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-1.5">
      {PROGRESS_STEPS.map((s, idx) => (
        <div key={s.n} className="flex items-center gap-1.5">
          <span
            className={`text-[11px] font-bold uppercase tracking-wide ${
              step === s.n ? "text-blue" : step > s.n ? "text-ink" : "text-ink/30"
            }`}
          >
            {String(s.n).padStart(2, "0")} {s.label}
          </span>
          {idx < PROGRESS_STEPS.length - 1 && <span className="text-xs text-ink/20">→</span>}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState<Step>(1);

  const [personal, setPersonal] = useState<PersonalForm>({
    fullName: "",
    email: "",
    phone: "",
    college: "",
  });
  const [personalErrors, setPersonalErrors] = useState<PersonalErrors>({});

  const [questionIndex, setQuestionIndex] = useState(0);
  const [quizPhase, setQuizPhase] = useState<QuizPhase>("question");
  const [quizAnswers, setQuizAnswers] = useState<Record<QuizKey, string>>({
    question1: "",
    question2: "",
    question3: "",
    question4: "",
  });
  const [quizScore, setQuizScore] = useState(0);

  const [feedback, setFeedback] = useState<FeedbackState>({
    workshopRating: 0,
    usefulnessRating: 0,
    engagementRating: 0,
    practicalRating: 0,
    likedMost: "",
    improvementSuggestion: "",
  });
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [issueDate, setIssueDate] = useState<string>(formatIssueDate(new Date()));
  const [certificateEmailSent, setCertificateEmailSent] = useState(false);
  const [certView, setCertView] = useState<CertificateView>(null);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "saving" | "error">("idle");

  useEffect(() => {
    if (certView === "download") {
      const timer = window.setTimeout(() => window.print(), 350);
      return () => window.clearTimeout(timer);
    }
  }, [certView]);

  const setPersonalField = (field: keyof PersonalForm, value: string) => {
    setPersonal((prev) => ({ ...prev, [field]: value }));
    setPersonalErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePersonalContinue = () => {
    const errors = validatePersonal(personal);
    setPersonalErrors(errors);
    if (Object.keys(errors).length === 0) setStep(2);
  };

  const currentQuestion = QUIZ_QUESTIONS[questionIndex];
  const currentAnswerSelected = Boolean(quizAnswers[currentQuestion.key]);

  const handleSelectOption = (option: string) => {
    setQuizAnswers((prev) => ({ ...prev, [currentQuestion.key]: option }));
  };

  const handleQuizNext = () => {
    if (questionIndex < QUIZ_QUESTIONS.length - 1) {
      setQuestionIndex((i) => i + 1);
      return;
    }
    const score = QUIZ_QUESTIONS.reduce(
      (acc, q) => acc + (quizAnswers[q.key] === q.correctAnswer ? 1 : 0),
      0
    );
    setQuizScore(score);
    setQuizPhase("result");
  };

  const handleQuizBack = () => {
    if (questionIndex > 0) {
      setQuestionIndex((i) => i - 1);
      return;
    }
    setStep(1);
  };

  const handleFeedbackSubmit = async () => {
    if (
      feedback.workshopRating === 0 ||
      feedback.usefulnessRating === 0 ||
      feedback.engagementRating === 0 ||
      feedback.practicalRating === 0
    ) {
      setFeedbackError("Please rate every category before submitting.");
      return;
    }
    setFeedbackError(null);

    const data: SubmissionData = {
      fullName: personal.fullName.trim(),
      email: personal.email.trim(),
      phone: personal.phone.trim(),
      college: personal.college.trim(),
      quizAnswers,
      quizScore,
      workshopRating: feedback.workshopRating,
      usefulnessRating: feedback.usefulnessRating,
      engagementRating: feedback.engagementRating,
      practicalRating: feedback.practicalRating,
      likedMost: feedback.likedMost.trim() || undefined,
      improvementSuggestion: feedback.improvementSuggestion.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = (await res.json()) as IssueCertificateResponse;

      if (!res.ok || !body.certificateId) {
        setFeedbackError(body.error ?? "Something went wrong issuing your certificate. Please try again.");
        return;
      }

      setSubmission(data);
      setCertificateId(body.certificateId);
      setIssueDate(body.issueDate ?? formatIssueDate(new Date()));
      setCertificateEmailSent(body.emailSent);
      setStep(4);
    } catch {
      setFeedbackError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!certificateId) return;
    setDownloadStatus("saving");
    try {
      const res = await fetch(`/api/certificates/${encodeURIComponent(certificateId)}/pdf`);
      if (!res.ok) throw new Error("pdf failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${certificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setDownloadStatus("idle");
    } catch {
      setDownloadStatus("error");
      setCertView("download");
    }
  };

  const handleResendEmail = async () => {
    if (!certificateId) return;
    setEmailStatus("sending");
    try {
      const res = await fetch(`/api/certificates/${encodeURIComponent(certificateId)}/email`, {
        method: "POST",
      });
      const body = (await res.json()) as { emailSent: boolean };
      if (res.ok && body.emailSent) {
        setCertificateEmailSent(true);
        setEmailStatus("sent");
      } else {
        setEmailStatus("error");
      }
    } catch {
      setEmailStatus("error");
    }
  };

  if (step === 4 && submission && certificateId) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-navy px-5 py-10">
          <div className="relative mx-auto flex w-full max-w-[420px] animate-confirm-in flex-col items-center gap-3.5 rounded-[28px] border-[1.5px] border-dashed border-ink/15 bg-paper p-9 text-center shadow-[0_40px_80px_rgba(0,0,0,0.35)]">
            <CornerHandles />
            <AnnotationTag className="absolute -top-4 right-6 rotate-3 bg-blue">
              🎉 Certificate Ready
            </AnnotationTag>

            <div className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-blue" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 12l5 5 11-11" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <Eyebrow>You&apos;re All Set</Eyebrow>
            <h1 className="text-[1.5rem] font-extrabold uppercase tracking-tight text-ink">
              Your Certificate Is Ready
            </h1>
            <p className="text-sm leading-relaxed text-ink/60">
              Thank you for completing the AI Engineering Workshop, knowledge check, and feedback.
            </p>

            <div className="mt-1 w-full rounded-xl border border-ink/10 bg-ink/[0.03] p-4">
              <p className="text-lg font-extrabold text-ink">{submission.fullName}</p>
              <p className="mt-1 font-mono text-xs uppercase tracking-wide text-ink/45">
                Certificate ID: {certificateId}
              </p>
            </div>

            <div className="mt-2 flex w-full flex-col gap-3">
              <button type="button" onClick={() => setCertView("view")} className={`${btnPrimary} w-full`}>
                View Certificate
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadStatus === "saving"}
                className={`${btnSecondary} w-full`}
              >
                {downloadStatus === "saving" ? "Preparing PDF…" : "Download Certificate"}
              </button>
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={emailStatus === "sending"}
                className="w-full py-1 text-xs font-semibold uppercase tracking-wide text-ink/40 transition-colors hover:text-ink/70"
              >
                {emailStatus === "sending"
                  ? "Sending…"
                  : emailStatus === "sent"
                  ? "Sent ✓"
                  : emailStatus === "error"
                  ? "Failed — Tap To Retry"
                  : "Email Certificate Again"}
              </button>
            </div>

            <a
              href={`/verify/${encodeURIComponent(certificateId)}`}
              className="mt-1 text-xs font-semibold uppercase tracking-wide text-blue hover:underline"
            >
              Verify this certificate
            </a>

            <p className="mt-2 text-xs text-ink/40">
              {certificateEmailSent
                ? "A copy of your certificate has been sent to your registered email address."
                : "We couldn't email your certificate automatically — use Download, or try Email Certificate Again."}
            </p>

            <CursorBadge className="absolute -bottom-[18px] -left-[18px] hidden sm:flex" />
          </div>
        </div>

        {certView && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <button
              type="button"
              onClick={() => setCertView(null)}
              aria-label="Close certificate preview"
              className="no-print fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20"
            >
              ✕
            </button>
            <Certificate
              recipientName={submission.fullName}
              programName={WORKSHOP_PROGRAM_NAME}
              duration={WORKSHOP_DURATION}
              companyName={WORKSHOP_COMPANY_NAME}
              issueDate={issueDate}
              founderName={WORKSHOP_FOUNDER_NAME}
              founderTitle={WORKSHOP_FOUNDER_TITLE}
              certificateId={certificateId}
              verificationUrl={buildVerificationUrl(certificateId)}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-5 py-10">
      <div className="relative w-full max-w-[920px]">
        <AnnotationTag className="absolute -top-4 right-8 hidden -rotate-3 bg-blue sm:inline-flex">
          → Step {step} of 3
        </AnnotationTag>
        <CursorBadge className="absolute -bottom-[18px] -left-[18px] hidden sm:flex" />

        <div className="grid grid-cols-1 overflow-hidden rounded-[28px] shadow-[0_40px_80px_rgba(0,0,0,0.35)] md:grid-cols-[minmax(260px,340px)_1fr]">
          <Sidebar />

          <div className="flex flex-col gap-6 bg-paper p-8 md:p-10">
            <StepProgress step={step} />

            {step === 1 && (
              <div className="step-enter flex flex-col gap-6" key="step-1">
                <div>
                  <h2 className="text-2xl font-extrabold uppercase tracking-tight text-ink">
                    Get Your Certificate
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">
                    Enter your details to verify your AI Engineering Workshop participation and
                    prepare your certificate.
                  </p>
                </div>

                <div className="flex flex-col gap-[18px]">
                  <div className="flex flex-col gap-2">
                    <FieldLabel>Full Name</FieldLabel>
                    <div className={fieldInput}>
                      <span className="h-[18px] w-[18px] text-blue/70">
                        <PersonIcon />
                      </span>
                      <input
                        className="min-w-0 flex-1 border-none bg-transparent py-3 text-[15px] text-ink outline-none placeholder:text-ink/35"
                        type="text"
                        autoComplete="name"
                        placeholder="Enter your full name"
                        value={personal.fullName}
                        onChange={(e) => setPersonalField("fullName", e.target.value)}
                        aria-invalid={Boolean(personalErrors.fullName)}
                      />
                    </div>
                    {personalErrors.fullName ? (
                      <span className="text-xs font-semibold text-danger">{personalErrors.fullName}</span>
                    ) : (
                      <span className="text-xs text-ink/40">This name will appear on your certificate.</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <FieldLabel>Email Address</FieldLabel>
                    <div className={fieldInput}>
                      <span className="h-[18px] w-[18px] text-blue/70">
                        <MailIcon />
                      </span>
                      <input
                        className="min-w-0 flex-1 border-none bg-transparent py-3 text-[15px] text-ink outline-none placeholder:text-ink/35"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your email address"
                        value={personal.email}
                        onChange={(e) => setPersonalField("email", e.target.value)}
                        aria-invalid={Boolean(personalErrors.email)}
                      />
                    </div>
                    {personalErrors.email ? (
                      <span className="text-xs font-semibold text-danger">{personalErrors.email}</span>
                    ) : (
                      <span className="text-xs text-ink/40">Your certificate will be sent to this email.</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <FieldLabel>Phone Number</FieldLabel>
                      <div className={fieldInput}>
                        <span className="h-[18px] w-[18px] text-blue/70">
                          <PhoneIcon />
                        </span>
                        <input
                          className="min-w-0 flex-1 border-none bg-transparent py-3 text-[15px] text-ink outline-none placeholder:text-ink/35"
                          type="tel"
                          autoComplete="tel"
                          placeholder="+91 XXXXX XXXXX"
                          value={personal.phone}
                          onChange={(e) => setPersonalField("phone", e.target.value)}
                          aria-invalid={Boolean(personalErrors.phone)}
                        />
                      </div>
                      {personalErrors.phone && (
                        <span className="text-xs font-semibold text-danger">{personalErrors.phone}</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <FieldLabel>College / Organization</FieldLabel>
                      <div className={fieldInput}>
                        <span className="h-[18px] w-[18px] text-blue/70">
                          <CollegeIcon />
                        </span>
                        <input
                          className="min-w-0 flex-1 border-none bg-transparent py-3 text-[15px] text-ink outline-none placeholder:text-ink/35"
                          type="text"
                          autoComplete="organization"
                          placeholder="Your college or organization"
                          value={personal.college}
                          onChange={(e) => setPersonalField("college", e.target.value)}
                          aria-invalid={Boolean(personalErrors.college)}
                        />
                      </div>
                      {personalErrors.college && (
                        <span className="text-xs font-semibold text-danger">{personalErrors.college}</span>
                      )}
                    </div>
                  </div>
                </div>

                <button type="button" onClick={handlePersonalContinue} className={`${btnPrimary} mt-1 w-full py-[15px]`}>
                  Continue →
                </button>
                <p className="text-center text-xs text-ink/40">
                  Your details stay with the organizers — no spam, ever.
                </p>
              </div>
            )}

            {step === 2 && quizPhase === "question" && (
              <div className="step-enter flex flex-col gap-6" key={`step-2-q-${questionIndex}`}>
                <div>
                  <h2 className="text-2xl font-extrabold uppercase tracking-tight text-ink">
                    Quick Knowledge Check
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">
                    Answer these 4 questions based on what you learned during the AI Engineering
                    Workshop.
                  </p>
                </div>

                <div className="relative rounded-2xl border border-dashed border-ink/15 p-5">
                  <CornerHandles />
                  <span className="absolute -top-2.5 left-4 bg-paper px-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/40">
                    Question {questionIndex + 1} of {QUIZ_QUESTIONS.length}
                  </span>

                  <div className="mb-4 h-1 w-full rounded-full bg-ink/10">
                    <div
                      className="h-1 rounded-full bg-blue transition-all duration-300"
                      style={{
                        width: `${((questionIndex + 1) / QUIZ_QUESTIONS.length) * 100}%`,
                      }}
                    />
                  </div>

                  <h3 className="text-lg font-bold leading-snug text-ink">{currentQuestion.question}</h3>
                  <div className="mt-4 flex flex-col gap-3">
                    {currentQuestion.options.map((option) => {
                      const selected = quizAnswers[currentQuestion.key] === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => handleSelectOption(option)}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-4 text-left text-[15px] font-medium transition-colors ${
                            selected
                              ? "border-blue bg-blue/8 text-ink"
                              : "border-ink/12 bg-paper text-ink/75 active:bg-ink/5"
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              selected ? "border-blue bg-blue" : "border-ink/25"
                            }`}
                          >
                            {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                          </span>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleQuizBack}
                    className="shrink-0 rounded-xl border border-ink/15 px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-ink/60"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleQuizNext}
                    disabled={!currentAnswerSelected}
                    className={`${btnPrimary} flex-1 py-[15px]`}
                  >
                    {questionIndex === QUIZ_QUESTIONS.length - 1 ? "Submit Quiz →" : "Next →"}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && quizPhase === "result" && (
              <div className="step-enter flex flex-col items-center gap-4 py-10 text-center" key="step-2-result">
                <button
                  type="button"
                  onClick={() => {
                    setQuizPhase("question");
                    setQuestionIndex(QUIZ_QUESTIONS.length - 1);
                  }}
                  className="self-start text-xs font-semibold text-ink/40 transition-colors hover:text-ink/70"
                >
                  ← Back
                </button>
                <Eyebrow>Knowledge Check Complete</Eyebrow>
                <div className="text-5xl font-extrabold text-ink">
                  {quizScore} / {QUIZ_QUESTIONS.length}
                </div>
                <p className="text-sm font-bold uppercase tracking-wide text-ink/60">
                  {quizScore} / {QUIZ_QUESTIONS.length} Correct
                </p>
                <p className="text-lg font-extrabold uppercase tracking-wide text-blue">
                  {quizScoreLabel(quizScore)}
                </p>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className={`${btnPrimary} mt-2 w-full py-[15px]`}
                >
                  Continue To Feedback →
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="step-enter flex flex-col gap-6" key="step-3">
                <div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="mb-2 text-xs font-semibold text-ink/40 transition-colors hover:text-ink/70"
                  >
                    ← Back
                  </button>
                  <h2 className="text-2xl font-extrabold uppercase tracking-tight text-ink">
                    How Was Your Experience?
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">
                    Your feedback helps us improve future workshops.
                  </p>
                </div>

                <div>
                  <FieldLabel>How Would You Rate This Workshop?</FieldLabel>
                  <div className="mt-2">
                    <StarRating
                      value={feedback.workshopRating}
                      onChange={(n) => setFeedback((f) => ({ ...f, workshopRating: n }))}
                    />
                  </div>
                </div>

                <NumberRating
                  label="How Useful Was The Workshop?"
                  value={feedback.usefulnessRating}
                  onChange={(n) => setFeedback((f) => ({ ...f, usefulnessRating: n }))}
                />
                <NumberRating
                  label="How Engaging Was The Session?"
                  value={feedback.engagementRating}
                  onChange={(n) => setFeedback((f) => ({ ...f, engagementRating: n }))}
                />
                <NumberRating
                  label="How Would You Rate The Practical Demonstrations?"
                  value={feedback.practicalRating}
                  onChange={(n) => setFeedback((f) => ({ ...f, practicalRating: n }))}
                />

                <div className="flex flex-col gap-2">
                  <FieldLabel>What Did You Like Most?</FieldLabel>
                  <textarea
                    className={textareaClass}
                    rows={3}
                    placeholder="Share your thoughts..."
                    value={feedback.likedMost}
                    onChange={(e) => setFeedback((f) => ({ ...f, likedMost: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <FieldLabel>What Should We Improve?</FieldLabel>
                  <textarea
                    className={textareaClass}
                    rows={3}
                    placeholder="Your suggestion..."
                    value={feedback.improvementSuggestion}
                    onChange={(e) =>
                      setFeedback((f) => ({ ...f, improvementSuggestion: e.target.value }))
                    }
                  />
                </div>

                {feedbackError && (
                  <p className="text-xs font-semibold text-danger" role="alert">
                    {feedbackError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleFeedbackSubmit}
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className={`${btnPrimary} mt-1 w-full py-[15px]`}
                >
                  {isSubmitting ? "Generating Your Certificate…" : "Submit & Get My Certificate →"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
