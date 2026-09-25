"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getGroup } from "@/lib/groupApi";
import type { Group } from "@/types/flatfinds";

/**
 * Live group record — loads once, then re-fetches on any Supabase realtime
 * UPDATE (e.g. someone finalizing a choice), so the red "Finalised" stamp
 * appears for everyone at the same time without a manual refresh.
 */
export function useGroup(groupId: string) {
  const [group, setGroup] = useState<Group | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getGroup(groupId);
        if (cancelled) return;
        if (!data || !data.expectedMemberCount) {
          setNotFound(true);
          return;
        }
        setGroup(data);
      } catch {
        if (!cancelled) setNotFound(true);
      }
    }
    load();

    const channel = supabase
      .channel(`group-${groupId}-record`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "groups", filter: `id=eq.${groupId}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  // Exposed so the initiating device can push its own optimistic update right
  // after a successful write (e.g. finalizing) instead of waiting on the
  // realtime round-trip, which only the *other* viewers actually need.
  return { group, notFound, setGroup };
}
