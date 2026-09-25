"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { submitProfile } from "@/lib/groupApi";
import { saveMyName } from "@/lib/me";
import { PreferenceForm } from "@/components/PreferenceForm";
import type { MustHaveFilters, SoftPreferences } from "@/types/flatfinds";

export default function CreatorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const router = useRouter();

  const handleSubmit = async (name: string, musts: MustHaveFilters, preferences: SoftPreferences) => {
    await submitProfile(groupId, name, musts, preferences);
    saveMyName(groupId, name);
    router.push(`/group/${groupId}`);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="brand-text text-2xl font-extrabold">Your preferences</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Fill this in on your own — once you submit, you&apos;ll get a QR code and link to send to
        the rest of the group. Nobody sees anyone else&apos;s individual answers, only how each
        listing stacks up once everyone&apos;s in.
      </p>
      <div className="mt-8">
        <PreferenceForm onSubmit={handleSubmit} submitLabel="Save & get invite link" />
      </div>
    </div>
  );
}
