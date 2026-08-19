export type QuizKey = "question1" | "question2" | "question3" | "question4";

export interface SubmissionData {
  fullName: string;
  email: string;
  phone: string;
  college: string;
  quizAnswers: Record<QuizKey, string>;
  quizScore: number;
  workshopRating: number;
  usefulnessRating: number;
  engagementRating: number;
  practicalRating: number;
  likedMost?: string;
  improvementSuggestion?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSubmission(data: Partial<SubmissionData> | null): string | null {
  if (!data) return "Missing submission data.";
  if (!data.fullName || data.fullName.trim().length < 2) {
    return "A valid full name is required.";
  }
  if (!data.email || !EMAIL_RE.test(data.email.trim())) {
    return "A valid email address is required.";
  }
  const digits = (data.phone ?? "").replace(/[^0-9]/g, "");
  if (digits.length < 7 || digits.length > 15) {
    return "A valid phone number is required.";
  }
  if (!data.college || data.college.trim().length < 2) {
    return "College / organization is required.";
  }
  if (
    !data.workshopRating ||
    !data.usefulnessRating ||
    !data.engagementRating ||
    !data.practicalRating
  ) {
    return "All feedback ratings are required.";
  }
  if (typeof data.quizScore !== "number") {
    return "Quiz score is required.";
  }
  return null;
}
