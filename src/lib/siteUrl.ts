/**
 * Browser: use the current origin so on-screen QR codes match the site
 * the participant is actually on.
 * Server: prefer SITE_URL (needed for Puppeteer to fetch /certificate-print).
 */
export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const configured = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  return (configured ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function buildVerificationUrl(certificateId: string): string {
  return `${getSiteUrl()}/verify/${encodeURIComponent(certificateId)}`;
}
