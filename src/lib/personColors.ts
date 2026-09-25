/** Consistent per-person color coding, cycling through a palette so it works for any group size. */
const PALETTE = [
  {
    bar: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    border: "hover:border-blue-300 dark:hover:border-blue-700",
  },
  {
    bar: "bg-teal-500",
    text: "text-teal-600 dark:text-teal-400",
    border: "hover:border-teal-300 dark:hover:border-teal-700",
  },
  {
    bar: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    border: "hover:border-amber-300 dark:hover:border-amber-700",
  },
  {
    bar: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    border: "hover:border-rose-300 dark:hover:border-rose-700",
  },
  {
    bar: "bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
    border: "hover:border-violet-300 dark:hover:border-violet-700",
  },
  {
    bar: "bg-slate-500",
    text: "text-slate-600 dark:text-slate-400",
    border: "hover:border-slate-400 dark:hover:border-slate-500",
  },
];

export function personAccent(index: number): (typeof PALETTE)[number] {
  return PALETTE[index % PALETTE.length];
}
