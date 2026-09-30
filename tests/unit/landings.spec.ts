/**
 * Unit layer: the landing-page wiring in lib/landings.ts and the curated Thalia data.
 *
 * The product page looks landings up by the exact Wix slug, which carries accents. That
 * slug is checked against the real catalog in live/thalia.spec.ts — the cassette was
 * recorded before Thalia was listed.
 */

import { test, expect } from "@playwright/test";
import { LANDING_BY_SLUG, THALIA_PRODUCT_SLUG } from "@/lib/landings";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { GALLERY, PHOTOS, SPECS, THALIA_VIDEO_VARIANTS } from "@/app/thalia/thalia";

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

/** Width x height of the first track in an mp4, read from its `tkhd` box (version 0). */
function mp4Dimensions(file: string): { width: number; height: number } {
  const buf = readFileSync(file);
  const at = buf.indexOf("tkhd");
  // Past the box type: 4 version/flags + 20 times/ids + 8 reserved + 8 layer..volume + 36 matrix.
  const dims = at + 4 + 4 + 20 + 8 + 8 + 36;
  return { width: buf.readUInt32BE(dims) >>> 16, height: buf.readUInt32BE(dims + 4) >>> 16 };
}

const publicFile = (src: string) => path.join(__dirname, "..", "..", "public", src);

test("every hero video variant exists at the width it declares, in 16:9", () => {
  for (const { src, width } of THALIA_VIDEO_VARIANTS) {
    const dims = mp4Dimensions(publicFile(src));
    expect(dims.width, src).toBe(width);
    expect(dims.height, src).toBe(Math.round((width * 9) / 16));
  }
});

test("hero video variants stay light enough for a background loop", () => {
  // Nine seconds of looping background; anything heavier hurts more than it adds.
  const budgetMb: Record<number, number> = { 1280: 4, 1920: 8, 2560: 14 };
  for (const { src, width } of THALIA_VIDEO_VARIANTS) {
    const mb = statSync(publicFile(src)).size / 1024 / 1024;
    expect(mb, `${src} is ${mb.toFixed(1)} MB`).toBeLessThanOrEqual(budgetMb[width]);
  }
});

test("hero video variants are listed smallest first with no duplicate widths", () => {
  const widths = THALIA_VIDEO_VARIANTS.map((v) => v.width);
  expect(widths).toEqual([...widths].sort((a, b) => a - b));
  expect(new Set(widths).size).toBe(widths.length);
});
