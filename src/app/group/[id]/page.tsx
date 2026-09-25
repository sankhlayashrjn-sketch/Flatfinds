"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getGroup } from "@/lib/groupApi";
import { useGroupProfiles } from "@/hooks/useGroupProfiles";
import { personAccent } from "@/lib/personColors";
import { QrShare } from "@/components/QrShare";
import type { Group } from "@/types/flatfinds";

export default function GroupWaitingRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [groupError, setGroupError] = useState(false);
  const [joinUrl, setJoinUrl] = useState("");
  const { profiles, error: profilesError } = useGroupProfiles(groupId);

  useEffect(() => {
    // Reads window.location (external to React), not available during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJoinUrl(`${window.location.origin}/join/${groupId}`);
    getGroup(groupId)
      .then((g) => {
        if (!g || !g.expectedMemberCount) {
          setGroupError(true);
          return;
        }
        setGroup(g);
      })
      .catch(() => setGroupError(true));
  }, [groupId]);

  useEffect(() => {
    if (group && profiles && profiles.length >= group.expectedMemberCount) {
      router.push(`/group/${groupId}/shortlist`);
    }
  }, [group, profiles, groupId, router]);

  if (groupError) {
    return (
      <div className="mx-auto w-full max-w-md px-6 py-20 text-center">
        <h1 className="brand-text text-2xl font-extrabold">Group not found</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          This group doesn&apos;t exist, or hasn&apos;t finished being set up.
        </p>
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

  const remaining = group.expectedMemberCount - profiles.length;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="brand-text text-2xl font-extrabold">Your group</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {profiles.length} of {group.expectedMemberCount} submitted
      </p>
      {profilesError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{profilesError}</p>}

      <ul className="mt-6 space-y-3">
        {profiles.map((p, i) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
          >
            <span className={`font-semibold ${personAccent(i).text}`}>{p.name}</span>
            <span className="accent-text text-sm font-medium">Done ✓</span>
          </li>
        ))}
        {Array.from({ length: Math.max(0, remaining) }).map((_, i) => (
          <li
            key={`waiting-${i}`}
            className="flex items-center justify-between rounded-lg border border-dashed border-slate-300 px-4 py-3 dark:border-slate-600"
          >
            <span className="text-slate-400 dark:text-slate-500">Waiting for someone to join…</span>
          </li>
        ))}
      </ul>

      {remaining > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
            Waiting for {remaining} more {remaining === 1 ? "person" : "people"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            This updates live — share this with the rest of the group.
          </p>
          <div className="mt-3">{joinUrl && <QrShare url={joinUrl} />}</div>
        </div>
      )}
    </div>
  );
}
