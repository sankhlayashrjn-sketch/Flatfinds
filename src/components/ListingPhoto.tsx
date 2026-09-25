import Image from "next/image";

/**
 * The mock listings data has no real photos (see data/mock-listings.json's
 * own disclaimer — it's synthetic, not scraped). Each listing gets a stable
 * (same photo every time, not random per render) photo from this curated
 * pool of real apartment interior/exterior shots (via Unsplash, free to use)
 * — picked deterministically by hashing the listing id. These are NOT
 * photos of the actual property, just realistic stand-ins instead of a
 * generic/unrelated stock image.
 */
const APARTMENT_PHOTO_IDS = [
  // interiors
  "1522708323590-d24dbb6b0267",
  "1564078516393-cf04bd966897",
  "1628592102751-ba83b0314276",
  "1613575831056-0acd5da8f085",
  "1665249934445-1de680641f50",
  "1675279200694-8529c73b1fd0",
  "1589834390005-5d4fb9bf3d32",
  "1738168279272-c08d6dd22002",
  "1738168246881-40f35f8aba0a",
  "1560448204-e02f11c3d0e2",
  "1689043528099-2ba014dd7c64",
  "1618221469555-7f3ad97540d6",
  "1606074280798-2dabb75ce10c",
  "1678762200388-51e11225d4de",
  "1502672260266-1c1ef2d93688",
  // exteriors
  "1515263487990-61b07816b324",
  "1545324418-cc1a3fa10c00",
  "1624204386084-dd8c05e32226",
  "1579632652768-6cb9dcf85912",
  "1516501312919-d0cb0b7b60b8",
  "1619994121345-b61cd610c5a6",
  "1638973140785-3b918e290682",
  "1592276040264-e10344a6a10e",
  "1643906652169-a750f3f70848",
  "1432297984334-707d34c4163a",
  "1571236673892-13d222da2019",
  "1542309175-9b88d743f89f",
  "1610286986642-057ece0c3656",
  "1605267143746-999bf61d0d08",
  "1626273947634-823f04de159e",
];

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function ListingPhoto({ id, title }: { id: string; title: string }) {
  const photoId = APARTMENT_PHOTO_IDS[stableHash(id) % APARTMENT_PHOTO_IDS.length];
  return (
    <div className="relative h-40 w-full bg-slate-200 dark:bg-slate-800">
      <Image
        src={`https://images.unsplash.com/photo-${photoId}?w=600&h=400&fit=crop&q=80`}
        alt={title}
        fill
        sizes="(min-width: 1024px) 480px, 100vw"
        className="object-cover"
      />
    </div>
  );
}
