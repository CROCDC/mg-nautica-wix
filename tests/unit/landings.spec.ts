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
import { GALLERY, PHOTOS, SPECS, THALIA_REEL_POSTER, THALIA_REEL_VARIANTS } from "@/app/thalia/thalia";

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

test("every reel variant exists at the width it declares, in 9:16", () => {
  for (const { src, width } of THALIA_REEL_VARIANTS) {
    const dims = mp4Dimensions(publicFile(src));
    expect(dims.width, src).toBe(width);
    expect(dims.height, src).toBe(Math.round((width * 16) / 9));
  }
});

test("reel variants stay within their weight budget", () => {
  // 19 s with sound. The phones that pick the 1080p file are often on mobile data.
  const budgetMb: Record<number, number> = { 720: 10, 1080: 16 };
  for (const { src, width } of THALIA_REEL_VARIANTS) {
    const mb = statSync(publicFile(src)).size / 1024 / 1024;
    expect(mb, `${src} is ${mb.toFixed(1)} MB`).toBeLessThanOrEqual(budgetMb[width]);
  }
});

test("reel files keep moov up front so playback starts before the download ends", () => {
  for (const { src } of THALIA_REEL_VARIANTS) {
    const head = readFileSync(publicFile(src)).subarray(0, 4096);
    expect(head.indexOf("moov"), src).toBeGreaterThan(-1);
  }
});

test("the reel poster exists and is light", () => {
  const kb = statSync(publicFile(THALIA_REEL_POSTER)).size / 1024;
  expect(kb).toBeLessThanOrEqual(400);
});
