/**
 * Live checks for the Thalia landing.
 *
 * Unlike the rest of the live suite, these ARE about one specific boat, on purpose: the
 * landing hard-codes Thalia's Wix photos and slug, so if the owner removes a photo or the
 * listing, the landing breaks silently — nothing in the mocked suite can notice. When the
 * boat is sold these go red, and that is the signal to take the landing down.
 */

import { test, expect } from "../fixtures";
import { GALLERY, PHOTOS } from "@/app/thalia/thalia";
import { THALIA_PRODUCT_SLUG } from "@/lib/landings";
import { wixImageUrl } from "@/lib/wix-image";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

test("the Thalia listing still exists and links to its landing", async ({ page }) => {
  await page.goto(`/product-page/${encodeURIComponent(THALIA_PRODUCT_SLUG)}`);

  await expect(page.getByRole("heading", { level: 1 })).toContainText("THALIA");
  await page.getByRole("link", { name: "Ver presentación completa" }).click();

  await page.waitForURL("**/thalia");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thalia");
});

test("the landing price still matches the live listing", async ({ page }) => {
  await page.goto(`/product-page/${encodeURIComponent(THALIA_PRODUCT_SLUG)}`);
  const listed = (await page.locator(".sidebar-price").textContent())?.trim();

  await page.goto("/thalia");

  expect(listed).toContain((await page.locator(".bl-hero-price-value").textContent())?.trim());
});

test("every Thalia photo is still served by the Wix CDN", async ({ request }) => {
  for (const img of Object.values(PHOTOS)) {
    const response = await request.get(wixImageUrl(img, 200, 200), {
      headers: { "user-agent": BROWSER_UA },
    });
    expect(response.status(), img.alt).toBe(200);
    expect(response.headers()["content-type"], img.alt).toContain("image");
  }
  expect(GALLERY.length).toBeGreaterThan(0);
});
