/**
 * Boundary mock for the Wix HTTP API — loaded with `--import` before Next boots.
 *
 * Every page is `force-dynamic` and `lib/wix.ts` is `server-only`, so the Wix calls
 * happen in the SERVER process. Playwright's `page.route()` only sees browser traffic
 * and would never intercept them, which is why the seam lives here instead: we patch
 * `globalThis.fetch` in the Next process itself.
 *
 * We mock the BOUNDARY (the wixapis.com exchanges) and nothing inside it — the real
 * SDK, the real mapping in lib/wix.ts, the real SSR and the real routing all still run.
 *
 * Modes (WIX_MOCK):
 *   record — pass through to Wix and append every exchange to the cassette
 *   replay — serve from the cassette; a miss THROWS instead of falling back to the
 *            network, because a silent fallback would quietly make the whole suite
 *            depend on live credentials again
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CASSETTE = resolve(HERE, "cassette.json");
const MODE = process.env.WIX_MOCK;

// Only the Wix API is mocked. Image CDN and anything else stays untouched.
const isWixApi = (url) => url.includes("wixapis.com");

/** Stable key for an exchange: the parts that actually select a response. */
function keyFor(method, url, body) {
  // Query params can arrive in any order; sort them so the key is order-independent.
  let normalizedUrl = url;
  try {
    const u = new URL(url);
    u.searchParams.sort();
    normalizedUrl = u.toString();
  } catch {
    /* non-absolute URL: key on it verbatim */
  }
  return `${method.toUpperCase()} ${normalizedUrl}\n${body ?? ""}`;
}

/** A visitor token is low-value, but a committed fixture is the wrong place for it. */
function redact(bodyText) {
  return bodyText.replace(
    /("(?:access_token|refresh_token)"\s*:\s*")[^"]*(")/g,
    "$1REDACTED-BY-CASSETTE-RECORDER$2",
  );
}

function loadCassette() {
  try {
    return JSON.parse(readFileSync(CASSETTE, "utf8"));
  } catch {
    return {};
  }
}

if (MODE === "record" || MODE === "replay") {
  const cassette = loadCassette();
  const realFetch = globalThis.fetch;

  globalThis.fetch = async function mockedFetch(input, init) {
    const request = new Request(input, init);
    const url = request.url;

    if (!isWixApi(url)) return realFetch(input, init);

    // Read the body off a clone so the original request stays consumable.
    const body = ["GET", "HEAD"].includes(request.method.toUpperCase())
      ? ""
      : await request.clone().text();
    const key = keyFor(request.method, url, body);

    if (MODE === "replay") {
      const hit = cassette[key];
      if (!hit) {
        throw new Error(
          `[wix-http-mock] No cassette entry for:\n  ${key}\n` +
            `Re-record with \`npm run test:record\` (needs .env.local credentials).`,
        );
      }
      return new Response(hit.body, {
        status: hit.status,
        headers: { "content-type": hit.contentType ?? "application/json" },
      });
    }

    // record: let the real call through, then tee it to the cassette.
    const response = await realFetch(input, init);
    const text = await response.clone().text();
    cassette[key] = {
      status: response.status,
      contentType: response.headers.get("content-type") ?? "application/json",
      body: redact(text),
    };
    mkdirSync(dirname(CASSETTE), { recursive: true });
    writeFileSync(CASSETTE, JSON.stringify(cassette, null, 2) + "\n");
    return response;
  };
}
