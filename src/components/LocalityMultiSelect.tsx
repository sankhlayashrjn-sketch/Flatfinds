"use client";

interface LocalityMultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (localities: string[]) => void;
  /** "exclude" (red/pink, for "won't consider") or "explore" (teal, for "would like to explore"). */
  variant?: "exclude" | "explore";
  summaryPrefix?: string;
}

export function LocalityMultiSelect({
  label,
  options,
  selected,
  onChange,
  variant = "exclude",
  summaryPrefix,
}: LocalityMultiSelectProps) {
  const toggle = (locality: string) => {
    if (selected.includes(locality)) {
      onChange(selected.filter((l) => l !== locality));
    } else {
      onChange([...selected, locality]);
    }
  };

  const selectedClasses =
    variant === "exclude"
      ? "border-pink-400 bg-pink-100 text-pink-800 dark:border-pink-600 dark:bg-pink-900/40 dark:text-pink-200"
      : "border-teal-400 bg-teal-100 text-teal-800 dark:border-teal-600 dark:bg-teal-900/40 dark:text-teal-200";

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="mt-2 flex max-h-48 flex-wrap gap-2 overflow-y-auto">
        {options.map((locality) => {
          const isSelected = selected.includes(locality);
          return (
            <button
              key={locality}
              type="button"
              onClick={() => toggle(locality)}
              aria-pressed={isSelected}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isSelected
                  ? selectedClasses
                  : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {locality}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && summaryPrefix && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {summaryPrefix}: {selected.join(", ")}
        </p>
      )}
    </div>
  );
}
