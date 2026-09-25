"use client";

import { useEffect, useState } from "react";
import { loadWishlist, onWishlistChange, saveWishlist } from "@/lib/wishlist";

export function useWishlist(groupId: string) {
  const [ids, setIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Reads localStorage (external to React), not available during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIds(loadWishlist(groupId));
    setLoaded(true);
    // Other useWishlist() instances on the same page (e.g. a card's heart
    // button vs. the tab counter) writing to the same group need to sync here.
    return onWishlistChange(groupId, () => setIds(loadWishlist(groupId)));
  }, [groupId]);

  const isSaved = (listingId: string) => ids.includes(listingId);

  const toggle = (listingId: string) => {
    // saveWishlist() dispatches an event that other useWishlist() instances
    // (e.g. the tab counter) react to by calling their own setState. That has
    // to happen from a plain event handler, not from inside a setState
    // updater function — React forbids triggering another component's update
    // while one is still being computed, so this can't be `setIds(prev => ...)`.
    const next = ids.includes(listingId)
      ? ids.filter((id) => id !== listingId)
      : [...ids, listingId];
    setIds(next);
    saveWishlist(groupId, next);
  };

  return { ids, loaded, isSaved, toggle };
}
