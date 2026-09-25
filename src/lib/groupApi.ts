"use client";

import { supabase } from "./supabaseClient";
import type {
  FlatmateProfile,
  Group,
  GroupMessage,
  MustHaveFilters,
  SoftPreferences,
} from "@/types/flatfinds";

interface GroupRow {
  id: string;
  name: string;
  expected_member_count: number | null;
  created_at: string;
  finalized_listing_id: string | null;
  finalized_at: string | null;
}

interface ProfileRow {
  id: string;
  group_id: string;
  name: string;
  musts: MustHaveFilters;
  preferences: SoftPreferences;
  submitted_at: string;
}

interface MessageRow {
  id: string;
  group_id: string;
  sender_name: string;
  body: string;
  created_at: string;
}

function rowToGroup(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    expectedMemberCount: row.expected_member_count ?? 0,
    createdAt: row.created_at,
    finalizedListingId: row.finalized_listing_id,
    finalizedAt: row.finalized_at,
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

function rowToMessage(row: MessageRow): GroupMessage {
  return {
    id: row.id,
    groupId: row.group_id,
    senderName: row.sender_name,
    body: row.body,
    createdAt: row.created_at,
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

/** Records the group's decision — the whole point being that it happens after the chat discussion, not instead of it. */
export async function finalizeListing(groupId: string, listingId: string): Promise<Group> {
  const { data, error } = await supabase
    .from("groups")
    .update({ finalized_listing_id: listingId, finalized_at: new Date().toISOString() })
    .eq("id", groupId)
    .select()
    .single<GroupRow>();
  if (error) throw error;
  return rowToGroup(data);
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

export async function sendMessage(
  groupId: string,
  senderName: string,
  body: string,
): Promise<GroupMessage> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ group_id: groupId, sender_name: senderName, body })
    .select()
    .single<MessageRow>();
  if (error) throw error;
  return rowToMessage(data);
}

export async function getMessages(groupId: string): Promise<GroupMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select()
    .eq("group_id", groupId)
    .order("created_at")
    .returns<MessageRow[]>();
  if (error) throw error;
  return (data ?? []).map(rowToMessage);
}
