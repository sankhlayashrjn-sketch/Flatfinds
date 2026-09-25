import type { ShortlistEntry } from "@/types/flatfinds";
import { personAccent } from "@/lib/personColors";
import { useWishlist } from "@/hooks/useWishlist";
import { ListingPhoto } from "./ListingPhoto";
import { PersonMatchBlock } from "./PersonMatchBlock";
import { AreaIcon, BathIcon, BedIcon, FloorIcon, HeartIcon, VerifiedIcon } from "./icons";

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function ShortlistCard({ entry, groupId }: { entry: ShortlistEntry; groupId: string }) {
  const { listing } = entry;
  const { isSaved, toggle } = useWishlist(groupId);
  const saved = isSaved(listing.id);

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-slate-900 ${
        entry.isFallback
          ? "border-amber-300 dark:border-amber-700"
          : "border-slate-200 dark:border-slate-700"
      }`}
    >
      <div className="relative">
        <ListingPhoto id={listing.id} title={listing.title} />
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

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {formatInr(listing.rentInr)}
          </span>
          <span className="text-xs text-slate-400">/month</span>
          <span className="text-xs text-slate-400">
            · {formatInr(listing.depositInr)} deposit
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-y border-slate-100 py-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <BedIcon className="h-4 w-4 text-slate-400" /> {listing.houseType}
          </span>
          <span className="flex items-center gap-1.5">
            <BathIcon className="h-4 w-4 text-slate-400" /> {listing.bathrooms} Bath
          </span>
          <span className="flex items-center gap-1.5">
            <AreaIcon className="h-4 w-4 text-slate-400" /> {listing.areaSqFt} sqft
          </span>
          <span className="flex items-center gap-1.5">
            <FloorIcon className="h-4 w-4 text-slate-400" /> Floor {listing.floor}/
            {listing.totalFloors}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            listing.propertyType,
            listing.furnishing,
            listing.hasLift ? "Lift" : null,
            listing.hasParking ? "Parking" : null,
            listing.petFriendly ? "Pet-friendly" : null,
          ]
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

        {listing.amenities.length > 0 && (
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
      </div>
    </div>
  );
}
