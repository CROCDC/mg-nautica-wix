/**
 * Shared test fixtures. Import `test` / `expect` from here instead of
 * `@playwright/test` so every spec gets the same browser-side boundary handling.
 *
 * The Wix API is already mocked inside the Next process (see mock/wix-http-mock.mjs);
 * this covers the one boundary the browser owns: the shared Next Tech footer widget,
 * loaded from a third-party host. Left alone it would make `networkidle` wait on
 * someone else's server and let their deploys churn our committed screenshots, so it
 * is blocked — the site's own footer markup still renders and is still asserted on.
 *
 * The Wix image CDN is deliberately NOT blocked: the boat photos are content, their
 * URLs are pinned by the cassette, and a baseline full of broken images would be worth
 * far less in review.
 */

import { test as base, expect, type Browser, type BrowserContext } from "@playwright/test";

const THIRD_PARTY_HOSTS = ["nexttech.com.ar"];

async function blockThirdParty(context: BrowserContext): Promise<void> {
  await context.route("**/*", (route) => {
    const host = new URL(route.request().url()).hostname;
    if (THIRD_PARTY_HOSTS.some((blocked) => host.endsWith(blocked))) return route.abort();
    return route.fallback();
  });
}

/**
 * A context with the same blocking as the default fixture, for the specs that must
 * build their own (the responsive matrix needs a per-test viewport).
 *
 * `reducedMotion` is repeated here because the config's `use` only reaches the built-in
 * `context` fixture, not a context created by hand — and without it every scroll-reveal
 * element below the fold sits at opacity 0 in the screenshots.
 */
export async function newBlockedContext(
  browser: Browser,
  viewport: { width: number; height: number },
): Promise<BrowserContext> {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  await blockThirdParty(context);
  return context;
}

export const test = base.extend<{ blockThirdPartyRequests: void }>({
  blockThirdPartyRequests: [
    async ({ context }, use) => {
      await blockThirdParty(context);
      await use();
    },
    { auto: true },
  ],
});

export { expect };
export type { Page, Locator } from "@playwright/test";
