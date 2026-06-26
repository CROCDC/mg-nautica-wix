import type { MetadataRoute } from "next";

// Crawlers that obey robots.txt but crawl aggressively — AI scrapers and SEO bots.
// They add no value to a boat brokerage and, with every page being force-dynamic, each
// crawl burns Wix API calls + function invocations. We let them opt out politely here;
// the ones that ignore robots.txt are stopped at the edge by middleware.ts.
const BLOCKED_BOTS = [
  // AI / LLM scrapers
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "Bytespider",
  "PerplexityBot",
  "Diffbot",
  "ImagesiftBot",
  // SEO / backlink crawlers
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "DataForSeoBot",
  "BLEXBot",
  "PetalBot",
  "MegaIndex",
  "SeznamBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Everyone else (incl. Googlebot, Bingbot, WhatsApp/Facebook link previews) is welcome.
      { userAgent: "*", allow: "/" },
      ...BLOCKED_BOTS.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
  };
}
