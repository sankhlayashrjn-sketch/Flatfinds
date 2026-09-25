import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Curated apartment photos stand in for real listing photos
    // (data/mock-listings.json has none) — see ListingPhoto.tsx.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
