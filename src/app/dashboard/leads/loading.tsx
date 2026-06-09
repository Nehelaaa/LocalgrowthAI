/** Lightweight skeleton — avoids full-screen auth overlay during filter/pagination changes. */
export default function LeadsLoading() {
  return (
    <div className="w-full min-w-0 max-w-6xl space-y-4 pb-2 animate-pulse">
      <div className="h-24 rounded-xl bg-slate-200/80 dark:bg-slate-800/60" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-slate-200/70 dark:bg-slate-800/50"
          />
        ))}
      </div>
    </div>
  );
}
