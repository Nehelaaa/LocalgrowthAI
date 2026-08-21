/**
 * Short founder / trust note for the homepage.
 *
 * TODO: Replace PLACEHOLDER_BIO with real founder copy from the product owner.
 * Ask for: name, 1–2 sentences on who built LocalLeadster and why (no invented bio).
 */
const PLACEHOLDER_BIO =
  "LocalLeadster is built by an independent founder who sells to local businesses every week — the same workflow this product automates. More about who’s behind it coming soon.";

export function MarketingFounderNote() {
  return (
    <section
      className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6 sm:py-12"
      aria-labelledby="founder-note-heading"
    >
      <h2
        id="founder-note-heading"
        className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400"
      >
        Who’s behind this
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
        {/* TODO(founder-bio): replace PLACEHOLDER_BIO when real content is provided */}
        {PLACEHOLDER_BIO}
      </p>
    </section>
  );
}
