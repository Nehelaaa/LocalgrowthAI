import Link from "next/link";
import { MarketingShell } from "./MarketingShell";
import { IllustrationOutreach, IllustrationPipeline, IllustrationRadar } from "./Illustrations";

type Persona = "freelancers" | "agencies" | "sales" | "realtors";

const personas: Record<
  Persona,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    bullets: string[];
    workflow: { t: string; d: string }[];
    proof: { t: string; d: string }[];
    Illustration: typeof IllustrationRadar;
  }
> = {
  freelancers: {
    eyebrow: "Freelancers & solo operators",
    title: "Book more clients without living in spreadsheets.",
    subtitle:
      "Search a city, grab qualified leads, generate a live website demo they can open, and keep follow-ups organized until you close.",
    bullets: [
      "Find under-served businesses fast",
      "Prioritize with simple signals & presets",
      "One-click demo websites from any saved lead (Pro)",
      "Branded PDF invoices from any saved lead",
      "Text invoice links via SMS",
      "Pro: connect Stripe — clients Pay on the shared invoice",
      "Track follow-ups in one pipeline",
      "Great for consultants, creatives, marketers, and local services",
    ],
    workflow: [
      { t: "Pick a niche", d: "Choose what you sell (ads, SEO, coaching, video, cleaning, accounting, etc.)." },
      { t: "Search your territory", d: "Pick a city + category and pull real businesses from Google Places." },
      { t: "Show the gap", d: "Generate a niche-matched demo site and share the live URL in your pitch." },
      { t: "Work the list", d: "Save leads, track status, and run follow-ups without losing context." },
    ],
    proof: [
      { t: "Demo before the call ends", d: "Prospects see a real page for their business — not a vague mockup deck." },
      { t: "Works across niches", d: "Same workflow whether you sell services, retainers, or one-off projects." },
      { t: "Exports when you need them (Pro)", d: "Push lists into Sheets, Airtable, or automation without losing context." },
    ],
    Illustration: IllustrationRadar,
  },
  agencies: {
    eyebrow: "Agencies & operators",
    title: "Turn territory searches into a predictable pipeline.",
    subtitle:
      "Run a repeatable process every rep on your team can run in their own account — search, qualify, demo a better site, and keep context on every lead.",
    bullets: [
      "A repeatable process every rep can run in their own account",
      "One-click demo websites to show the rebuild pitch (Pro)",
      "Exports + billing on Pro",
      "Invoice templates you can reuse across clients",
      "Pro: Stripe Connect — get paid on shared invoices",
      "Clean pipeline — active deals stay on top",
    ],
    workflow: [
      { t: "Define your ICP", d: "Territory + trade + signals: build a repeatable list-building motion." },
      { t: "Score + stage", d: "Tiers + CRM stages keep everyone aligned on what happens next." },
      { t: "Pitch with a live demo", d: "Generate a shareable site mockup from the lead before the proposal." },
      { t: "Close faster", d: "Run follow-ups, export to your stack, and keep a clean audit trail." },
    ],
    proof: [
      { t: "Less context switching", d: "Search, CRM, demos, and invoices live in one place." },
      { t: "Stronger first meetings", d: "Show a live demo URL instead of talking about websites in the abstract." },
    ],
    Illustration: IllustrationPipeline,
  },
  sales: {
    eyebrow: "B2B sales & appointment setting",
    title: "Prospect every day with fresh local leads.",
    subtitle:
      "Build lists, segment by signals, and keep a clean call sheet that updates as you work the pipeline.",
    bullets: [
      "Targeted prospecting",
      "Segment by signals & presets",
      "Optional demo websites when the pitch needs proof (Pro)",
      "PDF quotes from any pipeline row",
      "Text invoices & Pro Pay now via your Stripe",
      "Track outcomes and follow-ups",
    ],
    workflow: [
      { t: "Build a call list", d: "Search by location + category and save the best targets." },
      { t: "Segment instantly", d: "Use tiers and stages to focus on what’s most likely to convert." },
      { t: "Run follow-ups", d: "Notes and next steps ensure nothing slips." },
    ],
    proof: [
      { t: "Made for speed", d: "You can qualify and save a lead in seconds." },
      { t: "Exports when needed (Pro)", d: "Send lists to Sheets, Airtable, or automation." },
    ],
    Illustration: IllustrationOutreach,
  },
  realtors: {
    eyebrow: "Real estate agents",
    title: "Turn local partnerships into referrals.",
    subtitle:
      "Find high-quality local businesses and service pros, then organize outreach to build referral partners and vendor networks.",
    bullets: [
      "Find local partners",
      "Track relationship outreach",
      "Simple pipeline for follow-ups",
      "Invoice partners with shareable Pay links (Pro)",
    ],
    workflow: [
      { t: "Search local service pros", d: "Build a targeted list in your market (inspectors, movers, contractors, etc.)." },
      { t: "Prioritize your outreach", d: "Tier and stage leads so you know who to contact next." },
      { t: "Build long-term relationships", d: "Keep notes and outcomes to turn contacts into partners." },
    ],
    proof: [
      { t: "Works beyond one niche", d: "Same workflow applies to vendors, investors, and SMB owners." },
      { t: "Keep it simple", d: "No complex setup — just search and work the list." },
    ],
    Illustration: IllustrationRadar,
  },
};

export function PersonaPage({ persona }: { persona: Persona }) {
  const p = personas[persona];
  return (
    <MarketingShell>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:grid-cols-2 lg:gap-12">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
            {p.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
            {p.title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">
            {p.subtitle}
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-700 dark:text-slate-300">
            {p.bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="mt-0.5 text-emerald-600" aria-hidden>
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-violet-500 hover:to-indigo-500"
            >
              Start free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-200/90 bg-white/80 px-6 py-3.5 text-base font-medium text-slate-800 transition hover:border-indigo-300 hover:bg-indigo-50/80 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:border-indigo-500/40"
            >
              See pricing
            </Link>
          </div>
        </div>
        <div className="relative flex justify-center lg:justify-end">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-tr from-indigo-500/15 via-violet-500/10 to-transparent blur-2xl" aria-hidden />
          <div className="w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-xl dark:border-slate-800/80 dark:bg-slate-900/40">
            <p.Illustration className="h-56 w-full sm:h-64" />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 py-14 dark:border-slate-800/80 dark:from-slate-950 dark:to-slate-900/40 sm:py-18">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
            A simple workflow that scales
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600 dark:text-slate-400">
            Use the same daily routine no matter what you sell.
          </p>
          <ol className="mt-10 grid gap-4 lg:grid-cols-3" role="list">
            {p.workflow.map((x, i) => (
              <li
                key={x.t}
                className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/40"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <strong className="text-slate-900 dark:text-white">{x.t}</strong>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{x.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-4 lg:grid-cols-2">
          {p.proof.map((x) => (
            <div
              key={x.t}
              className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/40"
            >
              <strong className="text-slate-900 dark:text-white">{x.t}</strong>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{x.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">More playbooks:</span>
          <Link className="text-indigo-600 hover:underline dark:text-indigo-400" href="/for/freelancers">
            Freelancers
          </Link>
          <span aria-hidden>·</span>
          <Link className="text-indigo-600 hover:underline dark:text-indigo-400" href="/for/agencies">
            Agencies
          </Link>
          <span aria-hidden>·</span>
          <Link className="text-indigo-600 hover:underline dark:text-indigo-400" href="/for/sales">
            Sales teams
          </Link>
          <span aria-hidden>·</span>
          <Link className="text-indigo-600 hover:underline dark:text-indigo-400" href="/for/realtors">
            Realtors
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}

