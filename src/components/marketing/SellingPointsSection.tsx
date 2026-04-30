const points = [
  {
    title: "Google Places lead search",
    desc: "Search by city, radius, and category. Find real local businesses (not scraped lists).",
  },
  {
    title: "Instant qualification signals",
    desc: "Spot “no website” / “social only”, review volume, and quality tiers at a glance.",
  },
  {
    title: "Lead scoring + HOT/WARM/COLD",
    desc: "Prioritize the best prospects first — built for daily outreach without spreadsheet chaos.",
  },
  {
    title: "CRM pipeline that stays simple",
    desc: "Status, notes, follow-ups, tags, and a clean history on every lead.",
  },
  {
    title: "Exports (Pro)",
    desc: "CSV + JSON endpoints for Sheets, Airtable, and automation (Zapier/Make/webhooks).",
  },
  {
    title: "Designed for daily outreach",
    desc: "Search → save → next step. A workflow you can actually run every day without context switching.",
  },
  {
    title: "Stripe billing, secure accounts",
    desc: "Upgrade in-app, manage billing in Stripe, and keep access scoped to your account.",
  },
] as const;

export function SellingPointsSection() {
  return (
    <section
      className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-18"
      aria-labelledby="selling-points-heading"
    >
      <div className="text-center">
        <h2
          id="selling-points-heading"
          className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white"
        >
          Everything you need to find and close local deals
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
          LocalLeadster is a lead generation + pipeline workspace built for agencies, freelancers, and sales teams
          selling to local businesses.
        </p>
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {points.map((p) => (
          <li
            key={p.title}
            className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm ring-1 ring-slate-900/5 dark:border-slate-800/80 dark:bg-slate-900/40 dark:ring-white/5"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{p.desc}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

