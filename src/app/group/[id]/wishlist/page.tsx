"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useGroup } from "@/hooks/useGroup";
import { useGroupProfiles } from "@/hooks/useGroupProfiles";
import { useSuggestedListings } from "@/hooks/useSuggestedListings";
import { useWishlist } from "@/hooks/useWishlist";
import { listingPool } from "@/lib/listingPool";
import { computeShortlist } from "@/lib/matchListings";
import { suggestedListingToListing } from "@/lib/suggestedListings";
import { ShortlistCard } from "@/components/ShortlistCard";
import { ShortlistTabs } from "@/components/ShortlistTabs";
import { FinalizedBanner } from "@/components/FinalizedBanner";
import { HeartIcon } from "@/components/icons";

export default function WishlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const { group, notFound, setGroup } = useGroup(groupId);
  const { profiles } = useGroupProfiles(groupId);
  const { suggestedListings } = useSuggestedListings(groupId);
  const { ids: savedIds, loaded } = useWishlist(groupId);

  const allListings = useMemo(
    () => [
      ...listingPool,
      ...(suggestedListings ?? [])
        .filter((s) => s.parseStatus === "parsed")
        .map(suggestedListingToListing),
    ],
    [suggestedListings],
  );

  const shortlist = useMemo(() => {
    if (!profiles || profiles.length === 0) return null;
    return computeShortlist(profiles, allListings);
  }, [profiles, allListings]);

  const saved = useMemo(
    () => shortlist?.filter((entry) => savedIds.includes(entry.listing.id)) ?? [],
    [shortlist, savedIds],
  );

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

  if (!group || !profiles || !loaded) {
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
          The wishlist is ready once the shortlist is — {profiles.length} of{" "}
          {group.expectedMemberCount} have submitted so far.
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
      <h1 className="brand-text mt-3 text-2xl font-extrabold">My wishlist</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
        Private to you, on this device — the group can&apos;t see what you&apos;ve saved here. It
        doesn&apos;t change anyone&apos;s shortlist or match results; it&apos;s just a way to keep
        track of what caught your eye before the group talks it through together.
      </p>

      <ShortlistTabs groupId={groupId} active="wishlist" />
      <FinalizedBanner group={group} listings={allListings} />

      {saved.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
          <HeartIcon className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p>
            Nothing saved yet — tap the heart on any card in the shortlist to add it here.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {saved.map((entry) => (
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
    </div>
  );
}
