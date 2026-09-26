import * as cheerio from "cheerio";
import { FURNISHING_TYPES, HOUSE_TYPES } from "@/types/flatfinds";
import type { Furnishing, HouseType, PropertyType } from "@/types/flatfinds";
import { isSafeListingUrl } from "./listingUrls";

export { isSafeListingUrl } from "./listingUrls";

/**
 * Best-effort extraction from a listing page a group member found on their
 * own (99acres, MagicBricks, NoBroker, ...). There's no scraping API for
 * these sites, so this reads whatever the page's own <meta> tags and text
 * expose — same trick browsers use for link previews. Fields that can't be
 * read with reasonable confidence come back null rather than guessed, so the
 * matcher (src/lib/suggestedListings.ts) can tell the group what it doesn't
 * actually know instead of scoring a fabricated value.
 */
export interface ParsedListingFields {
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
}

function findRentInr(text: string): number | null {
  // The title is far more reliable than body text — a page's main rent
  // headline usually reads "for Rs. 27,000", while the body repeats several
  // other amounts (similar listings, deposit, per-sqft rate). Since the
  // caller puts the title first, its match naturally wins by appearing first.
  const matches = [...text.matchAll(/(?:₹|Rs\.?|INR)\s?([\d][\d,]{2,9})(?:\s?\/?-?\s?(?:mo|month|pm))?/gi)];
  for (const m of matches) {
    const value = Number(m[1].replace(/,/g, ""));
    // Deposits/prices tend to be much larger or reported alongside "deposit" —
    // a plausible monthly rent for this app's range is a few thousand to a few lakh.
    if (value >= 1000 && value <= 1000000) return value;
  }
  return null;
}

function findHouseType(text: string): HouseType | null {
  const match = text.match(/(\d)\s?-?\s?BHK/i) ?? text.match(/\b(1)\s?-?\s?RK\b/i);
  if (!match) return null;
  const candidate = match[0].replace(/\s|-/g, "").toUpperCase();
  return (HOUSE_TYPES as readonly string[]).includes(candidate) ? (candidate as HouseType) : null;
}

/**
 * A page's body is full of keywords that have nothing to do with THIS
 * listing — "Browse Villas nearby", related-locality links, footer nav — so
 * checking the body for any match at all is unreliable. The title is the
 * one place that reliably describes this specific listing, so it's checked
 * first; the body is only a fallback for pages with a sparse title.
 */
function fromTitleThenBody<T>(
  titleLower: string,
  bodyLower: string,
  candidates: readonly T[],
  matches: (candidate: T, text: string) => boolean,
): T | null {
  for (const candidate of candidates) {
    if (matches(candidate, titleLower)) return candidate;
  }
  for (const candidate of candidates) {
    if (matches(candidate, bodyLower)) return candidate;
  }
  return null;
}

// "Flat" is the common everyday word for what this app calls "Apartment" —
// listing sites say "2 BHK Flat" far more often than "2 BHK Apartment".
const PROPERTY_TYPE_ALIASES: [string, PropertyType][] = [
  ["villa", "Villa"],
  ["independent house", "Independent House"],
  ["gated community", "Gated Community"],
  ["society", "Society"],
  ["apartment", "Apartment"],
  ["flat", "Apartment"],
];

function findPropertyType(titleLower: string, bodyLower: string): PropertyType | null {
  return fromTitleThenBody(titleLower, bodyLower, PROPERTY_TYPE_ALIASES, ([keyword], text) =>
    text.includes(keyword),
  )?.[1] ?? null;
}

function findFurnishing(titleLower: string, bodyLower: string): Furnishing | null {
  // Sites write "Semi-furnished" as often as "Semi Furnished" — normalize the
  // hyphen away so both spellings match the same way a person reading it would.
  return fromTitleThenBody(titleLower.replace(/-/g, " "), bodyLower.replace(/-/g, " "), FURNISHING_TYPES, (f, text) =>
    text.includes(f.toLowerCase()),
  );
}

function findBathrooms(text: string): number | null {
  const match = text.match(/(\d)\s?(?:bathrooms?|baths?)\b/i);
  return match ? Number(match[1]) : null;
}

function findBoolean(text: string, positive: RegExp): boolean | null {
  return positive.test(text) ? true : null;
}

function longestMatch(localities: string[], lower: string): string | null {
  const found = localities
    .filter((locality) => lower.includes(locality.toLowerCase()))
    .sort((a, b) => b.length - a.length);
  return found[0] ?? null;
}

function findLocality(titleLower: string, bodyLower: string, localities: string[]): string | null {
  return longestMatch(localities, titleLower) ?? longestMatch(localities, bodyLower);
}

export function extractListingInfo(html: string, localities: string[]): ParsedListingFields {
  const $ = cheerio.load(html);
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const plainTitle = $("title").first().text();
  const title = (ogTitle || plainTitle || "").trim() || null;
  const imageUrl = $('meta[property="og:image"]').attr("content")?.trim() || null;

  const bodyText = $("body").text().replace(/\s+/g, " ").slice(0, 20000);
  const searchText = `${title ?? ""} ${bodyText}`;
  const titleLower = (title ?? "").toLowerCase();
  const bodyLower = bodyText.toLowerCase();

  return {
    title,
    imageUrl,
    rentInr: findRentInr(searchText),
    locality: findLocality(titleLower, bodyLower, localities),
    houseType: findHouseType(searchText),
    propertyType: findPropertyType(titleLower, bodyLower),
    furnishing: findFurnishing(titleLower, bodyLower),
    bathrooms: findBathrooms(searchText),
    hasLift: findBoolean(searchText, /\blift\b|\belevator\b/i),
    hasParking: findBoolean(searchText, /\bparking\b/i),
    petFriendly: findBoolean(searchText, /pet[\s-]?friendly|pets?\s+allowed/i),
  };
}

export type FetchParseResult =
  | { status: "parsed"; fields: ParsedListingFields }
  | { status: "failed"; fields: Partial<ParsedListingFields> };

/** Fetches and parses a listing URL. Never throws — a failed fetch/parse just comes back as `status: "failed"`. */
export async function fetchAndParseListing(url: string, localities: string[]): Promise<FetchParseResult> {
  if (!isSafeListingUrl(url)) {
    return { status: "failed", fields: {} };
  }
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FlatFindsBot/1.0; +https://flatfinds-six.vercel.app)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    if (!res.ok) return { status: "failed", fields: {} };
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return { status: "failed", fields: {} };
    const html = await res.text();
    const fields = extractListingInfo(html, localities);
    const confident = fields.title !== null && (fields.rentInr !== null || fields.houseType !== null || fields.locality !== null);
    return confident ? { status: "parsed", fields } : { status: "failed", fields };
  } catch {
    return { status: "failed", fields: {} };
  }
}
