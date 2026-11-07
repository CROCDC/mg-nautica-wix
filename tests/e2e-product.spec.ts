/**
 * E2E: the boat detail page — gallery interaction, the lightbox, the WhatsApp
 * hand-off and the not-found branch.
 *
 * The gallery is the only genuinely stateful client component on the site, so its
 * keyboard, click and swipe behaviour is exercised the way a visitor would drive it.
 */

import { test, expect, type Page } from "./fixtures";
import { SAMPLE_PRODUCT_SLUG } from "./pages";
import { swipe } from "./helpers/swipe";
import fixtureMeta from "./mock/fixture-meta.json";

const PRODUCT = `/product-page/${SAMPLE_PRODUCT_SLUG}`;

/**
 * The main photo is a scroll-snap strip with every photo side by side, so "which photo is
 * showing" is how far the strip is scrolled, in photos — not a src swap, since the strip
 * never swaps a src. A fraction means it stopped between two photos.
 */
const shownPhoto = (page: Page) =>
  page.locator(".gallery-track").evaluate((el) => Math.round((el.scrollLeft / el.clientWidth) * 100) / 100);
const slides = (page: Page) => page.locator(".gallery-slide");
const counter = (page: Page) => page.locator(".gallery-counter");
const photoCount = (page: Page) => page.locator(".gallery-thumb").count();

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
  const total = await thumbs.count();
  test.skip(total < 2, "this boat has a single photo");

  await thumbs.nth(1).click();

  await expect(thumbs.nth(1)).toHaveClass(/active/);
  await expect.poll(() => shownPhoto(page)).toBe(1);
  await expect(counter(page)).toHaveText(`2 / ${total}`);
});

test("visitor advances the gallery with the next arrow", async ({ page }) => {
  await page.goto(PRODUCT);
  const total = await photoCount(page);
  test.skip(total < 2, "this boat has a single photo");

  await page.getByRole("button", { name: "Siguiente" }).click();

  await expect.poll(() => shownPhoto(page)).toBe(1);
  await expect(counter(page)).toHaveText(`2 / ${total}`);
  await expect(page.locator(".gallery-thumb").nth(1)).toHaveClass(/active/);
});

test("the gallery arrows wrap from the first photo to the last", async ({ page }) => {
  await page.goto(PRODUCT);
  const total = await photoCount(page);
  test.skip(total < 2, "this boat has a single photo");

  await page.getByRole("button", { name: "Anterior" }).click();

  await expect.poll(() => shownPhoto(page)).toBe(total - 1);
  await expect(counter(page)).toHaveText(`${total} / ${total}`);
});

