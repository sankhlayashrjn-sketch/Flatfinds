"use client";

import Link from "next/link";
import { useWishlist } from "@/hooks/useWishlist";

type Tab = "shortlist" | "wishlist" | "discuss";

export function ShortlistTabs({ groupId, active }: { groupId: string; active: Tab }) {
  const { ids } = useWishlist(groupId);

  const tabClass = (tab: Tab) =>
    `rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
      active === tab
        ? "brand-bg text-white"
        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;

  return (
    <div className="mt-4 inline-flex gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
      <Link href={`/group/${groupId}/shortlist`} className={tabClass("shortlist")}>
        Shortlist
      </Link>
      <Link href={`/group/${groupId}/wishlist`} className={tabClass("wishlist")}>
        My wishlist{ids.length > 0 ? ` (${ids.length})` : ""}
      </Link>
      <Link href={`/group/${groupId}/discuss`} className={tabClass("discuss")}>
        Discuss
      </Link>
    </div>
  );
}
