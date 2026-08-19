# Egalaiva Certificate Portal

Issues and verifies Egalaiva program completion certificates. Built with Next.js.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

- `/` — landing page with a certificate ID lookup form.
- `/certificate-print?id=<CERTIFICATE_ID>` — renders a printable certificate for the given ID (uses the sample `CERT-2025-8892` if `id` is omitted). Use your browser's Print dialog to save it as a PDF.
- `/verify/<CERTIFICATE_ID>` — public verification page. Shows the recipient's details and lets them download the issued PDF. This is the URL encoded in each certificate's QR code.

## Adding a certificate

1. Add an entry to `src/data/certificates.ts` (recipient name, program, dates, etc.) keyed by a unique certificate ID.
2. Print/export the certificate from `/certificate-print?id=<CERTIFICATE_ID>` and save the resulting PDF to `public/certificates/<CERTIFICATE_ID>.pdf`, matching the `pdfPath` in the data entry.
3. The certificate is now verifiable and downloadable at `/verify/<CERTIFICATE_ID>`, and its QR code will point there.

## Configuration

Set `SITE_URL` (e.g. `https://your-deployed-domain.com`) in your production environment so QR codes and verification links resolve to the right domain. It defaults to `http://localhost:3000` in development.

## Note on `public/`

Everything under `public/` is served as a public static file. Don't put source data (spreadsheets, unpublished documents, etc.) there — keep it in the gitignored `private/` folder instead.
