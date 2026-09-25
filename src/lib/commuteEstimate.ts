import type { Listing } from "@/types/flatfinds";

/**
 * Estimates commute time without any maps/geocoding API (the matching
 * function has to be a deterministic, LLM-free, pure function). The person
 * types a free-text reference point (e.g. "my office in Hinjewadi"); we
 * match that text against the known localities in the listing pool (whose
 * coordinates we derive by averaging the lat/long of listings in that
 * locality) and estimate minutes from straight-line distance at an assumed
 * average city-traffic speed.
 *
 * This is a documented approximation, not real routing data — it exists so
 * the scoring stays deterministic and testable instead of guessing via an
 * LLM call per listing.
 */

const AVERAGE_SPEED_KMH = 18; // rough Pune city-traffic assumption
const FIXED_OVERHEAD_MINUTES = 5; // parking, walking to the door, etc.

export interface LocalityCentroid {
  locality: string;
  latitude: number;
  longitude: number;
}

export function buildLocalityCentroids(listings: Listing[]): LocalityCentroid[] {
  const byLocality = new Map<string, { latSum: number; lonSum: number; count: number }>();
  for (const listing of listings) {
    const entry = byLocality.get(listing.locality) ?? { latSum: 0, lonSum: 0, count: 0 };
    entry.latSum += listing.latitude;
    entry.lonSum += listing.longitude;
    entry.count += 1;
    byLocality.set(listing.locality, entry);
  }
  return Array.from(byLocality.entries()).map(([locality, { latSum, lonSum, count }]) => ({
    locality,
    latitude: latSum / count,
    longitude: lonSum / count,
  }));
}

function haversineKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Finds the known locality whose name best matches free text like "my office in Hinjewadi Phase 1". */
export function matchReferencePoint(
  referenceText: string,
  centroids: LocalityCentroid[],
): LocalityCentroid {
  const normalized = referenceText.toLowerCase();
  const matches = centroids.filter((c) => normalized.includes(c.locality.toLowerCase()));
  if (matches.length > 0) {
    // Prefer the longest/most specific locality name that appears in the text.
    return matches.sort((a, b) => b.locality.length - a.locality.length)[0];
  }
  // No named locality recognized — fall back to the pool's overall centroid.
  const overall = centroids.reduce(
    (acc, c) => ({ latitude: acc.latitude + c.latitude, longitude: acc.longitude + c.longitude }),
    { latitude: 0, longitude: 0 },
  );
  return {
    locality: "the city centre (unrecognized reference point)",
    latitude: overall.latitude / centroids.length,
    longitude: overall.longitude / centroids.length,
  };
}

export function estimateCommuteMinutes(listing: Listing, reference: LocalityCentroid): number {
  const km = haversineKm(listing, reference);
  const minutes = (km / AVERAGE_SPEED_KMH) * 60 + FIXED_OVERHEAD_MINUTES;
  return Math.round(minutes);
}
