import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Enforcement layer for the bots that ignore robots.txt. Blocking them here, at the edge,
// stops the request *before* the force-dynamic SSR + Wix round-trip runs — so a scraper
// sweep can't quietly burn our Wix calls and function invocations. Tune the list as needed.
const BLOCKED_UA = [
  // SEO / backlink crawlers
  "ahrefsbot",
  "semrushbot",
  "mj12bot",
  "dotbot",
  "dataforseobot",
  "blexbot",
  "petalbot",
  "megaindex",
  "seznambot",
  // AI / LLM scrapers
  "bytespider",
  "gptbot",
  "ccbot",
  "claudebot",
  "anthropic-ai",
  "perplexitybot",
  "diffbot",
  "imagesiftbot",
  // Generic scripting clients (a real browser never sends these)
  "scrapy",
  "python-requests",
  "python-httpx",
  "go-http-client",
  "node-fetch",
  "axios",
  "libwww-perl",
  "wget",
  "httpclient",
  "java/",
  "okhttp",
];

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent")?.toLowerCase() ?? "";
  // An empty UA on a public storefront is almost always a script, not a person.
  const blocked = ua === "" || BLOCKED_UA.some((bot) => ua.includes(bot));
  if (blocked) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return NextResponse.next();
}

export const config = {
  // Guard page routes only; skip Next internals, the public assets and robots/sitemap.
  matcher: ["/((?!_next/|favicon|robots.txt|sitemap.xml|site/|js/).*)"],
};
