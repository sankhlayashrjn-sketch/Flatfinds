"use client";

import { supabase } from "./supabaseClient";
import type { FlatmateProfile, Group, MustHaveFilters, SoftPreferences } from "@/types/flatfinds";

interface GroupRow {
  id: string;
  name: string;
  expected_member_count: number | null;
  created_at: string;
}

interface ProfileRow {
  id: string;
  group_id: string;
  name: string;
  musts: MustHaveFilters;
  preferences: SoftPreferences;
  submitted_at: string;
}

function rowToGroup(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    expectedMemberCount: row.expected_member_count ?? 0,
    createdAt: row.created_at,
  };
}

function rowToProfile(row: ProfileRow): FlatmateProfile {
  return {
    id: row.id,
    groupId: row.group_id,
    name: row.name,
    musts: row.musts,
    preferences: row.preferences,
    submittedAt: row.submitted_at,
  };
}

/** No group-naming step — the group record just exists to tie profiles together and gate the shortlist. */
export async function createGroup(expectedMemberCount: number): Promise<Group> {
  const { data, error } = await supabase
    .from("groups")
    .insert({ name: "Flat search", expected_member_count: expectedMemberCount })
    .select()
    .single<GroupRow>();
  if (error) throw error;
  return rowToGroup(data);
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const { data, error } = await supabase
    .from("groups")
    .select()
    .eq("id", groupId)
    .maybeSingle<GroupRow>();
  if (error) throw error;
  return data ? rowToGroup(data) : null;
}

export async function submitProfile(
  groupId: string,
  name: string,
  musts: MustHaveFilters,
  preferences: SoftPreferences,
): Promise<FlatmateProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .insert({ group_id: groupId, name, musts, preferences })
    .select()
    .single<ProfileRow>();
  if (error) throw error;
  return rowToProfile(data);
}

export async function getProfiles(groupId: string): Promise<FlatmateProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select()
    .eq("group_id", groupId)
    .order("submitted_at")
    .returns<ProfileRow[]>();
  if (error) throw error;
  return (data ?? []).map(rowToProfile);
}
