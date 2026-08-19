import { NextResponse, type NextRequest } from "next/server";
import { buildVerificationUrl } from "@/utils/qrcode";
import { renderCertificatePdf } from "@/lib/certificatePdf";
import {
  certificateIdExists,
  markCertificateEmailSent,
  saveIssuedCertificate,
  type IssuedCertificate,
} from "@/lib/certificateStore";
import { sendCertificateEmail } from "@/lib/mailer";
import { validateSubmission, type SubmissionData } from "@/lib/submission";
import {
  WORKSHOP_COMPANY_NAME,
  WORKSHOP_DURATION,
  WORKSHOP_FOUNDER_NAME,
  WORKSHOP_FOUNDER_TITLE,
  WORKSHOP_PROGRAM_NAME,
  formatIssueDate,
  generateCertificateId,
} from "@/lib/workshop";

function generateUniqueCertificateId(): string {
  let id = generateCertificateId();
  let attempts = 0;
  while (certificateIdExists(id) && attempts < 5) {
    id = generateCertificateId();
    attempts += 1;
  }
  return id;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = body as Partial<SubmissionData>;
  const validationError = validateSubmission(data);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const certificateId = generateUniqueCertificateId();

  const record: IssuedCertificate = {
    certificateId,
    recipientName: data.fullName!.trim(),
    programName: WORKSHOP_PROGRAM_NAME,
    duration: WORKSHOP_DURATION,
    companyName: WORKSHOP_COMPANY_NAME,
    issueDate: formatIssueDate(new Date()),
    founderName: WORKSHOP_FOUNDER_NAME,
    founderTitle: WORKSHOP_FOUNDER_TITLE,
    email: data.email!.trim(),
    phone: data.phone!.trim(),
    college: data.college!.trim(),
    quizAnswers: data.quizAnswers ?? { question1: "", question2: "", question3: "", question4: "" },
    quizScore: data.quizScore ?? 0,
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
  markCertificateEmailSent(certificateId, emailSent);

  return NextResponse.json({ certificateId, emailSent, emailError });
}
