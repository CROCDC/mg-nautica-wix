/**
 * Unit layer: the pure logic in lib/wix.ts and lib/wix-image.ts.
 *
 * These are the functions every page depends on to turn a loosely-typed Wix payload
 * into something renderable, so their edge cases (missing price, non-Wix image URI,
 * empty rich text) are worth pinning down directly instead of only through the UI.
 *
 * No network and no browser — this project's "repository layer" is the Wix client,
 * and its real behaviour is covered by the HTTP and E2E layers against the cassette.
 */

import { test, expect } from "@playwright/test";
import { formatUsd, parseWixImage, ricosToPlainText, categoryLabel } from "@/lib/wix";
import type { RicosContent } from "@/lib/wix";
import { wixImageUrl } from "@/lib/wix-image";

// ----- formatUsd --------------------------------------------------------------

test("formatUsd renders whole thousands with a US$ prefix", () => {
  expect(formatUsd(750000)).toBe("US$ 750,000");
});

test("formatUsd rounds fractional amounts to whole dollars", () => {
  expect(formatUsd(1234.56)).toBe("US$ 1,235");
});

test("formatUsd returns null for an unknown price so callers can show a fallback", () => {
  expect(formatUsd(null)).toBeNull();
});

test("formatUsd renders zero rather than treating it as missing", () => {
  expect(formatUsd(0)).toBe("US$ 0");
});

// ----- parseWixImage ----------------------------------------------------------

test("parseWixImage maps a wix media uri to a static CDN url with its dimensions", () => {
  const uri =
    "wix:image://v1/abc123~mv2.jpg/boat.jpg#originWidth=1600&originHeight=1200";
  expect(parseWixImage(uri, "Velero")).toEqual({
    url: "https://static.wixstatic.com/media/abc123~mv2.jpg",
    alt: "Velero",
    width: 1600,
    height: 1200,
  });
});

test("parseWixImage leaves dimensions undefined when the uri carries no size hash", () => {
  const parsed = parseWixImage("wix:image://v1/abc123~mv2.jpg/boat.jpg", "Velero");
  expect(parsed).toEqual({
    url: "https://static.wixstatic.com/media/abc123~mv2.jpg",
    alt: "Velero",
    width: undefined,
    height: undefined,
  });
});

test("parseWixImage rejects a value that is not a wix media uri", () => {
  expect(parseWixImage("https://example.com/boat.jpg", "Velero")).toBeNull();
});

test("parseWixImage rejects a non-string value from the loosely-typed payload", () => {
  expect(parseWixImage(undefined, "Velero")).toBeNull();
  expect(parseWixImage(null, "Velero")).toBeNull();
  expect(parseWixImage(42, "Velero")).toBeNull();
});

// ----- ricosToPlainText -------------------------------------------------------

const ricos = (...paragraphs: string[]): RicosContent => ({
  nodes: paragraphs.map((text) => ({
    type: "PARAGRAPH",
    nodes: [{ type: "TEXT", textData: { text, decorations: [] } }],
  })),
});

test("ricosToPlainText flattens nested nodes into a single spaced string", () => {
  expect(ricosToPlainText(ricos("Velero impecable.", "Motor nuevo."))).toBe(
    "Velero impecable. Motor nuevo.",
  );
});

test("ricosToPlainText collapses runs of whitespace", () => {
  expect(ricosToPlainText(ricos("Velero   \n  impecable"))).toBe("Velero impecable");
});

test("ricosToPlainText truncates past the limit with an ellipsis", () => {
  const result = ricosToPlainText(ricos("a".repeat(300)), 50);
  expect(result).toHaveLength(50);
  expect(result.endsWith("…")).toBe(true);
});

test("ricosToPlainText returns an empty string for missing content", () => {
  expect(ricosToPlainText(null)).toBe("");
});

// ----- categoryLabel ----------------------------------------------------------

test("categoryLabel renames the catch-all category to the storefront wording", () => {
  expect(categoryLabel("all-products", "Whatever")).toBe("Embarcaciones");
});

test("categoryLabel maps a known wix slug to its clean emoji label", () => {
  expect(categoryLabel("🇦🇷emb-a-motor", "ignored")).toBe("🛥️ A motor");
});

test("categoryLabel maps a known slug that carries no emoji", () => {
  expect(categoryLabel("buenos-aires-zona-norte-y-caba", "ignored")).toBe("Zona Norte / CABA");
});

test("categoryLabel falls back to the wix name for an unmapped slug", () => {
  expect(categoryLabel("brand-new-category", "Categoría nueva")).toBe("Categoría nueva");
});

// ----- wixImageUrl ------------------------------------------------------------

test("wixImageUrl builds a CDN-resized url so the photo skips Vercel's transform quota", () => {
  const img = { url: "https://static.wixstatic.com/media/abc123~mv2.jpg", alt: "" };
  expect(wixImageUrl(img, 760, 520)).toBe(
    "https://static.wixstatic.com/media/abc123~mv2.jpg/v1/fill/w_760,h_520,al_c,q_80,enc_auto/abc123~mv2.jpg",
  );
});

test("wixImageUrl honours the fit mode and quality used by the lightbox", () => {
  const img = { url: "https://static.wixstatic.com/media/abc123~mv2.jpg", alt: "" };
  expect(wixImageUrl(img, 1600, 1600, { mode: "fit", q: 85 })).toContain(
    "/v1/fit/w_1600,h_1600,al_c,q_85,enc_auto/",
  );
});

test("wixImageUrl passes through a non-Wix url untouched", () => {
  const img = { url: "/site/logo-mg-nautica.png", alt: "" };
  expect(wixImageUrl(img, 100, 100)).toBe("/site/logo-mg-nautica.png");
});
