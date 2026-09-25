const TONES = ["bg-slate-500", "bg-rose-500", "bg-slate-600", "bg-rose-600"];

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * The mock listings data has no real photos (see data/mock-listings.json's
 * own disclaimer — it's synthetic). This stands in for a photo so the card
 * layout reads as photo-forward, without pretending a real image exists.
 */
export function ListingPhotoPlaceholder({ id, label }: { id: string; label: string }) {
  const tone = TONES[stableHash(id) % TONES.length];
  return (
    <div className={`flex h-40 items-center justify-center ${tone} text-white`}>
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="opacity-70"
      >
        <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="ml-3 text-lg font-bold tracking-wide">{label}</span>
    </div>
  );
}
