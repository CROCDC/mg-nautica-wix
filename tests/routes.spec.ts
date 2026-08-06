/**
 * HTTP layer: every route's status, the legacy redirects, robots.txt and the
 * edge middleware — exercised as plain requests, without a page.
 *
 * These are the behaviours a browser test cannot see: a 301 the browser would follow
 * silently, a 403 issued before the app ever renders, the exact bytes of robots.txt.
 */

import { test, expect } from "./fixtures";
import { PUBLIC_PAGES } from "./pages";
import fixtureMeta from "./mock/fixture-meta.json";

// middleware.ts rejects empty and scripted user agents, so anything that should be
// treated as a visitor has to say so. The UA checks below assert that on purpose.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const asVisitor = { headers: { "user-agent": BROWSER_UA } };

// ----- Status codes -----------------------------------------------------------

for (const path of PUBLIC_PAGES.filter((p) => p !== "/no-such-page")) {
  test(`GET ${path} responds 200`, async ({ request }) => {
    const response = await request.get(path, asVisitor);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/html");
  });
}

test("GET an unknown path responds 404", async ({ request }) => {
  const response = await request.get("/definitely-not-a-page", asVisitor);
  expect(response.status()).toBe(404);
});

test("GET an unknown product slug responds 404", async ({ request }) => {
  const response = await request.get(`/product-page/${fixtureMeta.missingProductSlug}`, asVisitor);
  expect(response.status()).toBe(404);
});

// Regression guard for a soft 404: the category page used to render its shell before
// resolving the category, so the 200 was already on the wire by the time notFound()
// fired inside the streamed <Results>. Visitors saw the right page; crawlers saw a 200
// for a category that does not exist. The status is the whole point of this test — a
// body-only assertion would have passed all along.
test("GET an unknown category slug responds 404", async ({ request }) => {
  const response = await request.get("/category/no-such-category", asVisitor);

  expect(response.status()).toBe(404);
  expect(await response.text()).toContain("La página que buscás no existe");
});

test("GET an unknown category slug does not leak the catalog shell", async ({ request }) => {
  // The old soft 404 streamed the real filter bar and heading before swapping in the
  // not-found page, so a crawler indexed a page that does not exist.
  const body = await (await request.get("/category/no-such-category", asVisitor)).text();
  expect(body).not.toContain("filter-bar");
});

test("a valid category still responds 200 with its catalog", async ({ request }) => {
  // The fix moved a Wix lookup ahead of the render; this is what proves it did not
  // start 404-ing the categories that do exist.
  for (const path of ["/category/all-products", "/category/ropa-náutica"]) {
    const response = await request.get(path, asVisitor);
    expect(response.status(), `${path} should still be served`).toBe(200);
    expect(await response.text()).toContain("filter-bar");
  }
});

// ----- Legacy Spanish URLs ----------------------------------------------------
// The site renamed its routes to English; these 301s are what keeps the already
// indexed Spanish URLs and any shared link alive.

const REDIRECTS = [
  { from: "/accesorios", to: "/accessories" },
  { from: "/contacto", to: "/contact" },
  { from: "/curso-brasil", to: "/brazil-course" },
  { from: "/quienes-somos", to: "/about-us" },
  { from: "/servicios", to: "/services" },
  { from: "/vender-tu-embarcacion", to: "/sell-your-boat" },
];

for (const { from, to } of REDIRECTS) {
  test(`GET ${from} redirects permanently to ${to}`, async ({ request }) => {
    const response = await request.get(from, { ...asVisitor, maxRedirects: 0 });

    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toContain(to);
  });

  test(`GET ${from} ends up serving ${to}`, async ({ request }) => {
    const response = await request.get(from, asVisitor);
    expect(response.status()).toBe(200);
    expect(new URL(response.url()).pathname).toBe(to);
  });
}

// ----- robots.txt -------------------------------------------------------------

test("robots.txt welcomes ordinary crawlers", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);

  const body = await response.text();
  expect(body).toContain("User-Agent: *");
  expect(body).toContain("Allow: /");
});

test("robots.txt asks the AI scrapers and SEO crawlers to stay out", async ({ request }) => {
  const body = await (await request.get("/robots.txt")).text();

  // Every page is force-dynamic, so an aggressive crawl burns Wix calls directly.
  for (const bot of ["GPTBot", "ClaudeBot", "CCBot", "PerplexityBot", "AhrefsBot", "SemrushBot"]) {
    expect(body).toContain(`User-Agent: ${bot}`);
  }
  expect(body).toContain("Disallow: /");
});

test("robots.txt is reachable without a user agent so crawlers can always read it", async ({
  request,
}) => {
  // The middleware matcher excludes robots.txt on purpose: blocking a bot's ability to
  // discover it is self-defeating.
  const response = await request.get("/robots.txt", { headers: { "user-agent": "" } });
  expect(response.status()).toBe(200);
});

// ----- Edge middleware --------------------------------------------------------

test("a normal browser user agent is served the page", async ({ request }) => {
  const response = await request.get("/", asVisitor);
  expect(response.status()).toBe(200);
});

for (const ua of [
  "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
  "Mozilla/5.0 (compatible; SemrushBot/7~bl)",
  "Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)",
  "ClaudeBot/1.0",
  "Bytespider",
  "python-requests/2.31.0",
  "axios/1.6.0",
  "curl-like Go-http-client/1.1",
  "Scrapy/2.11 (+https://scrapy.org)",
]) {
  test(`the edge blocks ${ua.slice(0, 28)}`, async ({ request }) => {
    const response = await request.get("/", { headers: { "user-agent": ua } });
    expect(response.status()).toBe(403);
  });
}

test("the edge blocks a request that sends no user agent at all", async ({ request }) => {
  // A blank UA on a public storefront is a script, not a person.
  const response = await request.get("/", { headers: { "user-agent": "" } });
  expect(response.status()).toBe(403);
});

test("the edge blocking is case-insensitive", async ({ request }) => {
  const response = await request.get("/", { headers: { "user-agent": "AHREFSBOT/7.0" } });
  expect(response.status()).toBe(403);
});

test("the edge leaves the static assets alone", async ({ request }) => {
  // The matcher skips /site/, so a blocked-looking UA still gets the images that
  // WhatsApp and Facebook fetch when they build a link preview.
  const response = await request.get("/site/og-image.jpg", {
    headers: { "user-agent": "python-requests/2.31.0" },
  });
  expect(response.status()).toBe(200);
});
