import { afterEach, describe, expect, it, vi } from "vitest";
import { extractListingInfo, fetchAndParseListing } from "./parseListingUrl";

const localities = ["Wakad", "Hinjewadi Phase 1", "Kothrud"];

function page(body: string, opts: { ogTitle?: string; ogImage?: string; title?: string } = {}) {
  return `<!doctype html><html><head>
    <title>${opts.title ?? ""}</title>
    ${opts.ogTitle ? `<meta property="og:title" content="${opts.ogTitle}">` : ""}
    ${opts.ogImage ? `<meta property="og:image" content="${opts.ogImage}">` : ""}
  </head><body>${body}</body></html>`;
}

describe("extractListingInfo", () => {
  it("reads title, image, rent, BHK, and locality from a realistic listing page", () => {
    const html = page(
      "2 BHK Semi Furnished flat for rent in Wakad. Rent ₹28,500 per month. 2 bathrooms. Lift and parking available.",
      { ogTitle: "2 BHK Flat in Wakad", ogImage: "https://cdn.example.com/photo.jpg" },
    );
    const result = extractListingInfo(html, localities);
    expect(result.title).toBe("2 BHK Flat in Wakad");
    expect(result.imageUrl).toBe("https://cdn.example.com/photo.jpg");
    expect(result.rentInr).toBe(28500);
    expect(result.houseType).toBe("2BHK");
    expect(result.locality).toBe("Wakad");
    expect(result.furnishing).toBe("Semi Furnished");
    expect(result.bathrooms).toBe(2);
    expect(result.hasLift).toBe(true);
    expect(result.hasParking).toBe(true);
  });

  it("prefers the more specific locality when multiple names appear in the text", () => {
    const html = page("A flat near Hinjewadi Phase 1, not far from Wakad either.");
    const result = extractListingInfo(html, localities);
    expect(result.locality).toBe("Hinjewadi Phase 1");
  });

  it("falls back to the plain <title> tag when there's no og:title", () => {
    const html = page("Some description text.", { title: "Fallback Title" });
    const result = extractListingInfo(html, localities);
    expect(result.title).toBe("Fallback Title");
  });

  it("returns nulls for fields it can't find, without throwing", () => {
    const html = page("Just a page with nothing useful on it.");
    const result = extractListingInfo(html, localities);
    expect(result.rentInr).toBeNull();
    expect(result.locality).toBeNull();
    expect(result.houseType).toBeNull();
    expect(result.hasLift).toBeNull();
    expect(result.petFriendly).toBeNull();
  });

  it("recognizes a 'Rs.' prefixed rent, not just the ₹ symbol", () => {
    const html = page("2 BHK flat available now.", { ogTitle: "2 BHK Flat in Wakad for Rs. 27,000" });
    const result = extractListingInfo(html, localities);
    expect(result.rentInr).toBe(27000);
  });

  it("prefers the title's rent over other amounts scattered through the body", () => {
    // Real listing pages repeat several unrelated amounts in the body (similar
    // listings, deposit, per-sqft rate) — the title's own figure is the
    // reliable one, and it's searched first since it's prepended to the text.
    const html = page(
      "Similar nearby: ₹22,500. Deposit ₹60,000. Rent ₹28,000 shown elsewhere on the page.",
      { ogTitle: "2 BHK Flat in Wakad for Rs. 27,000" },
    );
    const result = extractListingInfo(html, localities);
    expect(result.rentInr).toBe(27000);
  });

  it("ignores an out-of-range number that isn't a plausible monthly rent", () => {
    const html = page("Total project value ₹250000000. No monthly figure mentioned.");
    const result = extractListingInfo(html, localities);
    expect(result.rentInr).toBeNull();
  });

  it("detects pet-friendly phrasing", () => {
    const html = page("This society is pet friendly and welcomes furry friends.");
    const result = extractListingInfo(html, localities);
    expect(result.petFriendly).toBe(true);
  });
});

describe("fetchAndParseListing", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("refuses an unsafe URL without making a network request", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const result = await fetchAndParseListing("http://localhost:3000/", localities);
    expect(result.status).toBe("failed");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reports failed when the fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    const result = await fetchAndParseListing("https://example.com/flat", localities);
    expect(result.status).toBe("failed");
  });

  it("reports failed when the response isn't HTML", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
      ),
    );
    const result = await fetchAndParseListing("https://example.com/flat", localities);
    expect(result.status).toBe("failed");
  });

  it("reports parsed when enough real signal is found", async () => {
    const html = page("2 BHK flat in Wakad. Rent ₹28,500 per month.", {
      ogTitle: "2 BHK Flat in Wakad",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }),
      ),
    );
    const result = await fetchAndParseListing("https://example.com/flat", localities);
    expect(result.status).toBe("parsed");
    if (result.status === "parsed") {
      expect(result.fields.rentInr).toBe(28500);
    }
  });

  it("reports failed when the page has a title but no usable signal", async () => {
    const html = page("Nothing useful here.", { ogTitle: "A Listing" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(html, { status: 200, headers: { "content-type": "text/html" } }),
      ),
    );
    const result = await fetchAndParseListing("https://example.com/flat", localities);
    expect(result.status).toBe("failed");
  });
});
