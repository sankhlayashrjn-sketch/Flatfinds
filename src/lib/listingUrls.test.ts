import { describe, expect, it } from "vitest";
import { isSafeListingUrl, splitListingUrls } from "./listingUrls";

describe("isSafeListingUrl", () => {
  it("accepts a plain https listing URL", () => {
    expect(isSafeListingUrl("https://www.99acres.com/some-flat-123")).toBe(true);
  });

  it("rejects a non-http(s) protocol", () => {
    expect(isSafeListingUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeListingUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects localhost and private-network hosts", () => {
    expect(isSafeListingUrl("http://localhost:3000/")).toBe(false);
    expect(isSafeListingUrl("http://127.0.0.1/")).toBe(false);
    expect(isSafeListingUrl("http://192.168.1.5/")).toBe(false);
    expect(isSafeListingUrl("http://169.254.169.254/latest/meta-data")).toBe(false);
  });

  it("rejects an unparseable string", () => {
    expect(isSafeListingUrl("not a url")).toBe(false);
  });
});

describe("splitListingUrls", () => {
  it("splits on newlines and commas, trims, and dedupes", () => {
    const input = "https://a.example.com/1\nhttps://a.example.com/1, https://b.example.com/2\n\n";
    expect(splitListingUrls(input)).toEqual([
      "https://a.example.com/1",
      "https://b.example.com/2",
    ]);
  });

  it("drops unsafe or malformed entries instead of throwing", () => {
    const input = "https://a.example.com/1\nhttp://localhost/2\nnot a url";
    expect(splitListingUrls(input)).toEqual(["https://a.example.com/1"]);
  });

  it("returns an empty array for blank input", () => {
    expect(splitListingUrls("   \n  ")).toEqual([]);
  });
});
