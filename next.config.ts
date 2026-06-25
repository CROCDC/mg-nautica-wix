import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Boat photos are served from the Wix CDN; allow next/image to optimize them.
    remotePatterns: [
      { protocol: "https", hostname: "static.wixstatic.com" },
    ],
  },
};

export default nextConfig;
