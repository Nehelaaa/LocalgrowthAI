# LocalLeadster

Full-stack SaaS to find local businesses, score them, manage a CRM pipeline, generate niche demo websites, and invoice from one workspace.

## Tech stack

- **Next.js 16** (App Router)
- **TypeScript**
- **TailwindCSS**
- **Prisma 6** + **PostgreSQL** (e.g. [Neon](https://neon.tech); `DATABASE_URL` in `.env`)
- **Server Actions** + **API routes**
- **NextAuth v5** (Google OAuth + credentials)
- **Google Places API** (New)
- **Stripe** (subscriptions)
- **Resend** (transactional email)
- **PostHog** (optional product analytics)

## Features

- **Business search** – City, state, radius, business type → Google Places results; auto-flag no website / social-only.
- **Lead scoring** – 0–100 score and HOT / WARM / COLD badge from rating, review count, and website status.
- **Demo website generator (Pro)** – One click from a saved lead builds a niche-matched live page; view/share at `/demo/[slug]`.
- **CRM pipeline** – Contact status, notes, follow-up dates, point of contact, service price; filters and search.
- **Branded invoicing** – PDF + plain-text invoices with templates, logo, tax/discount; drafts saved per lead.
- **Metrics** – Pipeline value, active/hot leads, contacts made, conversion rate, lead map.
- **Export** – CSV download and JSON API for Google Sheets / webhooks (plan-gated where applicable).

### Planned / not yet implemented

- AI opportunity insights and multi-channel outreach script generation (OpenAI) — **not in the current codebase**.
- Shared team / multi-seat workspaces — accounts are single-user today (see `docs/team-workspace-proposal.md` when present).

## Setup

1. **Clone and install**

   ```bash
   cd localgrowth-app
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` / `DIRECT_URL` – Neon PostgreSQL (see `.env.example`).
   - `AUTH_SECRET` – e.g. `openssl rand -base64 32`.
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` – Google OAuth (NextAuth).
   - `GOOGLE_PLACES_API_KEY` – Places API (New) key.
   - Stripe keys for billing (`STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_PRO`, webhook secret).
   - Optional: `RESEND_API_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`, `SUPPORT_INBOX_EMAIL`.

3. **Database**

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

   If you have an old **SQLite** `prisma/dev.db` and want to copy it into Neon (wipes existing Neon app data first):

   ```bash
   npm run db:migrate-from-sqlite -- --force
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign in → Dashboard.

## Project structure

```
src/
  app/
    api/           # auth, places/search, stripe, invoices, export, leads
    dashboard/     # overview, search, leads, plan, invoice-templates
    demo/[slug]/   # public demo page viewer
    pricing/ terms/ privacy/
  actions/         # leads, demo, metrics, register
  lib/             # auth, db, google-places, lead-score, demo-templates, entitlements
prisma/
  schema.prisma
```

## Security

- API keys used only server-side (Places, Stripe, Resend).
- Rate limiting on `/api/places/search` and other sensitive routes.
- Dashboard and export routes require an authenticated session.

## Deploy (Vercel)

1. Connect repo to Vercel.
2. Set env vars in Vercel (same as `.env` / `.env.example`).
3. Build runs Prisma generate + migrate deploy, then `next build`.

## Optional

- **Chrome extension** – “Add to LocalLeadster” from Google Maps in `chrome-extension/`.
- **Webhook** – Set `WEBHOOK_URL` for new-lead notifications if wired in actions.
- **Google Sheets sync** – Use `/api/export/leads` JSON with Zapier/Make.

## License

MIT
