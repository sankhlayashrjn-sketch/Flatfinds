import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // picsum.photos stands in for real listing photos (data/mock-listings.json
    // has none) — see the comment in ListingPhoto.tsx.
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
};

export default nextConfig;
