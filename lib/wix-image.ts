// Client-safe image helpers, kept out of lib/wix.ts (which is `server-only`) so that
// client components like Gallery can size Wix images without dragging the Wix SDK into
// the browser bundle.
export type BoatImage = { url: string; alt: string; width?: number; height?: number };

// ── Wix CDN sizing (keeps boat photos off Vercel's Image-Optimization quota) ──────
// Wix's own CDN resizes and re-encodes (webp/avif via `enc_auto`) for free. We build the
// scaled URL here and render these with next/image `unoptimized`, so each boat photo costs
// 0 Vercel transformations — the tightest free-tier limit, and the one bots would blow.
type WixFit = "fill" | "fit"; // fill = crop to box, fit = contain whole image
export function wixImageUrl(
  img: BoatImage,
  w: number,
  h: number,
  { mode = "fill", q = 80 }: { mode?: WixFit; q?: number } = {},
): string {
  const id = img.url.match(/\/media\/([^/?#]+)/)?.[1];
  if (!id) return img.url; // not a Wix CDN image (e.g. a local /site asset)
  return `https://static.wixstatic.com/media/${id}/v1/${mode}/w_${w},h_${h},al_c,q_${q},enc_auto/${id}`;
}
