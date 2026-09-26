import { describe, expect, it } from "vitest";
import { computeShortlist, passesMusts, scoreSoftPreferences } from "./matchListings";
import { buildLocalityCentroids } from "./commuteEstimate";
import type { FlatmateProfile, Listing } from "@/types/flatfinds";

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "L1",
    title: "2 BHK Apartment in Test Society for Rent in Hinjewadi Phase 1",
    society: "Test Society",
    locality: "Hinjewadi Phase 1",
    city: "Pune",
    address: "Hinjewadi Phase 1, Pune",
    rentInr: 30000,
    depositInr: 60000,
    maintenanceInr: 1000,
    areaSqFt: 900,
    houseType: "2BHK",
    propertyType: "Apartment",
    furnishing: "Semi Furnished",
    bathrooms: 2,
    hasLift: true,
    hasParking: true,
    petFriendly: true,
    verified: true,
    floor: 5,
    totalFloors: 10,
    amenities: ["Lift", "Security"],
    latitude: 18.5912,
    longitude: 73.7389,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<FlatmateProfile> = {}): FlatmateProfile {
  return {
    id: "p1",
    groupId: "g1",
    name: "Riya",
    musts: {
      maxRentInr: 35000,
      minBathrooms: 1,
      liftRequired: true,
      parkingRequired: true,
      petFriendlyRequired: false,
      excludedLocalities: [],
    },
    preferences: {
      houseType: "2BHK",
      propertyType: "Apartment",
      furnishing: "Semi Furnished",
      areasToExplore: [],
      maxCommuteMinutes: 60,
      commuteReferencePoint: "Hinjewadi Phase 1 office",
    },
    submittedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("passesMusts", () => {
  it("fails a listing over budget", () => {
    const listing = makeListing({ rentInr: 40000 });
    const profile = makeProfile();
    expect(passesMusts(listing, profile.musts)).toBe(false);
  });

  it("ignores lift requirement on the ground floor", () => {
    const listing = makeListing({ floor: 0, hasLift: false });
    const profile = makeProfile();
    expect(passesMusts(listing, profile.musts)).toBe(true);
  });

  it("enforces lift requirement above the ground floor", () => {
    const listing = makeListing({ floor: 3, hasLift: false });
    const profile = makeProfile();
    expect(passesMusts(listing, profile.musts)).toBe(false);
  });

  it("excludes a listing in an excluded locality", () => {
    const listing = makeListing({ locality: "Kothrud" });
    const profile = makeProfile({
      musts: { ...makeProfile().musts, excludedLocalities: ["Kothrud"] },
    });
    expect(passesMusts(listing, profile.musts)).toBe(false);
  });
});

describe("scoreSoftPreferences", () => {
  const centroids = buildLocalityCentroids([makeListing()]);

  it("scores 5/5 with no misses when everything matches", () => {
    const listing = makeListing();
    const profile = makeProfile();
    const result = scoreSoftPreferences(listing, profile, centroids);
    expect(result.metCount).toBe(5);
    expect(result.totalCount).toBe(5);
    expect(result.checks.every((c) => c.met)).toBe(true);
  });

  it("flags a house-type mismatch with a specific reason", () => {
    const listing = makeListing({ houseType: "3BHK" });
    const profile = makeProfile();
    const result = scoreSoftPreferences(listing, profile, centroids);
    expect(result.metCount).toBe(4);
    const miss = result.checks.find((c) => c.criterion === "houseType");
    expect(miss?.met).toBe(false);
    expect(miss?.detail).toContain("3BHK");
    expect(miss?.detail).toContain("2BHK");
  });

  it("treats an empty areasToExplore as no constraint", () => {
    const listing = makeListing({ locality: "Wakad" });
    const profile = makeProfile({
      preferences: { ...makeProfile().preferences, areasToExplore: [] },
    });
    const result = scoreSoftPreferences(listing, profile, centroids);
    const check = result.checks.find((c) => c.criterion === "areasToExplore");
    expect(check?.met).toBe(true);
  });
});

describe("computeShortlist", () => {
  it("excludes listings that fail any profile's musts, even as a fallback", () => {
    const cheap = makeListing({ id: "cheap", rentInr: 20000 });
    const overBudget = makeListing({ id: "over-budget", rentInr: 100000 });
    const profile = makeProfile();
    const shortlist = computeShortlist([profile], [cheap, overBudget]);
    expect(shortlist.map((e) => e.listing.id)).not.toContain("over-budget");
  });

  it("never returns empty — falls back to the closest listing with a flagged compromise when nothing clears every must", () => {
    const listing = makeListing({ rentInr: 100000 });
    const profile = makeProfile(); // maxRentInr: 35000
    const shortlist = computeShortlist([profile], [listing]);
    expect(shortlist).toHaveLength(1);
    expect(shortlist[0].isFallback).toBe(true);
    expect(shortlist[0].fallbackNote).toContain("Riya");
    expect(shortlist[0].fallbackNote).toContain("must-have");
  });

  it("when relaxing musts, still ranks by fewest broken musts first", () => {
    const breaksOne = makeListing({ id: "breaks-one", rentInr: 40000 }); // over budget only
    const breaksTwo = makeListing({ id: "breaks-two", rentInr: 40000, bathrooms: 0 }); // over budget + too few baths
    const profile = makeProfile(); // maxRentInr: 35000, minBathrooms: 1
    const shortlist = computeShortlist([profile], [breaksTwo, breaksOne]);
    expect(shortlist[0].listing.id).toBe("breaks-one");
    expect(shortlist.every((e) => e.isFallback)).toBe(true);
  });

  it("prefers a listing that clears every must over one that doesn't, even if the must-passing one has worse preferences", () => {
    const mustPassing = makeListing({ id: "must-passing", houseType: "3BHK" }); // clears musts, misses a preference
    const mustBreaking = makeListing({ id: "must-breaking", rentInr: 100000 }); // matches every preference, breaks budget
    const profile = makeProfile();
    const shortlist = computeShortlist([profile], [mustBreaking, mustPassing]);
    expect(shortlist.map((e) => e.listing.id)).not.toContain("must-breaking");
    expect(shortlist[0].listing.id).toBe("must-passing");
    expect(shortlist[0].isFallback).toBe(false);
  });

  it("marks a listing as fallback when fewer than two qualify at 50%+", () => {
    // Only one listing survives the musts filter, and it clears preferences fine
    // for one profile but badly for another — so nothing else exists to pick
    // from and the sole survivor should be flagged as a fallback.
    const listing = makeListing({ houseType: "1RK", furnishing: "Unfurnished" });
    const riya = makeProfile({ id: "p1", name: "Riya" });
    const meera = makeProfile({
      id: "p2",
      name: "Meera",
      preferences: {
        ...makeProfile().preferences,
        houseType: "3BHK",
        propertyType: "Villa",
        furnishing: "Fully Furnished",
        areasToExplore: ["Kothrud"],
      },
    });
    const shortlist = computeShortlist([riya, meera], [listing]);
    expect(shortlist).toHaveLength(1);
    expect(shortlist[0].isFallback).toBe(true);
    expect(shortlist[0].fallbackNote).toContain("Meera");
  });

  it("ranks qualifying listings by total preferences met, best first", () => {
    const weaker = makeListing({ id: "weaker", houseType: "3BHK" }); // misses houseType for the profile below
    const stronger = makeListing({ id: "stronger" }); // matches everything
    const profile = makeProfile();
    const shortlist = computeShortlist([profile], [stronger, weaker]);
    expect(shortlist.every((e) => !e.isFallback)).toBe(true);
    expect(shortlist[0].listing.id).toBe("stronger");
  });
});
