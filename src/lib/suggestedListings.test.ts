import { describe, expect, it } from "vitest";
import { suggestedListingToListing } from "./suggestedListings";
import { computeShortlist } from "./matchListings";
import { listingPool } from "./listingPool";
import type { FlatmateProfile, SuggestedListing } from "@/types/flatfinds";

function makeSuggested(overrides: Partial<SuggestedListing> = {}): SuggestedListing {
  return {
    id: "sugg-1",
    groupId: "g1",
    submittedBy: "Riya",
    url: "https://example.com/flat",
    parseStatus: "parsed",
    title: "2 BHK in Wakad",
    imageUrl: "https://example.com/photo.jpg",
    rentInr: 28000,
    locality: "Wakad",
    houseType: "2BHK",
    propertyType: "Apartment",
    furnishing: "Semi Furnished",
    bathrooms: 2,
    hasLift: true,
    hasParking: true,
    petFriendly: true,
    createdAt: new Date().toISOString(),
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
      liftRequired: false,
      parkingRequired: false,
      petFriendlyRequired: false,
      excludedLocalities: [],
    },
    preferences: {
      houseType: "2BHK",
      propertyType: "Apartment",
      furnishing: "Semi Furnished",
      areasToExplore: [],
      maxCommuteMinutes: 9999,
      commuteReferencePoint: "Wakad",
    },
    submittedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("suggestedListingToListing", () => {
  it("carries known fields straight through and tags it as a suggestion", () => {
    const listing = suggestedListingToListing(makeSuggested());
    expect(listing.rentInr).toBe(28000);
    expect(listing.locality).toBe("Wakad");
    expect(listing.suggestion?.submittedBy).toBe("Riya");
    expect(listing.suggestion?.url).toBe("https://example.com/flat");
    expect(listing.suggestion?.raw.rentInr).toBe(28000);
  });

  it("fills unknown fields with values that don't unfairly fail a must, but keeps the gap visible in `raw`", () => {
    const listing = suggestedListingToListing(
      makeSuggested({ rentInr: null, bathrooms: null, hasLift: null, locality: null }),
    );
    expect(listing.rentInr).toBe(0);
    expect(listing.bathrooms).toBeGreaterThanOrEqual(5);
    expect(listing.hasLift).toBe(true);
    expect(listing.suggestion?.raw.rentInr).toBeNull();
    expect(listing.suggestion?.raw.bathrooms).toBeNull();
  });

  it("gives listings from an unknown locality real, non-zero coordinates instead of (0,0)", () => {
    const listing = suggestedListingToListing(makeSuggested({ locality: null }));
    expect(listing.latitude).not.toBe(0);
    expect(listing.longitude).not.toBe(0);
  });
});

describe("a parsed suggestion inside computeShortlist", () => {
  it("is scored by the same musts/preferences and can win a spot on the shortlist", () => {
    const suggested = suggestedListingToListing(makeSuggested());
    const profile = makeProfile();
    const shortlist = computeShortlist([profile], [suggested]);
    expect(shortlist).toHaveLength(1);
    expect(shortlist[0].isFallback).toBe(false);
    expect(shortlist[0].listing.suggestion?.submittedBy).toBe("Riya");
  });

  it("gets flagged as a compromise exactly like a mock listing when it breaks a must", () => {
    const suggested = suggestedListingToListing(makeSuggested({ rentInr: 100000 }));
    const profile = makeProfile(); // maxRentInr: 35000
    const shortlist = computeShortlist([profile], [suggested]);
    expect(shortlist[0].isFallback).toBe(true);
    expect(shortlist[0].fallbackNote).toContain("Riya");
  });

  it("can be outranked by a stronger listing from the mock pool", () => {
    const weakSuggestion = suggestedListingToListing(
      makeSuggested({ houseType: "3BHK" }), // misses the profile's houseType preference
    );
    const profile = makeProfile();
    const strongMock = listingPool.find(
      (l) =>
        l.houseType === "2BHK" &&
        l.propertyType === "Apartment" &&
        l.furnishing === "Semi Furnished" &&
        l.rentInr <= profile.musts.maxRentInr,
    );
    expect(strongMock).toBeDefined();
    const shortlist = computeShortlist([profile], [weakSuggestion, strongMock!]);
    expect(shortlist[0].listing.id).toBe(strongMock!.id);
  });
});
