# LocalLeadster

Full-stack SaaS to find local businesses without websites, score them, and manage outreach to convert them into web development clients.

## Tech stack

- **Next.js 16** (App Router)
- **TypeScript**
- **TailwindCSS**
- **Prisma 6** + **PostgreSQL** (e.g. [Neon](https://neon.tech); `DATABASE_URL` in `.env`)
- **Server Actions** + **API routes**
- **NextAuth v5** (Google OAuth + JWT)
- **Google Places API** (New)
- **OpenAI API**

## Features

- **Business search** – City, state, radius, business type → Google Places results; auto-flag no website / social-only.
- **Lead scoring** – 0–100 score and HOT / WARM / COLD badge from rating, review count, and website status.
- **AI opportunity insights** – Per-lead “why they need a site” and revenue opportunity (OpenAI).
- **One-click demo** – Generate hero + services + contact CTA (Tailwind) and store in DB; view at `/demo/[slug]`.
- **Outreach generator** – Cold email, call script, Instagram DM, 60s Loom script (OpenAI).
- **CRM** – Table with status, notes, follow-up date, tags; filters and search.
- **Metrics** – Total leads, no-website count, contacts made, conversion rate, pipeline.
- **Export** – CSV download and JSON API for Google Sheets / webhooks.

## Setup

1. **Clone and install**

   ```bash
   cd localgrowth-app
   npm install
   npm install @auth/prisma-adapter
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` – Neon PostgreSQL URL (pooled connection + `pgbouncer=true`; see `.env.example`).
   - `AUTH_SECRET` – e.g. `openssl rand -base64 32`.
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` – Google OAuth (NextAuth).
   - `GOOGLE_PLACES_API_KEY` – Places API (New) key.
   - `OPENAI_API_KEY` – OpenAI API key.

3. **Database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

   If you have an old **SQLite** `prisma/dev.db` and want to copy it into Neon (wipes existing Neon app data first):

   ```bash
   npm run db:migrate-from-sqlite -- --force
   ```

   Use `--dry-run` to count rows only. Set `SQLITE_PATH` if your `.db` is elsewhere.

4. **Owner / admin access**

   Owner dashboard access is granted when either the signed-in user has `role = 'ADMIN'`
   or their email is listed in `OWNER_EMAIL` / `OWNER_EMAILS`.

   For the current owner login in Vercel, set:

   ```bash
   OWNER_EMAIL=topwebdeveloperan@gmail.com
   ```

   To promote an existing user in the DB:

   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
   ```

   Email/password sign-in only works for users with a local password set. If the owner
   account was created with Google, use **Continue with Google** or set a password with:

   ```bash
   npm run auth:set-password -- your@email.com "YourNewPassword8+"
   ```

   If the owner email exists only in env and does not have a DB password yet, set
   a temporary bootstrap password in Vercel, redeploy, sign in once with that
   password, then remove the bootstrap variable:

   ```bash
   OWNER_BOOTSTRAP_PASSWORD="YourNewPassword8+"
   ```

5. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign in → Dashboard (admin only).

## Project structure

```
src/
  app/
    api/           # auth, places/search, export/csv, export/leads
    dashboard/     # overview, search, leads, export
    demo/[slug]/   # public demo page viewer
    login/
  actions/         # leads, demo, metrics, leads-list
  lib/             # auth, db, rate-limit, google-places, lead-score, openai
prisma/
  schema.prisma    # User, Business, Lead, Outreach, DemoPage, ActivityLog
```

## Security

- API keys used only server-side (Places, OpenAI).
- Rate limiting on `/api/places/search`.
- Dashboard and export routes require admin role (NextAuth session).

## Deploy (Vercel)

1. Connect repo to Vercel.
2. Set env vars in Vercel (same as `.env`).
3. For production you can switch to PostgreSQL (e.g. Neon) by changing the Prisma datasource and setting `DATABASE_URL`; locally SQLite is enough.
4. Run `npx prisma db push` or migrations in CI/deploy.
5. Build: `npm run build`.

## Optional

- **Chrome extension** – Placeholder for “Add to LocalLeadster” from Google Maps in `chrome-extension/`; implement parsing and API as needed.
- **Webhook** – Set `WEBHOOK_URL` and call it when a new lead is saved (hook point exists in actions).
- **Google Sheets sync** – Use `/api/export/leads` JSON with Zapier/Make to sync to Sheets.

## License

MIT
