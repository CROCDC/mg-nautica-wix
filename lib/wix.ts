import "server-only";
import { cache } from "react";
import { createClient, OAuthStrategy } from "@wix/sdk";
import { productsV3 } from "@wix/stores";
import { categories } from "@wix/categories";

// Public OAuth client id (visitor tokens) — safe in the browser, hence NEXT_PUBLIC_.
const clientId = process.env.NEXT_PUBLIC_WIX_CLIENT_ID;

// Wix Stores categories live under this category tree.
const TREE = { appNamespace: "@wix/stores" } as const;

let _client: ReturnType<typeof makeClient> | null = null;
function makeClient() {
  if (!clientId) {
    throw new Error("NEXT_PUBLIC_WIX_CLIENT_ID is not set — add it to .env.local (see .env.example).");
  }
  return createClient({
    modules: { productsV3, categories },
    auth: OAuthStrategy({ clientId }),
  });
}
function wix() {
  return (_client ??= makeClient());
}

// ── View models ───────────────────────────────────────────────────────────────
export type BoatImage = { url: string; alt: string; width?: number; height?: number };

export type Boat = {
  id: string;
  name: string;
  slug: string;
  priceUsd: number | null;
  compareAtUsd: number | null;
  onSale: boolean;
  mainImage: BoatImage | null;
  images: BoatImage[];
  ribbon: string | null;
  /** Ricos rich content (`{ nodes: [...] }`) — the boat specs/description. */
  description: RicosContent | null;
  mainCategoryId: string | null;
  categoryIds: string[];
};

export type Category = { id: string; name: string; slug: string };

// Ricos node shapes we care about (loose — the renderer is defensive).
export type RicosNode = {
  type: string;
  nodes?: RicosNode[];
  textData?: { text: string; decorations?: { type: string; linkData?: { link?: { url?: string } } }[] };
  [k: string]: unknown;
};
export type RicosContent = { nodes: RicosNode[] };

// ── Wix media URI → static CDN URL ──────────────────────────────────────────────
// `wix:image://v1/<mediaId>/<file>#originWidth=W&originHeight=H` → static.wixstatic.com
export function parseWixImage(uri: unknown, alt: string): BoatImage | null {
  if (typeof uri !== "string" || !uri.startsWith("wix:image://")) return null;
  const body = uri.replace("wix:image://v1/", "");
  const id = body.split("/")[0];
  if (!id) return null;
  const hash = uri.includes("#") ? uri.slice(uri.indexOf("#") + 1) : "";
  const params = new URLSearchParams(hash);
  const width = Number(params.get("originWidth")) || undefined;
  const height = Number(params.get("originHeight")) || undefined;
  return { url: `https://static.wixstatic.com/media/${id}`, alt, width, height };
}

function toNumber(amount: unknown): number | null {
  const n = Number(amount);
  return Number.isFinite(n) ? n : null;
}

// ── Mapping ─────────────────────────────────────────────────────────────────────
// Minimal shape of the (loosely-typed) Wix V3 product we read.
type PriceRange = { minValue?: { amount?: string } };
type WixProduct = {
  _id: string;
  name?: string;
  slug?: string;
  actualPriceRange?: PriceRange;
  compareAtPriceRange?: PriceRange;
  media?: { main?: { image?: unknown }; itemsInfo?: { items?: { image?: unknown }[] } };
  additionalRibbons?: { name?: string }[];
  allCategoriesInfo?: { categories?: { _id?: string; id?: string }[] };
  description?: RicosContent;
  mainCategoryId?: string;
};
type WixCategory = { _id: string; name?: string; slug?: string };

function mapBoat(p: WixProduct): Boat {
  const name = (p.name ?? "").trim();
  const price = toNumber(p.actualPriceRange?.minValue?.amount);
  const compareAt = toNumber(p.compareAtPriceRange?.minValue?.amount);
  const onSale = compareAt != null && price != null && compareAt > price;

  const mainImage = parseWixImage(p.media?.main?.image, name);
  const items = p.media?.itemsInfo?.items ?? [];
  const images = items.map((it) => parseWixImage(it.image, name)).filter(Boolean) as BoatImage[];

  const ribbon = p.additionalRibbons?.[0]?.name ?? null;
  const categoryIds = (p.allCategoriesInfo?.categories ?? [])
    .map((c) => c._id ?? c.id)
    .filter((id): id is string => Boolean(id));

  return {
    id: p._id,
    name,
    slug: p.slug ?? "",
    priceUsd: price,
    compareAtUsd: compareAt,
    onSale,
    mainImage,
    images: images.length ? images : mainImage ? [mainImage] : [],
    ribbon,
    description: (p.description as RicosContent) ?? null,
    mainCategoryId: p.mainCategoryId ?? null,
    categoryIds,
  };
}

// High-ticket boats are priced in round USD thousands — show "US$ 750,000".
export function formatUsd(n: number | null): string | null {
  if (n == null) return null;
  return "US$ " + Math.round(n).toLocaleString("en-US");
}

// Flatten a Ricos document to plain text (for meta descriptions, og, etc.).
export function ricosToPlainText(content: RicosContent | null, max = 200): string {
  if (!content?.nodes) return "";
  const out: string[] = [];
  const walk = (n: RicosNode) => {
    if (n.textData?.text) out.push(n.textData.text);
    n.nodes?.forEach(walk);
  };
  content.nodes.forEach(walk);
  const text = out.join(" ").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}

// ── Queries (cached per request) ─────────────────────────────────────────────────
// Only 63 public products: fetch all once with category info, filter/sort in memory.
export const getAllBoats = cache(async (): Promise<Boat[]> => {
  const res = await wix()
    .productsV3.queryProducts({ fields: ["ALL_CATEGORIES_INFO"] })
    .limit(100)
    .find();
  return res.items.map((p) => mapBoat(p as unknown as WixProduct));
});

export const getBoatBySlug = cache(async (slug: string): Promise<Boat | null> => {
  try {
    const res = await wix().productsV3.getProductBySlug(slug, {
      fields: ["DESCRIPTION", "MEDIA_ITEMS_INFO", "ALL_CATEGORIES_INFO"],
    });
    const product = ((res as { product?: unknown }).product ?? res) as WixProduct;
    return product?._id ? mapBoat(product) : null;
  } catch {
    return null;
  }
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const res = await wix()
    .categories.queryCategories({ treeReference: TREE })
    .eq("visible", true)
    .find();
  return res.items.map((c) => {
    const cat = c as unknown as WixCategory;
    return { id: cat._id, name: cat.name ?? "", slug: cat.slug ?? "" };
  });
});

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  const all = await getCategories();
  return all.find((c) => c.slug === slug) ?? null;
});

export async function getBoatsInCategory(categoryId: string): Promise<Boat[]> {
  const all = await getAllBoats();
  return all.filter((b) => b.categoryIds.includes(categoryId));
}
