"use client";

import { useState } from "react";
import type { Group, ShortlistEntry } from "@/types/flatfinds";
import { personAccent } from "@/lib/personColors";
import { useWishlist } from "@/hooks/useWishlist";
import { finalizeListing } from "@/lib/groupApi";
import { ListingPhoto } from "./ListingPhoto";
import { PersonMatchBlock } from "./PersonMatchBlock";
import { FinalizedStamp } from "./FinalizedStamp";
import { AreaIcon, BathIcon, BedIcon, FloorIcon, HeartIcon, VerifiedIcon } from "./icons";

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function ShortlistCard({
  entry,
  groupId,
  finalizedListingId,
  onFinalized,
}: {
  entry: ShortlistEntry;
  groupId: string;
  /** Null if the group hasn't finalized a choice yet. */
  finalizedListingId: string | null;
  /** Lets the page update its own group state right away, instead of waiting on the realtime round-trip. */
  onFinalized?: (group: Group) => void;
}) {
  const { listing } = entry;
  const suggestion = listing.suggestion;
  const raw = suggestion?.raw;
  const { isSaved, toggle } = useWishlist(groupId);
  const saved = isSaved(listing.id);
  const isChosen = finalizedListingId === listing.id;
  const alreadyDecided = finalizedListingId !== null;
  const [confirming, setConfirming] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinalize = async () => {
    setFinalizing(true);
    setError(null);
    try {
      const updated = await finalizeListing(groupId, listing.id);
      onFinalized?.(updated);
      setConfirming(false);
    } catch {
      setError("Couldn't save that — check your connection and try again.");
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-slate-900 ${
        isChosen
          ? "border-red-600 ring-2 ring-red-600"
          : entry.isFallback
            ? "border-amber-300 dark:border-amber-700"
            : "border-slate-200 dark:border-slate-700"
      }`}
    >
      <div className="relative">
        <ListingPhoto id={listing.id} title={listing.title} imageUrl={raw?.imageUrl} />
        {isChosen && <FinalizedStamp />}
        {listing.verified && (
          <span className="accent-bg absolute left-3 top-3 flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-white shadow">
            <VerifiedIcon />
            Verified
          </span>
        )}
        <button
          type="button"
          onClick={() => toggle(listing.id)}
          aria-pressed={saved}
          aria-label={saved ? "Remove from my wishlist" : "Save to my wishlist"}
          title={saved ? "Saved to your wishlist" : "Save to your wishlist (private, just for you)"}
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full shadow transition-colors ${
            saved
              ? "bg-rose-600 text-white"
              : "bg-white/90 text-slate-500 hover:text-rose-600 dark:bg-slate-900/80 dark:text-slate-300"
          }`}
        >
          <HeartIcon filled={saved} />
        </button>
      </div>

      {entry.isFallback && (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
          ⚠ Below threshold — closest available match
          {entry.fallbackNote && (
            <p className="mt-0.5 font-normal text-amber-700 dark:text-amber-300">
              {entry.fallbackNote}
            </p>
          )}
        </div>
      )}

      <div className="p-5">
        <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {listing.title}
        </p>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          {listing.society} · {listing.locality}, {listing.city}
        </p>

        {suggestion && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-sky-100 px-2 py-0.5 font-semibold text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
              🔗 Found by {suggestion.submittedBy}
            </span>
            <a
              href={suggestion.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-rose-700 hover:underline dark:text-rose-400"
            >
              View original listing ↗
            </a>
          </div>
        )}

        <div className="mt-3 flex items-baseline gap-2">
          {suggestion && raw?.rentInr == null ? (
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Rent not detected — check the original listing
            </span>
          ) : (
            <>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {formatInr(listing.rentInr)}
              </span>
              <span className="text-xs text-slate-400">/month</span>
              {!suggestion && (
                <span className="text-xs text-slate-400">
                  · {formatInr(listing.depositInr)} deposit
                </span>
              )}
            </>
          )}
        </div>

        {(!suggestion || raw?.houseType || raw?.bathrooms) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-y border-slate-100 py-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
            {(!suggestion || raw?.houseType) && (
              <span className="flex items-center gap-1.5">
                <BedIcon className="h-4 w-4 text-slate-400" /> {listing.houseType}
              </span>
            )}
            {(!suggestion || raw?.bathrooms) && (
              <span className="flex items-center gap-1.5">
                <BathIcon className="h-4 w-4 text-slate-400" /> {listing.bathrooms} Bath
              </span>
            )}
            {!suggestion && (
              <>
                <span className="flex items-center gap-1.5">
                  <AreaIcon className="h-4 w-4 text-slate-400" /> {listing.areaSqFt} sqft
                </span>
                <span className="flex items-center gap-1.5">
                  <FloorIcon className="h-4 w-4 text-slate-400" /> Floor {listing.floor}/
                  {listing.totalFloors}
                </span>
              </>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(suggestion
            ? [
                raw?.propertyType ?? null,
                raw?.furnishing ?? null,
                raw?.hasLift ? "Lift" : null,
                raw?.hasParking ? "Parking" : null,
                raw?.petFriendly ? "Pet-friendly" : null,
              ]
            : [
                listing.propertyType,
                listing.furnishing,
                listing.hasLift ? "Lift" : null,
                listing.hasParking ? "Parking" : null,
                listing.petFriendly ? "Pet-friendly" : null,
              ]
          )
            .filter((chip): chip is string => !!chip)
            .map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {chip}
              </span>
            ))}
        </div>

        {!suggestion && listing.amenities.length > 0 && (
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            {listing.amenities.join(" · ")}
          </p>
        )}

        <div className="mt-4">
          {entry.personResults.map((result, i) => (
            <PersonMatchBlock
              key={result.profileId}
              result={result}
              accentTextClass={personAccent(i).text}
            />
          ))}
        </div>

        {!alreadyDecided && (
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            {confirming ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Lock this in as the group&apos;s final choice?
                </span>
                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={finalizing}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                >
                  {finalizing ? "Saving…" : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={finalizing}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="w-full rounded-md border-2 border-red-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Mark as our choice
              </button>
            )}
            {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
