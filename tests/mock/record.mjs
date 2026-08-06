/**
 * Re-record the Wix cassette. Run with `npm run test:record` — needs the real
 * credentials in .env.local, which is exactly why the rest of the suite does not.
 *
 * Boots the production server with the boundary mock in `record` mode and walks
 * every catalog-backed page once, so each Wix exchange the app performs lands in
 * the cassette. Also discovers a live product slug and pins it in fixture-meta.json
 * for the page list.
 */

import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const PORT = 3199;
const BASE = `http://127.0.0.1:${PORT}`;

// middleware.ts rejects empty and scripted user agents, so the recorder has to
// present itself as a real browser or every page would record as a 403.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const get = (path) => fetch(`${BASE}${path}`, { headers: { "user-agent": UA } });

async function waitForServer(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await get("/");
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error("Server did not come up in time");
}

const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  cwd: ROOT,
  env: {
    ...process.env,
    WIX_MOCK: "record",
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --import ${resolve(HERE, "wix-http-mock.mjs")}`,
  },
  stdio: ["ignore", "inherit", "inherit"],
});

try {
  await waitForServer();

  // Pages whose render performs Wix calls. Static pages need no cassette entry.
  for (const path of ["/", "/category/all-products", "/accessories"]) {
    const res = await get(path);
    console.log(`recorded ${path} -> ${res.status}`);
  }

  // Discover real detail-page slugs from the listings and record those pages too.
  // The markup is an RSC payload with escaped quotes, so `\` has to be excluded
  // from the slug alongside the usual URL delimiters.
  const firstSlug = async (path) => {
    const html = await (await get(path)).text();
    const slug = html.match(/\/product-page\/([^"'?#\\\s<]+)/)?.[1];
    if (!slug) throw new Error(`No product link found on ${path}`);
    return slug;
  };

  const productSlug = await firstSlug("/category/all-products");
  const accessorySlug = await firstSlug("/accessories");

  for (const slug of new Set([productSlug, accessorySlug])) {
    const res = await get(`/product-page/${slug}`);
    console.log(`recorded /product-page/${decodeURIComponent(slug)} -> ${res.status}`);
  }

  // A slug that does not exist, so the 404 branch can be tested without the network.
  const missing = "no-such-boat-slug-for-tests";
  console.log(`recorded /product-page/${missing} -> ${(await get(`/product-page/${missing}`)).status}`);

  const meta = {
    productSlug: decodeURIComponent(productSlug),
    accessorySlug: decodeURIComponent(accessorySlug),
    missingProductSlug: missing,
  };
  writeFileSync(resolve(HERE, "fixture-meta.json"), JSON.stringify(meta, null, 2) + "\n");
  console.log(`\npinned ${JSON.stringify(meta, null, 2)}`);
} finally {
  server.kill("SIGTERM");
}
