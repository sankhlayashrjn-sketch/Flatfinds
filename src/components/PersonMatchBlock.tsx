import type { PersonMatchResult } from "@/types/flatfinds";

export function PersonMatchBlock({
  result,
  accentTextClass,
}: {
  result: PersonMatchResult;
  accentTextClass: string;
}) {
  const allMet = result.metCount === result.totalCount;
  const misses = result.checks.filter((c) => !c.met);

  return (
    <div className="border-t border-slate-100 py-3 first:border-t-0 dark:border-slate-700">
      <p className={`text-sm font-semibold ${accentTextClass}`}>
        {result.name} ({result.metCount}/{result.totalCount} met)
        {allMet && <span className="accent-text ml-1">✓</span>}
      </p>
      {!allMet && (
        <ul className="mt-1.5 space-y-1">
          {misses.map((miss, i) => (
            <li key={i} className="text-xs text-slate-500 dark:text-slate-400">
              {miss.detail}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
