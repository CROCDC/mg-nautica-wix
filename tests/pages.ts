/**
 * Shared page list + viewport matrix for the responsive/overflow layers.
 *
 * Single source of truth so the overflow guard and the responsive test never drift.
 */

import fixtureMeta from "./mock/fixture-meta.json";

/**
 * A product slug the cassette actually holds a response for. Written by the
 * recorder rather than hand-pinned, so re-recording can never leave the page list
 * pointing at a boat that has since left the catalog.
 */
export const SAMPLE_PRODUCT_SLUG: string = fixtureMeta.productSlug;

/** Every public (no-auth) path the app serves. This site has no authenticated area. */
export const PUBLIC_PAGES: string[] = [
  "/",
  "/category/all-products",
  "/accessories",
  "/brazil-course",
  "/services",
  "/sell-your-boat",
  "/about-us",
  "/contact",
  `/product-page/${SAMPLE_PRODUCT_SLUG}`,
  // The 404 view is a real page users land on; it gets the same treatment.
  "/no-such-page",
];

export type Viewport = { name: string; width: number; height: number };

/**
 * Mobile, large mobile, tablet portrait, tablet landscape, desktop.
 * The committed screenshots key off these names.
 */
export const VIEWPORTS: Viewport[] = [
  { name: "mobile-375", width: 375, height: 667 },
  { name: "mobile-414", width: 414, height: 896 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "tablet-1024", width: 1024, height: 768 },
  { name: "desktop-1280", width: 1280, height: 720 },
];

/** Filesystem-safe screenshot name for a path ('/' -> 'home'). */
export function pageSlug(path: string): string {
  return path.replace(/^\/|\/$/g, "").replace(/\//g, "_") || "home";
}