test("the page loads the first photos only, not the whole gallery", async ({ page }) => {
  // A boat can have thirty photos: a phone should download the one it shows and the next,
  // and the rest as the visitor gets to them.
  await page.goto(PRODUCT);
  const total = await photoCount(page);
  test.skip(total < 4, "too few photos to tell");

  await expect(slides(page).locator("img")).toHaveCount(2);

  await page.getByRole("button", { name: "Siguiente" }).click();
  await expect(slides(page).locator("img")).toHaveCount(3);
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

test("a photo picked in the lightbox stays on when the lightbox closes", async ({ page }) => {
  await page.goto(PRODUCT);
  const total = await photoCount(page);
  test.skip(total < 3, "this boat has too few photos");

  await page.locator(".gallery-main").click();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");

  await expect(counter(page)).toHaveText(`3 / ${total}`);
  await expect.poll(() => shownPhoto(page)).toBe(2);
});

// The rest of the suite runs with reduced motion, where every move is an instant jump. With
// animations on, a one-photo step glides, and the positions it passes through must not be
// mistaken for the visitor's own scrolling.
test.describe("with animations on", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  test("rapid arrow clicks glide one photo each and land exactly on the last one", async ({ page }) => {
    await page.goto(PRODUCT);
    const total = await photoCount(page);
    test.skip(total < 4, "this boat has too few photos");
    const next = page.getByRole("button", { name: "Siguiente" });

    await next.click();
    await next.click();
    await next.click();

    await expect(counter(page)).toHaveText(`4 / ${total}`);
    await expect.poll(() => shownPhoto(page)).toBe(3);
    await expect(page.locator(".gallery-thumb").nth(3)).toHaveClass(/active/);
  });

  test("a thumbnail far away jumps straight there", async ({ page }) => {
    await page.goto(PRODUCT);
    const total = await photoCount(page);
    test.skip(total < 6, "this boat has too few photos");

    await page.locator(".gallery-thumb").nth(5).click();

    await expect(counter(page)).toHaveText(`6 / ${total}`);
    await expect.poll(() => shownPhoto(page)).toBe(5);
    // A jump does not stream every photo in between: only the target and its neighbours load.
    await expect(slides(page).nth(2).locator("img")).toHaveCount(0);
  });

  test.describe("on a touch phone", () => {
    test.use({ viewport: { width: 375, height: 667 }, hasTouch: true });

    test("a swipe and then the arrow carry on from the swiped photo", async ({ page }) => {
      await page.goto(PRODUCT);
      const total = await photoCount(page);
      test.skip(total < 3, "this boat has too few photos");

      await swipe(page, page.locator(".gallery-main"), "left");
      await expect.poll(() => shownPhoto(page)).toBe(1);
      await page.getByRole("button", { name: "Siguiente" }).tap();

      await expect(counter(page)).toHaveText(`3 / ${total}`);
      await expect.poll(() => shownPhoto(page)).toBe(2);
    });
  });
});

// ----- On a phone: swiping ----------------------------------------------------

test.describe("on a 375px touch phone", () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true });

  test("visitor swipes to the next photo and back with the finger", async ({ page }) => {
    await page.goto(PRODUCT);
    const total = await photoCount(page);
    test.skip(total < 2, "this boat has a single photo");
    const main = page.locator(".gallery-main");

    await swipe(page, main, "left");
    await expect(counter(page)).toHaveText(`2 / ${total}`);
    await expect.poll(() => shownPhoto(page)).toBe(1);
    await expect(page.locator(".gallery-thumb").nth(1)).toHaveClass(/active/);

    await swipe(page, main, "right");
    await expect(counter(page)).toHaveText(`1 / ${total}`);
    await expect.poll(() => shownPhoto(page)).toBe(0);
  });

  test("a swipe moves one photo at a time and never opens the lightbox", async ({ page }) => {
    await page.goto(PRODUCT);
    const total = await photoCount(page);
    test.skip(total < 3, "this boat has too few photos");

    await swipe(page, page.locator(".gallery-main"), "left");

    await expect(counter(page)).toHaveText(`2 / ${total}`);
    await expect(page.locator(".lightbox.open")).toHaveCount(0);
  });

  test("swiping keeps the active thumbnail in view", async ({ page }) => {
    await page.goto(PRODUCT);
    const total = await photoCount(page);
    test.skip(total < 8, "the thumbnail strip fits on screen");
    const main = page.locator(".gallery-main");

    for (let i = 0; i < 6; i++) {
      await swipe(page, main, "left");
      await expect(counter(page)).toHaveText(`${i + 2} / ${total}`);
    }

    // Inside the strip's visible width, not scrolled off to the left or right.
    const fits = await page.locator(".gallery-thumb.active").evaluate((thumb) => {
      const t = thumb.getBoundingClientRect();
      const s = thumb.parentElement!.getBoundingClientRect();
      return t.left >= s.left - 1 && t.right <= s.right + 1;
    });
    expect(fits).toBe(true);
  });

  test("the gallery arrows are visible without hovering", async ({ page }) => {
    // A touch screen has no hover; the arrows used to stay at opacity 0 there.
    await page.goto(PRODUCT);
    test.skip((await photoCount(page)) < 2, "this boat has a single photo");

    const opacity = await page
      .locator(".gallery-nav.next")
      .evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(opacity).toBeGreaterThan(0.5);
  });

  test("visitor swipes through the photos in the lightbox too", async ({ page }) => {
    await page.goto(PRODUCT);
    const total = await photoCount(page);
    test.skip(total < 2, "this boat has a single photo");

    await page.locator(".gallery-main").tap();
    const lightbox = page.getByRole("dialog", { name: "Visor de fotos" });
    await expect(lightbox.locator(".lb-counter")).toHaveText(`1 / ${total}`);

    await swipe(page, lightbox, "left");
    await expect(lightbox.locator(".lb-counter")).toHaveText(`2 / ${total}`);
    await expect(lightbox.getByRole("img")).toBeInViewport({ ratio: 0.9 });

    // The page's gallery followed along underneath.
    await page.getByRole("button", { name: "Cerrar" }).tap();
    await expect(counter(page)).toHaveText(`2 / ${total}`);
  });
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
