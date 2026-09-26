"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getSuggestedListings } from "@/lib/groupApi";
import type { SuggestedListing } from "@/types/flatfinds";

/**
 * Live list of listing URLs the group has submitted — loads once, then
 * re-fetches whenever Supabase realtime reports a new row for this group, so
 * a link someone just pasted shows up on everyone else's shortlist too.
 */
export function useSuggestedListings(groupId: string) {
  const [suggestedListings, setSuggestedListings] = useState<SuggestedListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getSuggestedListings(groupId);
        if (!cancelled) setSuggestedListings(data);
      } catch {
        if (!cancelled) setError("Couldn't load submitted listing links.");
      }
    }
    load();

    const channel = supabase
      .channel(`group-${groupId}-suggested-listings`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "suggested_listings",
          filter: `group_id=eq.${groupId}`,
        },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  return { suggestedListings, error };
}
