import type { Group, Listing } from "@/types/flatfinds";

export function FinalizedBanner({ group, listings }: { group: Group; listings: Listing[] }) {
  if (!group.finalizedListingId) return null;
  const listing = listings.find((l) => l.id === group.finalizedListingId);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border-2 border-red-600 bg-red-50 px-4 py-3 dark:bg-red-950/30">
      <span className="rounded-md bg-red-600 px-2 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
        Finalised
      </span>
      <p className="text-sm font-medium text-red-800 dark:text-red-200">
        The group chose {listing ? `${listing.society}, ${listing.locality}` : "a listing"} — this
        session is closed.
      </p>
    </div>
  );
}
