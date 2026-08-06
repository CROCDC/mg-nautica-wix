/**
 * Shared catalog helpers for the specs that drive the boat grid.
 *
 * Not a spec: Playwright only collects *.spec.ts, so this file is imported, never run.
 */

import { type Page } from "../fixtures";

export const CATALOG = "/category/all-products";

/**
 * The real results count, never the skeleton — the <Suspense> fallback reuses the
 * .results-count class with an extra .sk, so matching on it would resolve too early.
 */
export const results = (page: Page) => page.locator("p.results-count:not(.sk)");

/** The prices currently rendered on the grid, in DOM order, as plain numbers. */
export async function visiblePrices(page: Page): Promise<number[]> {
  const texts = await page.locator(".boat-card-price").allTextContents();
  return texts.map((t) => Number(t.replace(/[^0-9]/g, "")));
}

/**
 * domcontentloaded, not the default `load`: the full catalog pulls 71 boat photos from
 * the Wix CDN, and waiting on all of them makes these tests slow and network-dependent
 * for no benefit — the streamed results count is the readiness signal that matters.
 * (The screenshot spec still waits for networkidle, because there the images are the point.)
 */
export async function gotoCatalog(page: Page, query = ""): Promise<void> {
  await page.goto(`${CATALOG}${query}`, { waitUntil: "domcontentloaded" });
  await results(page).waitFor();
}

/** Number of boat cards currently on the grid. */
export const cardCount = (page: Page) => page.locator(".boat-card").count();
