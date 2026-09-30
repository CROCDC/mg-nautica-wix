// Catalog boats that also have a dedicated landing page, keyed by their Wix product slug.
// The product page links to the landing so visitors coming from the catalog find it.
export const THALIA_PRODUCT_SLUG = "motovelero-clásico-thalia-único";

export const LANDING_BY_SLUG: Record<string, string> = {
  [THALIA_PRODUCT_SLUG]: "/thalia",
};
