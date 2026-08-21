export const WORKSHOP_PROGRAM_NAME = "AI Engineering Workshop";
export const WORKSHOP_DURATION = "90 Minutes";
export const WORKSHOP_COMPANY_NAME = "Egalaiva Technologies";
export const WORKSHOP_FOUNDER_NAME = "Aadhithya S";
export const WORKSHOP_FOUNDER_TITLE = "Director- Egalaiva Softskills Pvt. Ltd.";

/** Renders on the certificate as "Certificate Of <type>". */
export const CERTIFICATE_TYPES = ["Appreciation", "Completion", "Participation", "Achievement"] as const;
export type CertificateType = (typeof CERTIFICATE_TYPES)[number];
export const DEFAULT_CERTIFICATE_TYPE: CertificateType = "Appreciation";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatIssueDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`;
}

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomIndex(max: number): number {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function generateCertificateId(): string {
  let id = "";
  for (let i = 0; i < 8; i += 1) {
    id += ID_CHARS[randomIndex(ID_CHARS.length)];
  }
  return `EGALAIVA-${id}`;
}
