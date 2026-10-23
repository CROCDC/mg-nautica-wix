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
 *
 * In both modes the newsletter's CRM writes are faked rather than recorded — see
 * fakeCrmWrite below.
 */

import { appendFileSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
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

// ── CRM writes (newsletter): faked, never recorded ─────────────────────────────
// The newsletter writes contacts, labels and email subscriptions. Recording those
// would create real contacts in the owner's CRM on every `test:record`, so they are
// answered here in both modes and never reach Wix. The answers follow the shapes of
// the real REST responses; the SDK mapping on top of them still runs.
//
// A couple of addresses steer the edge cases:
//   existente-…@… — the contact already exists (409 DUPLICATE_CONTACT_EXISTS)
//   falla-…@…     — Wix is down (500)
//
// Every faked write is appended to WIX_MOCK_WRITES (JSON lines) when it is set, so the
// specs can assert what the app actually sent — the labels, the opt-in — and not just
// the confirmation text on screen.
const WRITES_LOG = process.env.WIX_MOCK_WRITES;
/** Deterministic stand-in for Wix's label key: "Modelo: Colibrí" -> "custom.modelo-colibri". */
const labelKey = (displayName) =>
  "custom." +
  displayName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function fakeCrmWrite(request) {
  if (request.method.toUpperCase() !== "POST") return null;
  const path = new URL(request.url).pathname;
  const isCrmWrite =
    path.endsWith("/contacts/v4/labels") ||
    path.endsWith("/contacts/v4/contacts") ||
    /\/contacts\/v4\/contacts\/[^/]+\/labels$/.test(path) ||
    path.endsWith("/email-marketing/v1/email-subscriptions");
  if (!isCrmWrite) return null;

  const body = JSON.parse((await request.clone().text()) || "{}");
  const [status, response] = crmAnswer(path, body);
  if (WRITES_LOG) appendFileSync(WRITES_LOG, JSON.stringify({ path, body, status, response }) + "\n");
  return new Response(JSON.stringify(response), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function crmAnswer(path, body) {
  if (path.endsWith("/contacts/v4/labels")) {
    const { displayName } = body;
    return [
      200,
      { label: { key: labelKey(displayName), displayName, labelType: "USER_DEFINED" }, newLabel: true },
    ];
  }
  if (path.endsWith("/contacts/v4/contacts")) {
    const email = body.info?.emails?.items?.[0]?.email ?? "";
    if (email.startsWith("falla-")) return [500, { message: "Internal error" }];
    if (email.startsWith("existente-")) {
      // A fresh id per request, so a spec can tie the follow-up label write to its email.
      const duplicateContactId = crypto.randomUUID();
      return [
        409,
        {
          message: "Contact already exists",
          details: {
            applicationError: {
              code: "DUPLICATE_CONTACT_EXISTS",
              description: "Contact already exists",
              data: { duplicateContactId },
            },
          },
        },
      ];
    }
    return [200, { contact: { id: crypto.randomUUID(), revision: 1, info: body.info } }];
  }
  if (path.endsWith("/labels")) {
    const id = path.split("/").at(-2);
    return [200, { contact: { id, revision: 2, info: { labelKeys: { items: body.labelKeys } } } }];
  }
  return [200, { subscription: { ...body.subscription, deliverabilityStatus: "NOT_SET" } }];
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

    const faked = await fakeCrmWrite(request);
    if (faked) return faked;

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
