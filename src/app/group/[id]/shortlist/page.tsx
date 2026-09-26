"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useGroup } from "@/hooks/useGroup";
import { useGroupProfiles } from "@/hooks/useGroupProfiles";
import { useSuggestedListings } from "@/hooks/useSuggestedListings";
import { listingPool } from "@/lib/listingPool";
import { computeShortlist } from "@/lib/matchListings";
import { suggestedListingToListing } from "@/lib/suggestedListings";
import { ShortlistCard } from "@/components/ShortlistCard";
import { ShortlistTabs } from "@/components/ShortlistTabs";
import { FinalizedBanner } from "@/components/FinalizedBanner";
import { EmptySearchIllustration } from "@/components/icons";

export default function ShortlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const { group, notFound, setGroup } = useGroup(groupId);
  const { profiles } = useGroupProfiles(groupId);
  const { suggestedListings } = useSuggestedListings(groupId);

  const parsedSuggestions = useMemo(
    () => (suggestedListings ?? []).filter((s) => s.parseStatus === "parsed").map(suggestedListingToListing),
    [suggestedListings],
  );
  const unreadableSuggestions = useMemo(
    () => (suggestedListings ?? []).filter((s) => s.parseStatus !== "parsed"),
    [suggestedListings],
  );

  const allListings = useMemo(
    () => [...listingPool, ...parsedSuggestions],
    [parsedSuggestions],
  );

  const shortlist = useMemo(() => {
    if (!profiles || profiles.length === 0) return null;
    return computeShortlist(profiles, allListings);
  }, [profiles, allListings]);

  if (notFound) {
    return (
      <div className="mx-auto w-full max-w-md px-6 py-20 text-center">
        <h1 className="brand-text text-2xl font-extrabold">Group not found</h1>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300"
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  if (!group || !profiles) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-20 text-center text-sm text-slate-500 dark:text-slate-400">
        Loading…
      </div>
    );
  }

  if (profiles.length < group.expectedMemberCount) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center">
        <h1 className="brand-text text-2xl font-extrabold">Not everyone&apos;s in yet</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {profiles.length} of {group.expectedMemberCount} have submitted so far.
        </p>
        <Link
          href={`/group/${groupId}`}
          className="mt-6 inline-block text-sm font-medium text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300"
        >
          ← Back to the group
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <Link
        href={`/group/${groupId}`}
        className="text-sm font-medium text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300"
      >
        ← Back to group
      </Link>
      <h1 className="brand-text mt-3 text-2xl font-extrabold">Shortlist</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
        Everyone sees the same cards. Nobody swipes or likes individually — for each listing, you
        can see how it stacks up against what each person said they need. This tool lays out the
        tradeoffs; the group decides.
      </p>

      <ShortlistTabs groupId={groupId} active="shortlist" />
      <FinalizedBanner group={group} listings={allListings} />

      {!shortlist || shortlist.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-8 text-center text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
          <EmptySearchIllustration className="h-20 w-20" />
          <p>
            No listings clear every must-have for the whole group — someone&apos;s musts may be
            too strict for what&apos;s available. Try loosening a must-have and asking everyone to
            resubmit.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {shortlist.map((entry) => (
            <ShortlistCard
              key={entry.listing.id}
              entry={entry}
              groupId={groupId}
              finalizedListingId={group.finalizedListingId}
              onFinalized={setGroup}
            />
          ))}
        </div>
      )}

      {unreadableSuggestions.length > 0 && (
        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/50">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            Links the group found that couldn&apos;t be read automatically
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Not enough detail on the page to score against everyone&apos;s musts and preferences —
            open the link directly to check it yourself.
          </p>
          <ul className="mt-2 space-y-1">
            {unreadableSuggestions.map((s) => (
              <li key={s.id} className="truncate">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-700 hover:underline dark:text-rose-400"
                >
                  {s.url}
                </a>
                <span className="text-slate-500 dark:text-slate-400"> — found by {s.submittedBy}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
