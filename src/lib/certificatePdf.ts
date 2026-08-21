import puppeteer, { type Browser } from "puppeteer";
import { getSiteUrl } from "@/lib/siteUrl";

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
];

function launchOptions() {
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
  return {
    headless: true as const,
    args: LAUNCH_ARGS,
    ...(executablePath ? { executablePath } : {}),
  };
}

async function renderWithBrowser(browser: Browser, certificateId: string): Promise<Buffer> {
  const url = `${getSiteUrl()}/certificate-print?id=${encodeURIComponent(certificateId)}`;
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1123, height: 794, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60_000 });
    await page.waitForSelector(".cert-container");
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMediaType("print");

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

/**
 * Renders /certificate-print for the given certificate through headless
 * Chromium so the emailed/downloaded PDF matches the on-screen design
 * exactly — no separate PDF template to maintain.
 */
export async function renderCertificatePdf(certificateId: string): Promise<Buffer> {
  const browser = await puppeteer.launch(launchOptions());
  try {
    return await renderWithBrowser(browser, certificateId);
  } finally {
    await browser.close();
  }
}

/**
 * For rendering many certificates back-to-back (bulk issuance) — launches
 * Chromium once and reuses it across all of them instead of paying the
 * ~1-2s browser-launch cost per certificate.
 */
export async function withCertificatePdfBrowser<T>(
  fn: (render: (certificateId: string) => Promise<Buffer>) => Promise<T>
): Promise<T> {
  const browser = await puppeteer.launch(launchOptions());
  try {
    return await fn((certificateId) => renderWithBrowser(browser, certificateId));
  } finally {
    await browser.close();
  }
}
