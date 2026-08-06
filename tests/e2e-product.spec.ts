/**
 * E2E: the boat detail page — gallery interaction, the lightbox, the WhatsApp
 * hand-off and the not-found branch.
 *
 * The gallery is the only genuinely stateful client component on the site, so its
 * keyboard and click behaviour is exercised the way a visitor would drive it.
 */

import { test, expect, type Page } from "./fixtures";
import { SAMPLE_PRODUCT_SLUG } from "./pages";
import fixtureMeta from "./mock/fixture-meta.json";

const PRODUCT = `/product-page/${SAMPLE_PRODUCT_SLUG}`;

/** The main gallery image's src, which is what changes as the visitor navigates. */
const mainImageSrc = (page: Page) =>
  page.locator(".gallery-main img").first().getAttribute("src");

// ----- Detail page essentials -------------------------------------------------

test("boat detail page shows the title, price and contact call to action", async ({ page }) => {
  await page.goto(PRODUCT);

  await expect(page.getByRole("heading", { level: 1 })).not.toBeEmpty();
  await expect(page.locator(".sidebar-price")).toBeVisible();
  await expect(page.getByRole("link", { name: /Contactar por WhatsApp/ })).toBeVisible();
});

test("whatsapp call to action opens a prefilled chat naming the boat", async ({ page }) => {
  await page.goto(PRODUCT);
  const name = (await page.getByRole("heading", { level: 1 }).textContent())?.trim() ?? "";

  const href = await page
    .getByRole("link", { name: /Contactar por WhatsApp/ })
    .getAttribute("href");

  expect(href).toContain("https://wa.me/5491126949628");
  expect(decodeURIComponent(href ?? "")).toContain(name);
  expect(decodeURIComponent(href ?? "")).toContain("¿Podemos coordinar una visita?");
});

test("breadcrumb takes the visitor back to the catalog", async ({ page }) => {
  await page.goto(PRODUCT);

  await page.locator(".breadcrumb").getByRole("link", { name: "Embarcaciones" }).click();

  await page.waitForURL("**/category/all-products");
  await expect(page.getByRole("heading", { level: 1, name: "Embarcaciones" })).toBeVisible();
});

// ----- Gallery ----------------------------------------------------------------

test("visitor switches the gallery main image with a thumbnail", async ({ page }) => {
  await page.goto(PRODUCT);
  const thumbs = page.locator(".gallery-thumb");
  test.skip((await thumbs.count()) < 2, "this boat has a single photo");

  const before = await mainImageSrc(page);
  await thumbs.nth(1).click();

  await expect(thumbs.nth(1)).toHaveClass(/active/);
  await expect.poll(() => mainImageSrc(page)).not.toBe(before);
});

test("visitor advances the gallery with the next arrow", async ({ page }) => {
  await page.goto(PRODUCT);
  test.skip((await page.locator(".gallery-thumb").count()) < 2, "this boat has a single photo");

  const before = await mainImageSrc(page);
  await page.getByRole("button", { name: "Siguiente" }).click();

  await expect.poll(() => mainImageSrc(page)).not.toBe(before);
});

test("visitor opens the lightbox and closes it with Escape", async ({ page }) => {
  await page.goto(PRODUCT);

  await page.locator(".gallery-main").click();
  await expect(page.locator(".lightbox.open")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.locator(".lightbox.open")).toHaveCount(0);
});

test("lightbox arrow keys move through the photos and update the counter", async ({ page }) => {
  await page.goto(PRODUCT);
  const total = await page.locator(".gallery-thumb").count();
  test.skip(total < 2, "this boat has a single photo");

  await page.locator(".gallery-main").click();
  await expect(page.locator(".lb-counter")).toHaveText(`1 / ${total}`);

  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".lb-counter")).toHaveText(`2 / ${total}`);

  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".lb-counter")).toHaveText(`1 / ${total}`);
});

test("lightbox wraps around when stepping back from the first photo", async ({ page }) => {
  await page.goto(PRODUCT);
  const total = await page.locator(".gallery-thumb").count();
  test.skip(total < 2, "this boat has a single photo");

  await page.locator(".gallery-main").click();
  await page.keyboard.press("ArrowLeft");

  await expect(page.locator(".lb-counter")).toHaveText(`${total} / ${total}`);
});

test("lightbox restores page scrolling after it closes", async ({ page }) => {
  // The lightbox pins body overflow while open; leaking that would freeze the page.
  await page.goto(PRODUCT);

  await page.locator(".gallery-main").click();
  await expect(page.locator(".lightbox.open")).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");

  await page.locator(".lb-close").click();

  await expect(page.locator(".lightbox.open")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

// ----- Accessories share the same detail route --------------------------------

test("visitor opens an accessory from the accessories page", async ({ page }) => {
  await page.goto("/accessories");
  const card = page.locator(".boat-card").first();
  const name = (await card.locator(".boat-card-title").textContent())?.trim() ?? "";

  await card.click();

  await page.waitForURL("**/product-page/**");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
});

// ----- Not found --------------------------------------------------------------

test("an unknown boat slug renders the 404 page", async ({ page }) => {
  const response = await page.goto(`/product-page/${fixtureMeta.missingProductSlug}`);

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible();
  await expect(page.getByText("La página que buscás no existe")).toBeVisible();
});

test("the 404 page offers a way back to the catalog", async ({ page }) => {
  await page.goto(`/product-page/${fixtureMeta.missingProductSlug}`);

  await page.getByRole("link", { name: "Ver embarcaciones" }).click();

  await page.waitForURL("**/category/all-products");
  await expect(page.getByRole("heading", { level: 1, name: "Embarcaciones" })).toBeVisible();
});
