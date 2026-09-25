"use client";

interface YesNoToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function YesNoToggle({ label, value, onChange }: YesNoToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <div className="flex overflow-hidden rounded-md border border-slate-300 dark:border-slate-600">
        {[
          { label: "Yes", val: true },
          { label: "No", val: false },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.val)}
            aria-pressed={value === opt.val}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              value === opt.val
                ? "bg-rose-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
