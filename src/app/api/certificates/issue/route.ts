import { NextResponse, type NextRequest } from "next/server";
import { buildVerificationUrl } from "@/lib/siteUrl";
import { renderCertificatePdf } from "@/lib/certificatePdf";
import {
  certificateIdExists,
  markCertificateEmailSent,
  saveIssuedCertificate,
  type IssuedCertificate,
} from "@/lib/certificateStore";
import { QUIZ_QUESTIONS } from "@/data/quiz";
import { claimToken, findClaimToken } from "@/lib/claimTokenStore";
import { isSmtpConfigured, sendCertificateEmail } from "@/lib/mailer";
import { validateSubmission, type QuizKey, type SubmissionData } from "@/lib/submission";
import {
  DEFAULT_CERTIFICATE_TYPE,
  WORKSHOP_COMPANY_NAME,
  WORKSHOP_DURATION,
  WORKSHOP_FOUNDER_NAME,
  WORKSHOP_FOUNDER_TITLE,
  WORKSHOP_PROGRAM_NAME,
  formatIssueDate,
  generateCertificateId,
} from "@/lib/workshop";

function generateUniqueCertificateId(): string {
  for (let attempts = 0; attempts < 20; attempts += 1) {
    const id = generateCertificateId();
    if (!certificateIdExists(id)) return id;
  }
  throw new Error("Could not allocate a unique certificate ID.");
}

function scoreQuiz(answers: Partial<Record<QuizKey, string>> | undefined): number {
  if (!answers) return 0;
  return QUIZ_QUESTIONS.reduce(
    (acc, q) => acc + (answers[q.key] === q.correctAnswer ? 1 : 0),
    0
  );
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = body as Partial<SubmissionData> & { token?: string };
  const validationError = validateSubmission(data);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { token } = data;
  if (!token || typeof token !== "string") {
    return NextResponse.json(
      { error: "Missing claim link. Open your certificate link again to continue." },
      { status: 400 }
    );
  }
  const claim = findClaimToken(token);
  if (!claim) {
    return NextResponse.json(
      { error: "This claim link is invalid. Ask your workshop organizer for a new one." },
      { status: 403 }
    );
  }
  if (claim.used) {
    return NextResponse.json(
      { error: "This claim link has already been used. Each link works once." },
      { status: 409 }
    );
  }

  let certificateId: string;
  try {
    certificateId = generateUniqueCertificateId();
  } catch {
    return NextResponse.json(
      { error: "Could not issue a certificate. Please try again." },
      { status: 500 }
    );
  }

  if (!claimToken(token, certificateId)) {
    return NextResponse.json(
      { error: "This claim link has already been used. Each link works once." },
      { status: 409 }
    );
  }

  const emptyAnswers = { question1: "", question2: "", question3: "", question4: "" };
  const quizAnswers = data.quizAnswers ?? emptyAnswers;
  const quizScore = scoreQuiz(quizAnswers);

  const record: IssuedCertificate = {
    certificateId,
    recipientName: data.fullName!.trim(),
    programName: claim.programName || WORKSHOP_PROGRAM_NAME,
    certificateType: claim.certificateType || DEFAULT_CERTIFICATE_TYPE,
    duration: WORKSHOP_DURATION,
    companyName: WORKSHOP_COMPANY_NAME,
    issueDate: formatIssueDate(new Date()),
    founderName: WORKSHOP_FOUNDER_NAME,
    founderTitle: WORKSHOP_FOUNDER_TITLE,
    email: data.email!.trim(),
    phone: data.phone!.trim(),
    college: data.college!.trim(),
    quizAnswers,
    quizScore,
    workshopRating: data.workshopRating!,
    usefulnessRating: data.usefulnessRating!,
    engagementRating: data.engagementRating!,
    practicalRating: data.practicalRating!,
    likedMost: data.likedMost?.trim() || undefined,
    improvementSuggestion: data.improvementSuggestion?.trim() || undefined,
    issuedAt: new Date().toISOString(),
    emailSent: false,
  };

  saveIssuedCertificate(record);

  let emailSent = false;
  let emailError: string | undefined;
  if (isSmtpConfigured()) {
    try {
      const pdfBuffer = await renderCertificatePdf(certificateId);
      await sendCertificateEmail({
        to: record.email,
        recipientName: record.recipientName,
        certificateId,
        verificationUrl: buildVerificationUrl(certificateId),
        pdfBuffer,
      });
      emailSent = true;
    } catch (err) {
      emailError = err instanceof Error ? err.message : "Unknown email error.";
      console.error(`[certificates/issue] Failed to email ${certificateId}:`, err);
    }
  }
  markCertificateEmailSent(certificateId, emailSent);

  return NextResponse.json({
    certificateId,
    issueDate: record.issueDate,
    programName: record.programName,
    certificateType: record.certificateType,
    emailSent,
    emailError,
  });
}
