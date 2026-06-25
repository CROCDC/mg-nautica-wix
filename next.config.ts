import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Boat photos are served from the Wix CDN; allow next/image to optimize them.
    remotePatterns: [
      { protocol: "https", hostname: "static.wixstatic.com" },
    ],
  },
  // Permanent (301) redirects from the legacy Spanish URLs to the new English routes,
  // so existing links and indexed pages keep working after the rename.
  async redirects() {
    return [
      { source: "/accesorios", destination: "/accessories", permanent: true },
      { source: "/contacto", destination: "/contact", permanent: true },
      { source: "/curso-brasil", destination: "/brazil-course", permanent: true },
      { source: "/quienes-somos", destination: "/about-us", permanent: true },
      { source: "/servicios", destination: "/services", permanent: true },
      { source: "/vender-tu-embarcacion", destination: "/sell-your-boat", permanent: true },
    ];
  },
};

export default nextConfig;
