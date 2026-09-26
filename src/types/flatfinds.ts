/**
 * Core data shapes for FlatFinds.
 */

export const HOUSE_TYPES = ["1RK", "1BHK", "2BHK", "3BHK", "4BHK"] as const;
export type HouseType = (typeof HOUSE_TYPES)[number];

export const PROPERTY_TYPES = [
  "Apartment",
  "Gated Community",
  "Villa",
  "Society",
  "Independent House",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const FURNISHING_TYPES = ["Fully Furnished", "Semi Furnished", "Unfurnished"] as const;
export type Furnishing = (typeof FURNISHING_TYPES)[number];

/** Hard filters. A listing that fails any one of these for any group member is excluded entirely. */
export interface MustHaveFilters {
  maxRentInr: number;
  minBathrooms: number;
  liftRequired: boolean;
  parkingRequired: boolean;
  petFriendlyRequired: boolean;
  excludedLocalities: string[];
}

/** Soft preferences — exactly 5 scored criteria. Each contributes one point to a person's met/total ratio. */
export interface SoftPreferences {
  houseType: HouseType;
  propertyType: PropertyType;
  furnishing: Furnishing;
  areasToExplore: string[];
  maxCommuteMinutes: number;
  commuteReferencePoint: string;
}

export interface Group {
  id: string;
  name: string;
  expectedMemberCount: number;
  createdAt: string;
  /** The mock listing id the group settled on, once discussed. Null until finalized. */
  finalizedListingId: string | null;
  finalizedAt: string | null;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface FlatmateProfile {
  id: string;
  groupId: string;
  name: string;
  musts: MustHaveFilters;
  preferences: SoftPreferences;
  submittedAt: string;
}

/** A listing, adapted from the scraped-shape mock dataset into the fields matching needs. */
export interface Listing {
  id: string;
  title: string;
  society: string;
  locality: string;
  city: string;
  address: string;
  rentInr: number;
  depositInr: number;
  maintenanceInr: number;
  areaSqFt: number;
  houseType: HouseType;
  propertyType: PropertyType;
  furnishing: Furnishing;
  bathrooms: number;
  hasLift: boolean;
  hasParking: boolean;
  petFriendly: boolean;
  verified: boolean;
  floor: number;
  totalFloors: number;
  amenities: string[];
  latitude: number;
  longitude: number;
  /** Set only for a listing built from a member-submitted URL — absent for the mock pool. */
  suggestion?: {
    submittedBy: string;
    url: string;
    parseStatus: "pending" | "parsed" | "failed";
    /** What was actually detected, before neutral defaults were filled in for scoring — use this for display. */
    raw: SuggestedListing;
  };
}

/** A listing URL a group member found on their own, submitted alongside their preferences. */
export interface SuggestedListing {
  id: string;
  groupId: string;
  submittedBy: string;
  url: string;
  parseStatus: "pending" | "parsed" | "failed";
  title: string | null;
  imageUrl: string | null;
  rentInr: number | null;
  locality: string | null;
  houseType: HouseType | null;
  propertyType: PropertyType | null;
  furnishing: Furnishing | null;
  bathrooms: number | null;
  hasLift: boolean | null;
  hasParking: boolean | null;
  petFriendly: boolean | null;
  createdAt: string;
}

export type MustCriterion =
  | "rent"
  | "bathrooms"
  | "lift"
  | "parking"
  | "petFriendly"
  | "excludedLocality";

/** One must-have a listing broke for a given person — used only when nothing clears every must, see computeShortlist. */
export interface MustViolation {
  criterion: MustCriterion;
  detail: string;
}

export type SoftCriterion =
  | "houseType"
  | "propertyType"
  | "furnishing"
  | "areasToExplore"
  | "commute";

export interface PreferenceCheck {
  criterion: SoftCriterion;
  met: boolean;
  /** Plain-language "Not met: ..." reason. Empty when met. */
  detail: string;
}

/** One group member's read on one listing's soft preferences. */
export interface PersonMatchResult {
  profileId: string;
  name: string;
  metCount: number;
  totalCount: number;
  checks: PreferenceCheck[];
}

/** One card on the shortlist: a listing plus how each group member reads it. */
export interface ShortlistEntry {
  listing: Listing;
  personResults: PersonMatchResult[];
  isFallback: boolean;
  fallbackNote?: string;
}
