import type {
  FlatmateProfile,
  Listing,
  MustHaveFilters,
  MustViolation,
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

/** Every must a listing breaks for this person. Empty means it clears all of them. */
export function checkMusts(listing: Listing, musts: MustHaveFilters): MustViolation[] {
  const violations: MustViolation[] = [];

  if (listing.rentInr > musts.maxRentInr) {
    violations.push({
      criterion: "rent",
      detail: `Not met: rent is ${formatInr(listing.rentInr)}, ${formatInr(listing.rentInr - musts.maxRentInr)} over the ${formatInr(musts.maxRentInr)} max.`,
    });
  }
  if (listing.bathrooms < musts.minBathrooms) {
    violations.push({
      criterion: "bathrooms",
      detail: `Not met: only ${listing.bathrooms} bathroom${listing.bathrooms === 1 ? "" : "s"} — needs at least ${musts.minBathrooms}.`,
    });
  }
  const isAboveGround = listing.floor > 0;
  if (musts.liftRequired && isAboveGround && !listing.hasLift) {
    violations.push({ criterion: "lift", detail: "Not met: no lift, and a lift is required." });
  }
  if (musts.parkingRequired && !listing.hasParking) {
    violations.push({ criterion: "parking", detail: "Not met: no parking, but parking is required." });
  }
  if (musts.petFriendlyRequired && !listing.petFriendly) {
    violations.push({ criterion: "petFriendly", detail: "Not met: not pet-friendly, but that's required." });
  }
  if (musts.excludedLocalities.includes(listing.locality)) {
    violations.push({
      criterion: "excludedLocality",
      detail: `Not met: ${listing.locality} is on the areas they won't consider.`,
    });
  }

  return violations;
}

export function passesMusts(listing: Listing, musts: MustHaveFilters): boolean {
  return checkMusts(listing, musts).length === 0;
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
  /** Must violations per person; empty arrays across the board means this listing clears every must. */
  mustViolationsByPerson: { name: string; violations: MustViolation[] }[];
  totalMustViolations: number;
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
  const mustViolationsByPerson = profiles.map((p) => ({
    name: p.name,
    violations: checkMusts(listing, p.musts),
  }));
  const totalMustViolations = mustViolationsByPerson.reduce((sum, m) => sum + m.violations.length, 0);
  return {
    listing,
    personResults,
    belowThresholdCount,
    totalMet,
    shortfall,
    mustViolationsByPerson,
    totalMustViolations,
  };
}

function buildFallbackNote(scored: ScoredListing): string {
  if (scored.totalMustViolations > 0) {
    const byPerson = scored.mustViolationsByPerson
      .filter((m) => m.violations.length > 0)
      .map((m) => `${m.name} — ${m.violations.map((v) => v.detail.replace(/^Not met: /, "")).join("; ")}`);
    return `Below threshold — closest available match. Nothing nearby cleared every must-have, so this breaks one to stay in the running: ${byPerson.join(" · ")}.`;
  }
  const strugglingNames = scored.personResults
    .filter((r) => r.metCount / r.totalCount < 0.5)
    .map((r) => r.name);
  return `Below threshold — closest available match. ${formatInr(scored.listing.rentInr)}/mo, but it falls short of ${strugglingNames.join(" and ")}'s preferences — included because nothing nearby cleared everyone's bar.`;
}

function rankAndBuild(scored: ScoredListing[], mustsRelaxed: boolean): ShortlistEntry[] {
  const qualifying = scored
    .filter((s) => s.belowThresholdCount === 0 && s.totalMustViolations === 0)
    .sort((a, b) => b.totalMet - a.totalMet);

  let chosen: ScoredListing[];
  if (!mustsRelaxed && qualifying.length >= 2) {
    chosen = qualifying.slice(0, 3);
  } else {
    chosen = [...scored]
      .sort((a, b) => {
        // Worse (more must-violating) listings always rank below better ones,
        // even in the musts-relaxed pool — "closest" still means closest.
        if (a.totalMustViolations !== b.totalMustViolations) {
          return a.totalMustViolations - b.totalMustViolations;
        }
        if (a.belowThresholdCount !== b.belowThresholdCount) {
          return a.belowThresholdCount - b.belowThresholdCount;
        }
        if (a.belowThresholdCount === 0 && a.totalMustViolations === 0) {
          return b.totalMet - a.totalMet;
        }
        return a.shortfall - b.shortfall;
      })
      .slice(0, Math.min(3, scored.length));
  }

  return chosen.map((s) => {
    const isFallback = s.totalMustViolations > 0 || s.belowThresholdCount > 0;
    return {
      listing: s.listing,
      personResults: s.personResults,
      isFallback,
      fallbackNote: isFallback ? buildFallbackNote(s) : undefined,
    };
  });
}

/**
 * 1. Score every listing's must-haves and soft preferences for everyone.
 * 2. If at least one listing clears every must-have for every person, only
 *    ever choose among those — rank by how many preferences qualify (≥50%
 *    for everyone) or, failing that, by fewest people below 50%.
 * 3. If NOTHING clears every must-have, don't return empty: fall back to the
 *    closest listings across the whole pool (fewest total must-violations,
 *    then fewest people below the preference threshold), and flag them
 *    clearly as a compromise — which must was broken, and for whom.
 */
export function computeShortlist(profiles: FlatmateProfile[], listings: Listing[]): ShortlistEntry[] {
  if (profiles.length === 0 || listings.length === 0) return [];

  const centroids = buildLocalityCentroids(listings);
  const allScored = listings.map((listing) => scoreListing(listing, profiles, centroids));

  const mustPassing = allScored.filter((s) => s.totalMustViolations === 0);
  if (mustPassing.length > 0) {
    return rankAndBuild(mustPassing, false);
  }

  // Nobody's musts are fully satisfiable across this pool — relax musts too,
  // rather than telling the group there's nothing to look at.
  return rankAndBuild(allScored, true);
}
