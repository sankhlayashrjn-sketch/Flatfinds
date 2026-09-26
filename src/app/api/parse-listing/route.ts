import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchAndParseListing, isSafeListingUrl } from "@/lib/parseListingUrl";
import { listingPool } from "@/lib/listingPool";
import type { SuggestedListing } from "@/types/flatfinds";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
);

const localities = Array.from(new Set(listingPool.map((l) => l.locality)));

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

export async function POST(request: Request) {
  let body: { groupId?: unknown; submittedBy?: unknown; url?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { groupId, submittedBy, url } = body;
  if (typeof groupId !== "string" || typeof submittedBy !== "string" || typeof url !== "string") {
    return NextResponse.json({ error: "groupId, submittedBy, and url are required" }, { status: 400 });
  }
  if (!isSafeListingUrl(url)) {
    return NextResponse.json({ error: "That doesn't look like a usable listing URL" }, { status: 400 });
  }

  const result = await fetchAndParseListing(url, localities);

  const { data, error } = await supabase
    .from("suggested_listings")
    .insert({
      group_id: groupId,
      submitted_by: submittedBy,
      url,
      parse_status: result.status,
      title: result.fields.title ?? null,
      image_url: result.fields.imageUrl ?? null,
      rent_inr: result.fields.rentInr ?? null,
      locality: result.fields.locality ?? null,
      house_type: result.fields.houseType ?? null,
      property_type: result.fields.propertyType ?? null,
      furnishing: result.fields.furnishing ?? null,
      bathrooms: result.fields.bathrooms ?? null,
      has_lift: result.fields.hasLift ?? null,
      has_parking: result.fields.hasParking ?? null,
      pet_friendly: result.fields.petFriendly ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(rowToSuggestedListing(data as SuggestedListingRow));
}
