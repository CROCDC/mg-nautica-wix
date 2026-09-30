/**
 * Unit layer: the landing-page wiring in lib/landings.ts and the curated Thalia data.
 *
 * The product page looks landings up by the exact Wix slug, which carries accents. That
 * slug is checked against the real catalog in live/thalia.spec.ts — the cassette was
 * recorded before Thalia was listed.
 */

import { test, expect } from "@playwright/test";
import { LANDING_BY_SLUG, THALIA_PRODUCT_SLUG } from "@/lib/landings";
import { GALLERY, PHOTOS, SPECS, THALIA_VIDEO_URL } from "@/app/thalia/thalia";

test("the thalia slug is stored in the same unicode form Wix uses", () => {
  expect(THALIA_PRODUCT_SLUG).toBe(THALIA_PRODUCT_SLUG.normalize("NFC"));
  expect(LANDING_BY_SLUG[THALIA_PRODUCT_SLUG]).toBe("/thalia");
});

test("every thalia photo points at the Wix CDN and knows its dimensions", () => {
  for (const [name, img] of Object.entries(PHOTOS)) {
    expect(img.url, name).toMatch(/^https:\/\/static\.wixstatic\.com\/media\/fac5f8_[0-9a-f]{32}~mv2\.(jpg|png)$/);
    expect(img.width, name).toBeGreaterThan(0);
    expect(img.height, name).toBeGreaterThan(0);
    expect(img.alt.length, name).toBeGreaterThan(10);
  }
});

test("the gallery holds each photo once and leaves out the poster", () => {
  expect(new Set(GALLERY.map((i) => i.url)).size).toBe(GALLERY.length);
  expect(GALLERY).not.toContain(PHOTOS.poster);
});

test("spec labels are unique so the technical sheet has no duplicated rows", () => {
  const labels = SPECS.map((s) => s.label);
  expect(new Set(labels).size).toBe(labels.length);
});

test("the hero video uses the rendition Wix actually serves", () => {
  // 720p and 1080p answer 403 for this upload; only 480p and below exist.
  expect(THALIA_VIDEO_URL).toMatch(/^https:\/\/video\.wixstatic\.com\/video\/[^/]+\/480p\/mp4\/file\.mp4$/);
});
