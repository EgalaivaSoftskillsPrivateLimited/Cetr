import { buildVerificationUrl } from "@/lib/siteUrl";
import { withCertificatePdfBrowser } from "@/lib/certificatePdf";
import {
  certificateIdExists,
  markCertificateEmailSent,
  saveIssuedCertificate,
  type IssuedCertificate,
} from "@/lib/certificateStore";
import { isSmtpConfigured, sendCertificateEmail } from "@/lib/mailer";
import {
  WORKSHOP_COMPANY_NAME,
  WORKSHOP_DURATION,
  WORKSHOP_FOUNDER_NAME,
  WORKSHOP_FOUNDER_TITLE,
  formatIssueDate,
  generateCertificateId,
} from "@/lib/workshop";
import { appendBulkResult } from "@/lib/bulkIssueJobs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface BulkRowInput {
  fullName?: string;
  email?: string;
  phone?: string;
  college?: string;
}

async function generateUniqueCertificateId(): Promise<string> {
  for (let attempts = 0; attempts < 20; attempts += 1) {
    const id = generateCertificateId();
    if (!(await certificateIdExists(id))) return id;
  }
  throw new Error("Could not allocate a unique certificate ID.");
}

async function processRow(
  jobId: string,
  rowNumber: number,
  row: BulkRowInput,
  programName: string,
  certificateType: string,
  smtpReady: boolean,
  render?: (certificateId: string) => Promise<Buffer>
): Promise<void> {
  const fullName = (row.fullName ?? "").trim();
  const email = (row.email ?? "").trim();
  const phone = (row.phone ?? "").trim();
  const college = (row.college ?? "").trim();

  if (fullName.length < 2) {
    appendBulkResult(jobId, {
      row: rowNumber,
      fullName,
      email,
      status: "error",
      error: "Missing or invalid name.",
    });
    return;
  }
  if (!EMAIL_RE.test(email)) {
    appendBulkResult(jobId, {
      row: rowNumber,
      fullName,
      email,
      status: "error",
      error: "Missing or invalid email.",
    });
    return;
  }

  let certificateId: string;
  try {
    certificateId = await generateUniqueCertificateId();
  } catch {
    appendBulkResult(jobId, {
      row: rowNumber,
      fullName,
      email,
      status: "error",
      error: "Could not allocate a certificate ID.",
    });
    return;
  }

  const record: IssuedCertificate = {
    certificateId,
    recipientName: fullName,
    programName,
    certificateType,
    duration: WORKSHOP_DURATION,
    companyName: WORKSHOP_COMPANY_NAME,
    issueDate: formatIssueDate(new Date()),
    founderName: WORKSHOP_FOUNDER_NAME,
    founderTitle: WORKSHOP_FOUNDER_TITLE,
    email,
    phone,
    college,
    quizAnswers: {},
    quizScore: 0,
    workshopRating: 0,
    usefulnessRating: 0,
    engagementRating: 0,
    practicalRating: 0,
    issuedAt: new Date().toISOString(),
    emailSent: false,
    source: "bulk-admin",
  };

  await saveIssuedCertificate(record);

  let emailSent = false;
  if (smtpReady && render) {
    try {
      const pdfBuffer = await render(certificateId);
      await sendCertificateEmail({
        to: email,
        recipientName: fullName,
        certificateId,
        verificationUrl: buildVerificationUrl(certificateId),
        pdfBuffer,
      });
      emailSent = true;
      await markCertificateEmailSent(certificateId, true);
    } catch (err) {
      console.error(`[bulk-issue] Failed to email ${certificateId}:`, err);
    }
  }

  appendBulkResult(jobId, {
    row: rowNumber,
    fullName,
    email,
    status: "success",
    certificateId,
    emailSent,
  });
}

export async function runBulkIssueJob(
  jobId: string,
  rows: BulkRowInput[],
  programName: string,
  certificateType: string
): Promise<void> {
  const smtpReady = isSmtpConfigured();

  if (smtpReady) {
    // Share one browser across the whole batch — much faster than a
    // launch-per-certificate, and only needed when we're actually emailing.
    await withCertificatePdfBrowser(async (render) => {
      for (let i = 0; i < rows.length; i += 1) {
        await processRow(jobId, i + 1, rows[i], programName, certificateType, smtpReady, render);
      }
    });
  } else {
    for (let i = 0; i < rows.length; i += 1) {
      await processRow(jobId, i + 1, rows[i], programName, certificateType, smtpReady);
    }
  }
}
