# Egalaiva Certificate Portal

Issues and verifies Egalaiva program completion certificates. Built with Next.js.

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, ADMIN_PASSWORD, SMTP_*, SESSION_SECRET
npm run dev
```

Needs a running Postgres instance — set `DATABASE_URL` in `.env.local` to point at it. Schema (`migrations/*.sql`) is applied automatically on first request; no manual migration step needed.

Open [http://localhost:3000](http://localhost:3000).

## Routes

- `/` — public landing page (no form). Explains that certificates are issued via a personal claim link.
- `/claim/<TOKEN>` — the actual AI Engineering Workshop certificate claim flow (personal details → quiz → feedback → certificate). Only reachable with a valid, unused link generated from `/admin`. Each link works once.
- `/admin/login`, `/admin` — organizer login and dashboard for generating claim links (see below).
- `/certificate-print?id=<CERTIFICATE_ID>` — renders a printable certificate for the given ID (uses the sample `CERT-2025-8892` if `id` is omitted). Also what the server renders to PDF for emails.
- `/verify/<CERTIFICATE_ID>` — public verification page. Shows the recipient's details and lets them view/download the certificate. This is the URL encoded in each certificate's QR code.

## Issuing claim links (admin)

1. Sign in at `/admin/login` with `ADMIN_USERNAME`/`ADMIN_PASSWORD`.
2. On `/admin`, enter a count (e.g. `10`) and click Generate — you get back that many `/claim/<token>` links, each usable once. Copy them individually or all at once, and send them to participants however you like (email, WhatsApp, etc. — this app doesn't send the invites itself).
3. The dashboard's "All Links" table tracks every link ever generated: unused/claimed status, when it was created, and who claimed it.

Tokens are stored in the `claim_tokens` table (Postgres — see `src/lib/claimTokenStore.ts`). A link is marked **used only after** the participant successfully receives a certificate through it — not merely on opening it — so a page refresh or an interrupted attempt won't strand someone with a dead link.

## How a certificate gets issued

1. A participant opens their `/claim/<token>` link and completes all 3 steps, which `POST`s to `/api/certificates/issue` along with the token.
2. The server checks the token is valid and unused, atomically marks it used, generates a unique certificate ID, and saves **metadata only** (name, email, quiz score, ratings, etc.) to the `certificates` table (`src/lib/certificateStore.ts`). No PDF is stored anywhere.
3. The server renders `/certificate-print?id=<id>` through headless Chromium (`src/lib/certificatePdf.ts`) to produce the PDF on demand, and emails it via SMTP (`src/lib/mailer.ts`).
4. `/certificate-print` and `/verify/<id>` look up the same metadata (`src/data/certificates.ts` merges the static seed data with the store) and re-render the certificate live — so re-downloading or re-verifying never depends on a stored file.

## Database

Postgres, accessed via the `pg` driver (`src/lib/db.ts`) — no ORM. Schema:

- `programs` — distinct (name, certificate type) pairs, e.g. ("AI Engineering Workshop", "Appreciation").
- `claim_tokens` — single-use links, referencing the `programs` row they'll issue a certificate for.
- `certificates` — issued certificate metadata, referencing `programs` and (optionally) the `claim_tokens` row it was claimed through. `duration`/`company_name`/`founder_name`/`founder_title`/`issue_date` are snapshotted at issue time rather than joined live, so a certificate stays historically accurate if `src/lib/workshop.ts` constants change later.

Migrations live in `migrations/*.sql` and run automatically (tracked in a `schema_migrations` table) the first time the app queries the database — add a new numbered `.sql` file for schema changes, don't edit applied ones.

If SMTP isn't configured (or the send fails), the certificate is still issued and shown to the participant — they just see a note that the email didn't go out automatically, with a retry button that calls `/api/certificates/<id>/email`.

## Adding a certificate manually

1. Add an entry to `src/data/certificates.ts` (recipient name, program, dates, etc.) keyed by a unique certificate ID.
2. Print/export the certificate from `/certificate-print?id=<CERTIFICATE_ID>` and save the resulting PDF to `public/certificates/<CERTIFICATE_ID>.pdf`, matching the `pdfPath` in the data entry.
3. The certificate is now verifiable and downloadable at `/verify/<CERTIFICATE_ID>`, and its QR code will point there.

## Configuration

See `.env.example` for the full list. Key ones:

- `DATABASE_URL` — Postgres connection string. Required; the app won't start without it.
- `SITE_URL` — e.g. `https://your-deployed-domain.com`. Used for QR/verification links, generated claim link URLs, **and** by the headless-Chromium PDF renderer to fetch `/certificate-print`, so it must be reachable by the server itself. Defaults to `http://localhost:3000` in development.
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` — SMTP credentials for sending certificate emails. Without these, certificates still issue but aren't emailed.
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — required to sign in at `/admin`. There's no default password; login is disabled until `ADMIN_PASSWORD` is set.
- `SESSION_SECRET` — signs the admin session cookie. Set it for sessions that survive a server restart (otherwise a random one is generated per process).

**Deployment note:** PDF generation uses the full `puppeteer` package (bundled Chromium), which needs a normal Node process/container — it will **not** run on Vercel's default serverless functions without switching to `puppeteer-core` + a serverless Chromium build (e.g. `@sparticuz/chromium`). This app is set up for a self-hosted Node server (`npm run build && npm run start`) or Docker/VPS deployment.

## Note on `public/`

Everything under `public/` is served as a public static file. Don't put source data (spreadsheets, unpublished documents, etc.) there — keep it in the gitignored `private/` folder instead.
