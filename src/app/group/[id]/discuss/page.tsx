"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useGroup } from "@/hooks/useGroup";
import { useGroupProfiles } from "@/hooks/useGroupProfiles";
import { useGroupMessages } from "@/hooks/useGroupMessages";
import { sendMessage } from "@/lib/groupApi";
import { loadMyName, saveMyName } from "@/lib/me";
import { personAccent } from "@/lib/personColors";
import { ShortlistTabs } from "@/components/ShortlistTabs";
import { FinalizedBanner } from "@/components/FinalizedBanner";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function DiscussPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const { group, notFound } = useGroup(groupId);
  const { profiles } = useGroupProfiles(groupId);
  const messages = useGroupMessages(groupId);

  const [myName, setMyName] = useState<string | null>(null);
  const [nameChecked, setNameChecked] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reads localStorage (external to React), not available during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMyName(loadMyName(groupId));
    setNameChecked(true);
  }, [groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const accentForName = (name: string) => {
    const index = profiles?.findIndex((p) => p.name === name) ?? -1;
    return personAccent(index >= 0 ? index : 0).text;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !myName) return;
    setSending(true);
    setError(null);
    try {
      await sendMessage(groupId, myName, draft.trim());
      setDraft("");
    } catch {
      setError("Couldn't send that — check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  if (notFound) {
    return (
      <div className="mx-auto w-full max-w-md px-6 py-20 text-center">
        <h1 className="brand-text text-2xl font-extrabold">Group not found</h1>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300"
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  if (!group || !profiles || !nameChecked) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-20 text-center text-sm text-slate-500 dark:text-slate-400">
        Loading…
      </div>
    );
  }

  if (profiles.length < group.expectedMemberCount) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center">
        <h1 className="brand-text text-2xl font-extrabold">Not everyone&apos;s in yet</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          The discussion opens once the shortlist does — {profiles.length} of{" "}
          {group.expectedMemberCount} have submitted so far.
        </p>
        <Link
          href={`/group/${groupId}`}
          className="mt-6 inline-block text-sm font-medium text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300"
        >
          ← Back to the group
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10">
      <Link
        href={`/group/${groupId}`}
        className="text-sm font-medium text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300"
      >
        ← Back to group
      </Link>
      <h1 className="brand-text mt-3 text-2xl font-extrabold">Discuss</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
        Talk it through here, then head to the Shortlist tab and mark your pick as
        &ldquo;our choice&rdquo; once you&apos;ve agreed.
      </p>

      <ShortlistTabs groupId={groupId} active="discuss" />
      <FinalizedBanner group={group} />

      {!myName ? (
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Which one are you?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {profiles.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  saveMyName(groupId, p.name);
                  setMyName(p.name);
                }}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${personAccent(i).text} border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 flex h-[420px] flex-col overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            {!messages ? (
              <p className="text-sm text-slate-400">Loading messages…</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-slate-400">
                No messages yet — say hello and start talking it through.
              </p>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m.id}>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-sm font-semibold ${accentForName(m.senderName)}`}>
                        {m.senderName}
                        {m.senderName === myName ? " (you)" : ""}
                      </span>
                      <span className="text-xs text-slate-400">{formatTime(m.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{m.body}</p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="mt-3 flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-800"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="brand-bg rounded-md px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            >
              Send
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </>
      )}
    </div>
  );
}
