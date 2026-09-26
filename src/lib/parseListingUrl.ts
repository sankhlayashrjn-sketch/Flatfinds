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
  const matches = [...text.matchAll(/₹\s?([\d][\d,]{2,9})(?:\s?\/?-?\s?(?:mo|month|pm))?/gi)];
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

function findPropertyType(text: string): PropertyType | null {
  const lower = text.toLowerCase();
  const ordered: PropertyType[] = ["Villa", "Independent House", "Gated Community", "Society", "Apartment"];
  for (const type of ordered) {
    if (lower.includes(type.toLowerCase())) return type;
  }
  return null;
}

function findFurnishing(text: string): Furnishing | null {
  const lower = text.toLowerCase();
  for (const f of FURNISHING_TYPES) {
    if (lower.includes(f.toLowerCase())) return f;
  }
  if (lower.includes("unfurnished")) return "Unfurnished";
  return null;
}

function findBathrooms(text: string): number | null {
  const match = text.match(/(\d)\s?(?:bathrooms?|baths?)\b/i);
  return match ? Number(match[1]) : null;
}

function findBoolean(text: string, positive: RegExp): boolean | null {
  return positive.test(text) ? true : null;
}

function findLocality(text: string, localities: string[]): string | null {
  const lower = text.toLowerCase();
  const found = localities
    .filter((locality) => lower.includes(locality.toLowerCase()))
    .sort((a, b) => b.length - a.length);
  return found[0] ?? null;
}

export function extractListingInfo(html: string, localities: string[]): ParsedListingFields {
  const $ = cheerio.load(html);
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const plainTitle = $("title").first().text();
  const title = (ogTitle || plainTitle || "").trim() || null;
  const imageUrl = $('meta[property="og:image"]').attr("content")?.trim() || null;

  const bodyText = $("body").text().replace(/\s+/g, " ").slice(0, 20000);
  const searchText = `${title ?? ""} ${bodyText}`;

  return {
    title,
    imageUrl,
    rentInr: findRentInr(searchText),
    locality: findLocality(searchText, localities),
    houseType: findHouseType(searchText),
    propertyType: findPropertyType(searchText),
    furnishing: findFurnishing(searchText),
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
