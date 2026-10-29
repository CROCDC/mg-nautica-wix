import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only the Pi preview image (Dockerfile) sets these; Vercel builds stay untouched.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  async headers() {
    if (process.env.NOINDEX !== "1") return [];
    // Previews duplicate the live site: keep them out of search results.
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
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
