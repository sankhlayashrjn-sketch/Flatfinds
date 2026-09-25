import type { Furnishing, HouseType, Listing, PropertyType } from "@/types/flatfinds";
import rawData from "../../data/mock-listings.json";

/**
 * Adapts the scraped-shape mock dataset (data/mock-listings.json) into the
 * `Listing` shape the matcher and UI use. That source data mirrors what
 * NoBroker actually exposes, which doesn't include a property-type category
 * or a pet policy field — so `propertyType` and `petFriendly` here are
 * stable, documented placeholders (derived deterministically from each
 * listing's other fields, not random per run) standing in for fields a real
 * listings pipeline would need to capture directly.
 */

interface RawListing {
  id: string;
  title: string;
  society: string;
  locality: string;
  city: string;
  address: string;
  bhk: string;
  areaSqFt: number;
  bathrooms: number;
  furnishing: string;
  parking: string;
  floor: number;
  totalFloors: number;
  amenities: string[];
  rentInr: number;
  depositInr: number;
  maintenanceInr: number;
  latitude: number;
  longitude: number;
  verified: boolean;
}

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function toHouseType(bhk: string): HouseType {
  const normalized = bhk.replace(/\s+/g, "").toUpperCase() as HouseType;
  return normalized;
}

/** Not in the source data — inferred from amenities/scale as a stand-in until a real field exists. */
function toPropertyType(raw: RawListing): PropertyType {
  const amenitySet = new Set(raw.amenities);
  if (raw.totalFloors <= 2) {
    return amenitySet.has("Private Garden") ? "Villa" : "Independent House";
  }
  if (amenitySet.has("Club House") || amenitySet.has("Swimming Pool")) {
    return "Gated Community";
  }
  if (amenitySet.has("Security") || amenitySet.has("Lift")) {
    return "Society";
  }
  return "Apartment";
}

function toFurnishing(furnishing: string): Furnishing {
  return furnishing as Furnishing;
}

function toListing(raw: RawListing): Listing {
  return {
    id: raw.id,
    title: raw.title,
    society: raw.society,
    locality: raw.locality,
    city: raw.city,
    address: raw.address,
    rentInr: raw.rentInr,
    depositInr: raw.depositInr,
    maintenanceInr: raw.maintenanceInr,
    areaSqFt: raw.areaSqFt,
    houseType: toHouseType(raw.bhk),
    propertyType: toPropertyType(raw),
    furnishing: toFurnishing(raw.furnishing),
    bathrooms: raw.bathrooms,
    hasLift: raw.amenities.includes("Lift"),
    hasParking: raw.parking !== "None",
    petFriendly: stableHash(raw.id) % 5 !== 0, // placeholder: ~80% pet-friendly, stable per listing
    verified: raw.verified,
    floor: raw.floor,
    totalFloors: raw.totalFloors,
    amenities: raw.amenities,
    latitude: raw.latitude,
    longitude: raw.longitude,
  };
}

export const listingPool: Listing[] = (rawData as { listings: RawListing[] }).listings.map(
  toListing,
);
