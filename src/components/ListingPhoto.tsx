import Image from "next/image";

/**
 * The mock listings data has no real photos (see data/mock-listings.json's
 * own disclaimer — it's synthetic, not scraped). Each listing gets a stable
 * (same photo every time, not random per render) stock photo from
 * picsum.photos as a stand-in, seeded by listing id so it's reproducible.
 * These are NOT photos of the actual property.
 */
export function ListingPhoto({ id, title }: { id: string; title: string }) {
  return (
    <div className="relative h-40 w-full bg-slate-200 dark:bg-slate-800">
      <Image
        src={`https://picsum.photos/seed/${id}/600/400`}
        alt={title}
        fill
        sizes="(min-width: 1024px) 480px, 100vw"
        className="object-cover"
      />
    </div>
  );
}
