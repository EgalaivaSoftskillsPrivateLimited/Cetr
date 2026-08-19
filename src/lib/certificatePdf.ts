import puppeteer from "puppeteer";
import { getSiteUrl } from "@/utils/qrcode";

/**
 * Renders /certificate-print for the given certificate through headless
 * Chromium so the emailed/downloaded PDF matches the on-screen design
 * exactly — no separate PDF template to maintain.
 */
export async function renderCertificatePdf(certificateId: string): Promise<Buffer> {
  const url = `${getSiteUrl()}/certificate-print?id=${encodeURIComponent(certificateId)}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.waitForSelector(".cert-container");
    await page.emulateMediaType("print");

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
