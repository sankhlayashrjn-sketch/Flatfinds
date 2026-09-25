"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getMessages } from "@/lib/groupApi";
import type { GroupMessage } from "@/types/flatfinds";

/** Live chat — loads once, then re-fetches whenever a new message lands for this group. */
export function useGroupMessages(groupId: string) {
  const [messages, setMessages] = useState<GroupMessage[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getMessages(groupId);
        if (!cancelled) setMessages(data);
      } catch {
        // next realtime event (or a manual retry) will pick it back up
      }
    }
    load();

    const channel = supabase
      .channel(`group-${groupId}-messages`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  return messages;
}
