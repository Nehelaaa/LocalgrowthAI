# Team / shared workspace — smallest viable proposal

Status: **proposal only — do not implement until reviewed.**

## Problem

`/for/agencies` historically implied a shared team workflow. The product is **single-user today**: `Lead.userId` and usage counters live on `User`. There is no `Team`, seats, or shared CRM.

Agencies persona copy has been softened to: *a repeatable process every rep can run in their own account*. This doc sketches the smallest shared-workspace model if we want real multi-seat later.

## Goals (MVP)

1. One owner creates a **Team**; invites N members by email.
2. Members see a **shared lead pool** for that team (or a shared read view — decision below).
3. Billing: a **Team Pro** (or “Agency”) Stripe price that entitles a seat count.
4. Search / lead / invoice quotas apply at the **team** level (or per-seat with a shared pool — prefer team pool for simplicity).

Non-goals for v1: fine-grained roles beyond owner/member, SSO, per-client workspaces, audit log exports.

## Recommended data model (sketch)

```prisma
enum TeamRole {
  OWNER
  MEMBER
}

model Team {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  members   TeamMember[]
  // Optional: move billing off User onto Team
  stripeCustomerId     String?
  stripeSubscriptionId String?
  subscriptionStatus   String?
  plan                 String   @default("free")
  seatLimit            Int      @default(1)

  lifetimeLeadsCreated Int @default(0)
  // or keep usage on a TeamUsage / SearchDayUsage keyed by teamId
}

model TeamMember {
  id        String   @id @default(cuid())
  teamId    String
  userId    String
  role      TeamRole @default(MEMBER)
  createdAt DateTime @default(now())

  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@index([userId])
}

// On User:
//   teamMemberships TeamMember[]
//   // keep personal billing for solo Pro; team billing on Team when active
```

### Lead / Business scoping — pick one

| Option | Behavior | Pros | Cons |
|--------|----------|------|------|
| **A. Team-owned leads (recommended for MVP)** | Add nullable `teamId` on `Lead`. When user is in a team with Team Pro, new leads set `teamId` + `userId` (creator). Queries: `where: { teamId }` for members. | True shared pipeline | Migration + rewrite of most lead queries; exports/demos/invoices need team checks |
| **B. User-owned + shared read** | Leads stay `userId`-scoped. Team members can **view** each other’s leads via membership, but edits stay on owner. | Smaller schema change | Feels broken for agencies (“whose CRM?”); invites still confusing |

**Recommendation:** Option A for a real agency product. Option B is a stopgap only.

`Business` can stay globally unique by `placeId` (as today); multiple teams could theoretically share a Business row via separate Leads — keep current upsert pattern, but Lead always carries `teamId` when in team mode.

## Entitlements / billing

Today (`src/lib/entitlements.ts`):

- Free: `FREE_LEAD_LIMIT`, `FREE_SEARCHES_LIFETIME`, `FREE_INVOICE_PDF_LIMIT`
- Pro: unlimited leads, `PRO_SEARCHES_PER_DAY`, unlimited invoice PDFs, demo generator

Proposed:

1. Keep **solo Pro** as-is (current Stripe price).
2. Add **Team Pro** Stripe price (e.g. `STRIPE_PRICE_ID_TEAM`) with metadata `seatLimit=5` (or quantity = seats).
3. Extend `hasProEntitlement` (or add `hasTeamProEntitlement`) to check the user’s active Team subscription when `teamId` context is set.
4. `src/lib/billing-policies.ts`: webhook events for team customer/subscription IDs; map `checkout.session.completed` → Team row.

Seat enforcement: block invite when `TeamMember.count >= Team.seatLimit`.

## Rough migration sketch

1. Add `Team`, `TeamMember`, optional billing columns on `Team`.
2. Add `Lead.teamId String?` + index; backfill `null` (solo).
3. New invite flow: create `TeamMember` after email accept (magic link or pending invite table — invite table can be v1.1).
4. Dual-write period: solo users unchanged; team users create leads with `teamId`.
5. Update `assertOwnsLead` → `assertCanAccessLead` (owner user **or** same team member).
6. Stripe: new Checkout mode for team plan; Customer Portal on team’s `stripeCustomerId`.

## UX sketch

- Settings → **Workspace**: create team / invite / leave.
- Dashboard banner when in team context: “Acme Agency · 3/5 seats”.
- Agencies landing CTA: “Start free solo — upgrade to Team when you’re ready to share a pipeline.”

## Open questions for review

1. Confirm **Option A** (team-owned leads) vs B.
2. Seat pricing: flat Team Pro (N seats) vs per-seat Stripe quantity?
3. Can a user belong to multiple teams in v1? (Propose **no** — one active team.)
4. Do demo pages and invoice drafts stay creator-private or team-visible?

## Explicitly out of scope until approved

- Implementing any of the above schema/UI.
- Deleting or renaming the unused `Outreach` Prisma model (left in place for a possible future AI outreach feature).
