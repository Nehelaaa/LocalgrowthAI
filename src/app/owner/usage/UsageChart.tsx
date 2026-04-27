"use client";

type Point = { day: string; searches: number; aiCalls: number };

function maxOf(list: number[]) {
  return list.reduce((m, v) => (v > m ? v : m), 0);
}

export function UsageChart({ data }: { data: Point[] }) {
  const max = Math.max(
    1,
    maxOf(data.map((d) => d.searches)),
    maxOf(data.map((d) => d.aiCalls))
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-600" /> Searches
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-600" /> AI calls
        </span>
      </div>

      <div className="grid grid-cols-14 gap-1">
        {data.map((d) => (
          <div key={d.day} className="space-y-1">
            <div
              className="h-20 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 relative overflow-hidden"
              title={`${d.day} — searches: ${d.searches}`}
            >
              <div
                className="absolute bottom-0 left-0 right-0 bg-indigo-600/80"
                style={{ height: `${Math.round((d.searches / max) * 100)}%` }}
              />
            </div>
            <div
              className="h-16 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 relative overflow-hidden"
              title={`${d.day} — AI calls: ${d.aiCalls}`}
            >
              <div
                className="absolute bottom-0 left-0 right-0 bg-emerald-600/80"
                style={{ height: `${Math.round((d.aiCalls / max) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-center text-slate-500">
              {d.day.slice(5)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

