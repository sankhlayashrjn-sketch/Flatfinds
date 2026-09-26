const PRIVATE_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /\.local$/i,
  /^\[?::1\]?$/,
  /^\[?fe80:/i,
];

/** Rejects anything but a public http(s) URL — used both client-side (form validation) and server-side (before fetching it). */
export function isSafeListingUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  return !PRIVATE_HOSTNAME_PATTERNS.some((p) => p.test(parsed.hostname));
}

/** One URL per line (or comma-separated) — trimmed, deduped, and filtered down to safe http(s) links. */
export function splitListingUrls(text: string): string[] {
  const candidates = text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(candidates)).filter(isSafeListingUrl);
}
