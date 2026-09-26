"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addSuggestedListing, getGroup, getProfiles, submitProfile } from "@/lib/groupApi";
import { saveMyName } from "@/lib/me";
import { PreferenceForm } from "@/components/PreferenceForm";
import type { Group, MustHaveFilters, SoftPreferences } from "@/types/flatfinds";

type Status = "checking" | "ready" | "full" | "not-found" | "error";

export default function JoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [group, setGroup] = useState<Group | null>(null);
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const g = await getGroup(groupId);
        if (cancelled) return;
        if (!g || !g.expectedMemberCount) {
          setStatus("not-found");
          return;
        }
        const profiles = await getProfiles(groupId);
        if (cancelled) return;
        if (profiles.length >= g.expectedMemberCount) {
          setStatus("full");
          return;
        }
        setGroup(g);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const handleSubmit = async (
    n: string,
    musts: MustHaveFilters,
    preferences: SoftPreferences,
    suggestedUrls: string[],
  ) => {
    await submitProfile(groupId, n, musts, preferences);
    saveMyName(groupId, n);
    await Promise.allSettled(suggestedUrls.map((url) => addSuggestedListing(groupId, n, url)));
    router.push(`/group/${groupId}`);
  };

  if (status === "checking") {
    return (
      <div className="mx-auto w-full max-w-md px-6 py-20 text-center text-sm text-slate-500 dark:text-slate-400">
        Checking that invite…
      </div>
    );
  }

  if (status !== "ready") {
    const messages: Record<Exclude<Status, "checking" | "ready">, { title: string; body: string }> = {
      "not-found": {
        title: "That invite isn't valid",
        body: "This link doesn't match a group — check it was copied correctly, or ask for a fresh invite.",
      },
      full: {
        title: "This group is already full",
        body: "Everyone this group was expecting has already submitted their preferences.",
      },
      error: {
        title: "Something went wrong",
        body: "Couldn't check that invite — check your connection and try again.",
      },
    };
    const { title, body } = messages[status];
    return (
      <div className="mx-auto w-full max-w-md px-6 py-20 text-center">
        <h1 className="brand-text text-2xl font-extrabold">{title}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{body}</p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300"
        >
          ← Start your own group
        </Link>
      </div>
    );
  }

  if (!nameConfirmed) {
    return (
      <div className="mx-auto w-full max-w-md px-6 py-16">
        <h1 className="brand-text text-2xl font-extrabold">Join this group</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          A {group?.expectedMemberCount}-person flat search. What&apos;s your name?
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) setNameConfirmed(true);
          }}
          className="mt-4 flex gap-2"
        >
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Meera"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-800"
          />
          <button
            type="submit"
            className="brand-bg rounded-md px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
          >
            Continue
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="brand-text text-2xl font-extrabold">Your preferences</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Fill this in on your own — nobody else in the group sees your individual answers, only
        how each listing stacks up once everyone&apos;s submitted.
      </p>
      <div className="mt-8">
        <PreferenceForm initialName={name} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
