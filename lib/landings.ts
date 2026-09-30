// Catalog boats that also have a dedicated landing page, keyed by their Wix product slug.
// The product page links to the landing so visitors coming from the catalog find it.
export const THALIA_PRODUCT_SLUG = "motovelero-clásico-thalia-único";

export const LANDING_BY_SLUG: Record<string, string> = {
  [THALIA_PRODUCT_SLUG]: "/thalia",
};

/** Where a catalog card sends the visitor: the landing when the boat has one. */
export function boatHref(slug: string): string {
  return LANDING_BY_SLUG[slug] ?? `/product-page/${slug}`;
}
