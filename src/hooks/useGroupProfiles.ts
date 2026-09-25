"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getProfiles } from "@/lib/groupApi";
import type { FlatmateProfile } from "@/types/flatfinds";

/**
 * Live list of a group's submitted profiles — loads once, then re-fetches
 * whenever Supabase realtime reports a new profile row for this group, so
 * "waiting for X more people" updates without a manual refresh.
 */
export function useGroupProfiles(groupId: string) {
  const [profiles, setProfiles] = useState<FlatmateProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getProfiles(groupId);
        if (!cancelled) setProfiles(data);
      } catch {
        if (!cancelled) setError("Couldn't load this group's status.");
      }
    }
    load();

    const channel = supabase
      .channel(`group-${groupId}-profiles`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles", filter: `group_id=eq.${groupId}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  return { profiles, error };
}
