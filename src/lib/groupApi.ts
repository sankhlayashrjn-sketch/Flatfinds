"use client";

import { supabase } from "./supabaseClient";
import type {
  FlatmateProfile,
  Group,
  GroupMessage,
  MustHaveFilters,
  SoftPreferences,
  SuggestedListing,
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

interface SuggestedListingRow {
  id: string;
  group_id: string;
  submitted_by: string;
  url: string;
  parse_status: "pending" | "parsed" | "failed";
  title: string | null;
  image_url: string | null;
  rent_inr: number | null;
  locality: string | null;
  house_type: string | null;
  property_type: string | null;
  furnishing: string | null;
  bathrooms: number | null;
  has_lift: boolean | null;
  has_parking: boolean | null;
  pet_friendly: boolean | null;
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

function rowToSuggestedListing(row: SuggestedListingRow): SuggestedListing {
  return {
    id: row.id,
    groupId: row.group_id,
    submittedBy: row.submitted_by,
    url: row.url,
    parseStatus: row.parse_status,
    title: row.title,
    imageUrl: row.image_url,
    rentInr: row.rent_inr,
    locality: row.locality,
    houseType: row.house_type as SuggestedListing["houseType"],
    propertyType: row.property_type as SuggestedListing["propertyType"],
    furnishing: row.furnishing as SuggestedListing["furnishing"],
    bathrooms: row.bathrooms,
    hasLift: row.has_lift,
    hasParking: row.has_parking,
    petFriendly: row.pet_friendly,
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

/** Fetches + parses the URL server-side (see /api/parse-listing) and stores the result, whether or not parsing succeeded. */
export async function addSuggestedListing(
  groupId: string,
  submittedBy: string,
  url: string,
): Promise<SuggestedListing> {
  const res = await fetch("/api/parse-listing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ groupId, submittedBy, url }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Couldn't save that listing link");
  }
  return res.json();
}

export async function getSuggestedListings(groupId: string): Promise<SuggestedListing[]> {
  const { data, error } = await supabase
    .from("suggested_listings")
    .select()
    .eq("group_id", groupId)
    .order("created_at")
    .returns<SuggestedListingRow[]>();
  if (error) throw error;
  return (data ?? []).map(rowToSuggestedListing);
}
