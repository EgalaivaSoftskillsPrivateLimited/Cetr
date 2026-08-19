# Egalaiva Certificate Portal

Issues and verifies Egalaiva program completion certificates. Built with Next.js.

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in SMTP_* to enable emailing certificates
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

- `/` — the AI Engineering Workshop certificate claim flow (personal details → quiz → feedback → certificate).
- `/certificate-print?id=<CERTIFICATE_ID>` — renders a printable certificate for the given ID (uses the sample `CERT-2025-8892` if `id` is omitted). Also what the server renders to PDF for emails.
- `/verify/<CERTIFICATE_ID>` — public verification page. Shows the recipient's details and lets them view/download the certificate. This is the URL encoded in each certificate's QR code.

## How a certificate gets issued

1. A participant completes all 3 steps of the claim flow on `/`, which `POST`s to `/api/certificates/issue`.
2. The server generates a unique certificate ID and saves **metadata only** (name, email, quiz score, ratings, etc.) to `private/certificates-store.json` — gitignored, never committed. No PDF is stored anywhere.
3. The server renders `/certificate-print?id=<id>` through headless Chromium (`src/lib/certificatePdf.ts`) to produce the PDF on demand, and emails it via SMTP (`src/lib/mailer.ts`).
4. `/certificate-print` and `/verify/<id>` look up the same metadata (`src/data/certificates.ts` merges the static seed data with the store) and re-render the certificate live — so re-downloading or re-verifying never depends on a stored file.

If SMTP isn't configured (or the send fails), the certificate is still issued and shown to the participant — they just see a note that the email didn't go out automatically, with a retry button that calls `/api/certificates/<id>/email`.

## Adding a certificate manually

1. Add an entry to `src/data/certificates.ts` (recipient name, program, dates, etc.) keyed by a unique certificate ID.
2. Print/export the certificate from `/certificate-print?id=<CERTIFICATE_ID>` and save the resulting PDF to `public/certificates/<CERTIFICATE_ID>.pdf`, matching the `pdfPath` in the data entry.
3. The certificate is now verifiable and downloadable at `/verify/<CERTIFICATE_ID>`, and its QR code will point there.

## Configuration

See `.env.example` for the full list. Key ones:

- `SITE_URL` — e.g. `https://your-deployed-domain.com`. Used for QR/verification links **and** by the headless-Chromium PDF renderer to fetch `/certificate-print`, so it must be reachable by the server itself. Defaults to `http://localhost:3000` in development.
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` — SMTP credentials for sending certificate emails. Without these, certificates still issue but aren't emailed.

**Deployment note:** PDF generation uses the full `puppeteer` package (bundled Chromium), which needs a normal Node process/container — it will **not** run on Vercel's default serverless functions without switching to `puppeteer-core` + a serverless Chromium build (e.g. `@sparticuz/chromium`). This app is set up for a self-hosted Node server (`npm run build && npm run start`) or Docker/VPS deployment.

## Note on `public/`

Everything under `public/` is served as a public static file. Don't put source data (spreadsheets, unpublished documents, etc.) there — keep it in the gitignored `private/` folder instead.
