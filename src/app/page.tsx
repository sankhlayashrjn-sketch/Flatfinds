"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGroup } from "@/lib/groupApi";
import { GroupHomeIllustration } from "@/components/icons";

const QUICK_OPTIONS = [2, 3, 4] as const;

export default function Home() {
  const router = useRouter();
  const [choosingMore, setChoosingMore] = useState(false);
  const [customCount, setCustomCount] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = async (count: number) => {
    if (count < 2) return;
    setSaving(true);
    setError(null);
    try {
      const group = await createGroup(count);
      router.push(`/create/${group.id}/profile`);
    } catch {
      setError("Couldn't start — check your connection (and Supabase setup) and try again.");
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="flex items-center gap-6">
        <div className="min-w-0">
          <h1 className="brand-text text-4xl font-extrabold tracking-tight">FlatFinds</h1>
          <p className="mt-2 max-w-xl text-lg text-slate-600 dark:text-slate-400">
            Sort your home selection here!
          </p>
        </div>
        <GroupHomeIllustration className="hidden h-28 w-28 shrink-0 sm:block" />
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          How many people are in your group?
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Including you.</p>

        <div className="mt-4 flex flex-wrap gap-3">
          {QUICK_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              disabled={saving}
              onClick={() => choose(count)}
              className="brand-bg rounded-md px-6 py-3 text-lg font-bold text-white shadow-sm disabled:opacity-60"
            >
              {count}
            </button>
          ))}
          <button
            type="button"
            disabled={saving}
            onClick={() => setChoosingMore(true)}
            className={`rounded-md border px-6 py-3 text-lg font-bold shadow-sm disabled:opacity-60 ${
              choosingMore
                ? "border-rose-500 bg-rose-100 text-rose-800 dark:border-rose-600 dark:bg-rose-900/40 dark:text-rose-200"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            More
          </button>
        </div>

        {choosingMore && (
          <div className="mt-5 flex items-center gap-3">
            <input
              type="number"
              min={5}
              max={20}
              value={customCount}
              onChange={(e) => setCustomCount(Number(e.target.value))}
              className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-800"
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => choose(customCount)}
              className="brand-bg rounded-md px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            >
              Confirm {customCount} people
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}
