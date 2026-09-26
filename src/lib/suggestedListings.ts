import { buildLocalityCentroids, type LocalityCentroid } from "./commuteEstimate";
import { listingPool } from "./listingPool";
import type { Listing, SuggestedListing } from "@/types/flatfinds";

/**
 * Turns a member-submitted URL into a real `Listing` so it runs through the
 * exact same must/preference scoring as the mock pool (see matchListings.ts)
 * — same compromise flagging, no separate code path. Fields the parser
 * couldn't read get a neutral default chosen to never fail a must on missing
 * data alone; `suggestion.raw` keeps what was actually detected so the UI can
 * say "not confirmed" instead of presenting a guess as fact.
 */

const NEUTRAL_BATHROOMS = 5;
const NEUTRAL_RENT = 0;

const poolCentroids = buildLocalityCentroids(listingPool);
const overallCentroid: LocalityCentroid = poolCentroids.reduce(
  (acc, c) => ({
    locality: "",
    latitude: acc.latitude + c.latitude / poolCentroids.length,
    longitude: acc.longitude + c.longitude / poolCentroids.length,
  }),
  { locality: "", latitude: 0, longitude: 0 },
);

function coordsForLocality(locality: string | null): { latitude: number; longitude: number } {
  if (!locality) return overallCentroid;
  const match = poolCentroids.find((c) => c.locality.toLowerCase() === locality.toLowerCase());
  return match ?? overallCentroid;
}

export function suggestedListingToListing(row: SuggestedListing): Listing {
  const { latitude, longitude } = coordsForLocality(row.locality);
  return {
    id: `suggested-${row.id}`,
    title: row.title ?? `Listing found by ${row.submittedBy}`,
    society: row.title ?? "Member-submitted listing",
    locality: row.locality ?? "Unknown area",
    city: "Pune",
    address: row.url,
    rentInr: row.rentInr ?? NEUTRAL_RENT,
    depositInr: 0,
    maintenanceInr: 0,
    areaSqFt: 0,
    houseType: row.houseType ?? "2BHK",
    propertyType: row.propertyType ?? "Apartment",
    furnishing: row.furnishing ?? "Semi Furnished",
    bathrooms: row.bathrooms ?? NEUTRAL_BATHROOMS,
    hasLift: row.hasLift ?? true,
    hasParking: row.hasParking ?? true,
    petFriendly: row.petFriendly ?? false,
    verified: false,
    floor: 0,
    totalFloors: 0,
    amenities: [],
    latitude,
    longitude,
    suggestion: {
      submittedBy: row.submittedBy,
      url: row.url,
      parseStatus: row.parseStatus,
      raw: row,
    },
  };
}
