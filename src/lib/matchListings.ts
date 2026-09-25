import type {
  FlatmateProfile,
  Listing,
  MustHaveFilters,
  PersonMatchResult,
  PreferenceCheck,
  ShortlistEntry,
  SoftPreferences,
} from "@/types/flatfinds";
import {
  buildLocalityCentroids,
  estimateCommuteMinutes,
  matchReferencePoint,
  type LocalityCentroid,
} from "./commuteEstimate";

/**
 * Deterministic, LLM-free matching. Pure functions so they're easy to unit
 * test (see matchListings.test.ts) and reproducible — the same profiles and
 * listing pool always produce the same shortlist.
 */

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function passesMusts(listing: Listing, musts: MustHaveFilters): boolean {
  if (listing.rentInr > musts.maxRentInr) return false;
  if (listing.bathrooms < musts.minBathrooms) return false;
  const isAboveGround = listing.floor > 0;
  if (musts.liftRequired && isAboveGround && !listing.hasLift) return false;
  if (musts.parkingRequired && !listing.hasParking) return false;
  if (musts.petFriendlyRequired && !listing.petFriendly) return false;
  if (musts.excludedLocalities.includes(listing.locality)) return false;
  return true;
}

export function scoreSoftPreferences(
  listing: Listing,
  profile: FlatmateProfile,
  centroids: LocalityCentroid[],
): PersonMatchResult {
  const prefs: SoftPreferences = profile.preferences;
  const checks: PreferenceCheck[] = [];

  const houseTypeMet = listing.houseType === prefs.houseType;
  checks.push({
    criterion: "houseType",
    met: houseTypeMet,
    detail: houseTypeMet
      ? ""
      : `Not met: this is a ${listing.houseType}, not the ${prefs.houseType} preferred.`,
  });

  const propertyTypeMet = listing.propertyType === prefs.propertyType;
  checks.push({
    criterion: "propertyType",
    met: propertyTypeMet,
    detail: propertyTypeMet
      ? ""
      : `Not met: this is a ${listing.propertyType}, not the ${prefs.propertyType} preferred.`,
  });

  const furnishingMet = listing.furnishing === prefs.furnishing;
  checks.push({
    criterion: "furnishing",
    met: furnishingMet,
    detail: furnishingMet
      ? ""
      : `Not met: this is ${listing.furnishing.toLowerCase()}, not ${prefs.furnishing.toLowerCase()} as preferred.`,
  });

  const areasMet = prefs.areasToExplore.length === 0 || prefs.areasToExplore.includes(listing.locality);
  checks.push({
    criterion: "areasToExplore",
    met: areasMet,
    detail: areasMet
      ? ""
      : `Not met: ${listing.locality} isn't in the areas they wanted to explore (${prefs.areasToExplore.join(", ")}).`,
  });

  const reference = matchReferencePoint(prefs.commuteReferencePoint, centroids);
  const estimatedMinutes = estimateCommuteMinutes(listing, reference);
  const commuteMet = estimatedMinutes <= prefs.maxCommuteMinutes;
  checks.push({
    criterion: "commute",
    met: commuteMet,
    detail: commuteMet
      ? ""
      : `Not met: commute to ${prefs.commuteReferencePoint || "their reference point"} is ~${estimatedMinutes} min, ${estimatedMinutes - prefs.maxCommuteMinutes} min over the limit.`,
  });

  const metCount = checks.filter((c) => c.met).length;

  return {
    profileId: profile.id,
    name: profile.name,
    metCount,
    totalCount: checks.length,
    checks,
  };
}

interface ScoredListing {
  listing: Listing;
  personResults: PersonMatchResult[];
  belowThresholdCount: number;
  totalMet: number;
  shortfall: number;
}

function scoreListing(
  listing: Listing,
  profiles: FlatmateProfile[],
  centroids: LocalityCentroid[],
): ScoredListing {
  const personResults = profiles.map((p) => scoreSoftPreferences(listing, p, centroids));
  const belowThresholdCount = personResults.filter((r) => r.metCount / r.totalCount < 0.5).length;
  const totalMet = personResults.reduce((sum, r) => sum + r.metCount, 0);
  const shortfall = personResults.reduce((sum, r) => {
    const half = r.totalCount / 2;
    return sum + Math.max(0, half - r.metCount);
  }, 0);
  return { listing, personResults, belowThresholdCount, totalMet, shortfall };
}

function buildFallbackNote(scored: ScoredListing): string {
  const strugglingNames = scored.personResults
    .filter((r) => r.metCount / r.totalCount < 0.5)
    .map((r) => r.name);
  return `Below threshold — closest available match. ${formatInr(scored.listing.rentInr)}/mo, but it falls short of ${strugglingNames.join(" and ")}'s preferences — included because nothing nearby cleared everyone's bar.`;
}

/**
 * 1. Drop any listing that fails ANY profile's hard musts.
 * 2. Score the survivors' soft preferences per person (met/total out of 5).
 * 3. A listing qualifies outright if every person is at ≥50%. Take the top
 *    2-3 by total preferences met.
 * 4. If fewer than 2 qualify, relax: rank ALL survivors by fewest people
 *    below 50%, then smallest shortfall, and mark the relaxed picks with a
 *    fallback banner.
 */
export function computeShortlist(profiles: FlatmateProfile[], listings: Listing[]): ShortlistEntry[] {
  if (profiles.length === 0) return [];

  const survivors = listings.filter((listing) => profiles.every((p) => passesMusts(listing, p.musts)));
  if (survivors.length === 0) return [];

  const centroids = buildLocalityCentroids(listings);
  const scored = survivors.map((listing) => scoreListing(listing, profiles, centroids));

  const qualifying = scored
    .filter((s) => s.belowThresholdCount === 0)
    .sort((a, b) => b.totalMet - a.totalMet);

  let chosen: ScoredListing[];
  if (qualifying.length >= 2) {
    chosen = qualifying.slice(0, 3);
  } else {
    chosen = [...scored]
      .sort((a, b) => {
        if (a.belowThresholdCount !== b.belowThresholdCount) {
          return a.belowThresholdCount - b.belowThresholdCount;
        }
        if (a.belowThresholdCount === 0) return b.totalMet - a.totalMet;
        return a.shortfall - b.shortfall;
      })
      .slice(0, Math.min(3, scored.length));
  }

  return chosen.map((s) => ({
    listing: s.listing,
    personResults: s.personResults,
    isFallback: s.belowThresholdCount > 0,
    fallbackNote: s.belowThresholdCount > 0 ? buildFallbackNote(s) : undefined,
  }));
}
