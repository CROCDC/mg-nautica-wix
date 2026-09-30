/**
 * E2E: the Thalia landing — a static, hand-curated page for one catalog boat.
 *
 * It renders without Wix API calls, so what can break here is the page itself: the
 * copy a buyer reads (price, specs), the hand-off to WhatsApp, the photo grid and its
 * lightbox, and the background video, which must stay out of the way of visitors who
 * ask for reduced motion.
 */

import path from "node:path";
import { test, expect, type Page } from "./fixtures";
import { THALIA_VIDEO_URL } from "@/app/thalia/thalia";
import { SAMPLE_PRODUCT_SLUG } from "./pages";

const LANDING = "/thalia";
const GALLERY_SIZE = 9;

// A 1s VP8 clip: Playwright's Chromium ships without H.264, so the real mp4 could never
// play here — and the test should not depend on Wix's video CDN anyway.
const VIDEO_FIXTURE = path.join(__dirname, "assets", "loop.webm");

const photoTiles = (page: Page) => page.locator(".bl-photo");

// ----- Hero and key facts -----------------------------------------------------

test("hero introduces the boat with its name, year and price", async ({ page }) => {
  await page.goto(LANDING);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thalia");
  await expect(page.locator(".bl-hero .hero-eyebrow")).toHaveText(
    "Motovelero clásico de madera · 1931",
  );
  await expect(page.locator(".bl-hero-price-value")).toHaveText("US$ 35,000");
});

test("key stats strip shows the six headline numbers", async ({ page }) => {
  await page.goto(LANDING);
  const stats = page.locator(".bl-stat");

  await expect(stats).toHaveCount(6);
  for (const value of ["1931", "10,05 m", "2,85 m", "1,30 m", "43 HP", "~6 nudos"]) {
    await expect(stats.filter({ hasText: value })).toHaveCount(1);
  }
});

test("technical sheet lists every spec from the listing", async ({ page }) => {
  await page.goto(LANDING);
  const sheet = page.locator(".bl-spec-table");

  const rows = {
    Año: "1931",
    Eslora: "10,05 m",
    Manga: "2,85 m",
    Puntal: "1,46 m",
    Calado: "1,30 m",
    Quilla: "Corrida",
    Constructor: "Parodi",
    Diseño: "Campos",
    Matrícula: "06902 REY",
  };
  for (const [label, value] of Object.entries(rows)) {
    const row = sheet.locator(".bl-spec-row").filter({ has: page.locator("dt", { hasText: label }) });
    await expect(row.locator("dd"), `spec row "${label}"`).toHaveText(value);
  }
});

test("equipment sections cover every area of the boat", async ({ page }) => {
  await page.goto(LANDING);

  for (const area of ["Velamen y aparejo", "Cubierta y cockpit", "Navegación y electrónica"]) {
    await expect(page.locator(".bl-feature").filter({ hasText: area })).toHaveCount(1);
  }
  for (const area of ["Motor", "Interior y confort", "Fondeo", "Seguridad"]) {
    await expect(page.locator(".bl-equip-card h3").filter({ hasText: area })).toHaveCount(1);
  }
  await expect(page.getByText("Piloto automático Raymarine ST4000")).toBeVisible();
});

test("timeline runs from 1931 to today in order", async ({ page }) => {
  await page.goto(LANDING);

  await expect(page.locator(".bl-timeline-year")).toHaveText([
    "1931",
    "~2020",
    "2021",
    "2023",
    "2025",
    "Hoy",
  ]);
});

test("current state is disclosed honestly, including the pending paint job", async ({ page }) => {
  await page.goto(LANDING);

  await expect(page.getByText("ya fueron adquiridas y se entregan junto con la embarcación")).toBeVisible();
  await expect(page.locator(".bl-note")).toContainText("mantenimiento");
});

// ----- Calls to action --------------------------------------------------------

test("every whatsapp call to action opens a prefilled chat about Thalia", async ({ page }) => {
  await page.goto(LANDING);

  // Hero, current state and closing band; the header/footer ones live outside <main>.
  const links = page.locator("main a[href*='wa.me']");
  await expect(links).toHaveCount(3);
  for (const href of await links.evaluateAll((els) => els.map((a) => a.getAttribute("href")))) {
    const text = decodeURIComponent(href ?? "");
    expect(text).toMatch(/^https:\/\/wa\.me\/5491126949628\?text=/);
    expect(text).toContain("Thalia");
  }
});

test("whatsapp links open in a new tab without leaking the opener", async ({ page }) => {
  await page.goto(LANDING);

  for (const link of await page.locator("main a[href*='wa.me']").all()) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
  }
});

test("'Ver fotos' jumps down to the gallery", async ({ page }) => {
  await page.goto(LANDING);

  await page.getByRole("link", { name: "Ver fotos" }).click();

  await expect(page).toHaveURL(/#galeria$/);
  await expect(page.getByRole("heading", { name: "Thalia en fotos" })).toBeInViewport();
});

test("'Ver publicación' points at the boat's catalog listing", async ({ page }) => {
  await page.goto(LANDING);
  const href = await page.getByRole("link", { name: "Ver publicación" }).getAttribute("href");

  expect(decodeURIComponent(href ?? "")).toBe("/product-page/motovelero-clásico-thalia-único");
});

test("the closing band links to the contact page", async ({ page }) => {
  await page.goto(LANDING);

  await page.locator(".cta-band").getByRole("link", { name: "Otras formas de contacto" }).click();

  await page.waitForURL("**/contact");
});

// ----- Photo grid + lightbox --------------------------------------------------

test("gallery shows every photo with a descriptive alt text", async ({ page }) => {
  await page.goto(LANDING);
  const tiles = photoTiles(page);

  await expect(tiles).toHaveCount(GALLERY_SIZE);
  const alts = await tiles.locator("img").evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt")));
  for (const alt of alts) expect(alt?.length ?? 0).toBeGreaterThan(10);
  // Every tile is a distinct photo, not the same one repeated.
  const srcs = await tiles.locator("img").evaluateAll((imgs) => imgs.map((i) => i.getAttribute("src")));
  expect(new Set(srcs).size).toBe(GALLERY_SIZE);
});

test("gallery tiles are square crops but the lightbox shows the whole photo", async ({ page }) => {
  await page.goto(LANDING);

  const tile = await photoTiles(page).nth(1).locator("img").getAttribute("src");
  expect(tile).toMatch(/\/v1\/fill\/w_600,h_600,/);
  const box = await photoTiles(page).nth(1).boundingBox();
  expect(Math.abs((box?.width ?? 0) - (box?.height ?? 1))).toBeLessThanOrEqual(1);

  await photoTiles(page).nth(1).click();
  expect(await page.locator(".lb-img").getAttribute("src")).toMatch(/\/v1\/fit\/w_1600,h_1600,/);
});

test("the first photo is featured at twice the size of the others", async ({ page }) => {
  await page.goto(LANDING);

  const featured = await photoTiles(page).first().boundingBox();
  const regular = await photoTiles(page).nth(1).boundingBox();
  expect((featured?.width ?? 0) / (regular?.width ?? 1)).toBeGreaterThan(1.9);
});

// 4, 3 and 2 columns: the featured 2x2 tile plus eight 1x1 tiles fills each exactly.
for (const width of [1280, 768, 375]) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("the gallery grid has no holes", async ({ page }) => {
      await page.goto(LANDING);
      const boxes = await photoTiles(page).evaluateAll((els) =>
        els.map((e) => {
          const r = e.getBoundingClientRect();
          return { top: Math.round(r.top), right: Math.round(r.right), area: r.width * r.height };
        }),
      );
      const grid = await page.locator(".bl-photo-grid").boundingBox();
      const lastRowTop = Math.max(...boxes.map((b) => b.top));

      // The last row reaches the right edge, and the tiles cover the whole grid box.
      expect(boxes.some((b) => b.top === lastRowTop && Math.abs(b.right - Math.round((grid?.x ?? 0) + (grid?.width ?? 0))) <= 1)).toBe(true);
      const covered = boxes.reduce((sum, b) => sum + b.area, 0);
      expect(covered / ((grid?.width ?? 1) * (grid?.height ?? 1))).toBeGreaterThan(0.9);
    });
  });
}

test("clicking a photo opens the lightbox on that same photo", async ({ page }) => {
  await page.goto(LANDING);
  const alt = await photoTiles(page).nth(2).locator("img").getAttribute("alt");

  await photoTiles(page).nth(2).click();

  const lightbox = page.getByRole("dialog", { name: "Visor de fotos" });
  await expect(lightbox).toBeVisible();
  await expect(lightbox.locator(".lb-counter")).toHaveText(`3 / ${GALLERY_SIZE}`);
  await expect(lightbox.locator(".lb-img")).toHaveAttribute("alt", alt ?? "");
});

test("lightbox arrows and keys move through the photos, wrapping at both ends", async ({ page }) => {
  await page.goto(LANDING);
  await photoTiles(page).last().click();
  const counter = page.locator(".lb-counter");

  await expect(counter).toHaveText(`${GALLERY_SIZE} / ${GALLERY_SIZE}`);
  await page.keyboard.press("ArrowRight");
  await expect(counter).toHaveText(`1 / ${GALLERY_SIZE}`);
  await page.keyboard.press("ArrowLeft");
  await expect(counter).toHaveText(`${GALLERY_SIZE} / ${GALLERY_SIZE}`);

  await page.locator(".lb-arrow.next").click();
  await expect(counter).toHaveText(`1 / ${GALLERY_SIZE}`);
  await page.locator(".lb-arrow.prev").click();
  await expect(counter).toHaveText(`${GALLERY_SIZE} / ${GALLERY_SIZE}`);
});

test("lightbox closes with Escape, the close button and the backdrop", async ({ page }) => {
  await page.goto(LANDING);
  const lightbox = page.locator(".lightbox.open");

  await photoTiles(page).first().click();
  await page.keyboard.press("Escape");
  await expect(lightbox).toHaveCount(0);

  await photoTiles(page).first().click();
  await page.getByRole("button", { name: "Cerrar" }).click();
  await expect(lightbox).toHaveCount(0);

  await photoTiles(page).first().click();
  await lightbox.click({ position: { x: 5, y: 5 } });
  await expect(lightbox).toHaveCount(0);
});

test("clicking the enlarged photo itself does not close the lightbox", async ({ page }) => {
  await page.goto(LANDING);
  await photoTiles(page).first().click();

  await page.locator(".lb-img").click();

  await expect(page.locator(".lightbox.open")).toBeVisible();
});

test("lightbox locks page scroll while open and restores it after", async ({ page }) => {
  await page.goto(LANDING);

  await photoTiles(page).first().click();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");

  await page.keyboard.press("Escape");
  await expect(page.locator(".lightbox.open")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("gallery tiles can be opened from the keyboard", async ({ page }) => {
  await page.goto(LANDING);

  await photoTiles(page).nth(1).focus();
  await page.keyboard.press("Enter");

  await expect(page.locator(".lb-counter")).toHaveText(`2 / ${GALLERY_SIZE}`);
});

// ----- Hero background video --------------------------------------------------

test("with reduced motion the hero video is never started or downloaded", async ({ page }) => {
  // The config asks for reduced motion by default, which is the case under test.
  let videoRequested = false;
  page.on("request", (req) => {
    if (req.url() === THALIA_VIDEO_URL) videoRequested = true;
  });
  await page.goto(LANDING, { waitUntil: "networkidle" });

  const video = page.locator(".bl-hero-video");
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await expect(video).not.toHaveClass(/playing/);
  expect(videoRequested).toBe(false);
  // The photo underneath stays as the visible hero.
  await expect(page.locator(".bl-hero-media img")).toBeVisible();
});

test("without reduced motion the hero video plays muted and fades in", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "no-preference" });
  await context.route(THALIA_VIDEO_URL, (route) =>
    route.fulfill({ path: VIDEO_FIXTURE, contentType: "video/webm" }),
  );
  const page = await context.newPage();

  try {
    await page.goto(LANDING);
    const video = page.locator(".bl-hero-video");

    await expect(video).toHaveClass(/playing/);
    expect(
      await video.evaluate((v: HTMLVideoElement) => ({ muted: v.muted, loop: v.loop, paused: v.paused })),
    ).toEqual({ muted: true, loop: true, paused: false });
  } finally {
    await context.close();
  }
});

test("a video that fails to load leaves the hero photo in place", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "no-preference" });
  await context.route(THALIA_VIDEO_URL, (route) => route.abort());
  const page = await context.newPage();

  try {
    await page.goto(LANDING, { waitUntil: "networkidle" });

    await expect(page.locator(".bl-hero-video")).not.toHaveClass(/playing/);
    await expect(page.locator(".bl-hero-media img")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thalia");
  } finally {
    await context.close();
  }
});

// ----- Structured data --------------------------------------------------------

test("the page publishes product structured data with the right offer", async ({ page }) => {
  await page.goto(LANDING);
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(raw ?? "{}");

  expect(data["@type"]).toBe("Product");
  expect(data.offers).toMatchObject({ price: 35000, priceCurrency: "USD" });
  expect(data.image).toHaveLength(GALLERY_SIZE);
  for (const url of data.image) expect(url).toMatch(/^https:\/\/static\.wixstatic\.com\//);
});

// ----- Link from the catalog --------------------------------------------------

test("a boat without a landing gets no 'presentación completa' link", async ({ page }) => {
  // The positive case lives in the live suite: the cassette does not hold Thalia's
  // detail page, and re-recording it would churn the whole screenshot baseline.
  await page.goto(`/product-page/${SAMPLE_PRODUCT_SLUG}`);

  await expect(page.getByRole("link", { name: /Contactar por WhatsApp/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver presentación completa" })).toHaveCount(0);
});

// ----- Phone ------------------------------------------------------------------

test.describe("on a 375px phone", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("name, price and the whatsapp button fit in the first screen", async ({ page }) => {
    await page.goto(LANDING);

    await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
    await expect(page.locator(".bl-hero-price-value")).toBeInViewport();
    await expect(page.locator(".bl-hero").getByRole("link", { name: /Consultar por WhatsApp/ })).toBeInViewport();
  });

  test("key stats reflow into two columns", async ({ page }) => {
    await page.goto(LANDING);
    const lefts = await page
      .locator(".bl-stat")
      .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().left)));

    expect(new Set(lefts).size).toBe(2);
  });

  test("gallery reflows into two columns with the featured photo full width", async ({ page }) => {
    await page.goto(LANDING);
    const lefts = await photoTiles(page).evaluateAll((els) =>
      els.map((e) => Math.round(e.getBoundingClientRect().left)),
    );
    const grid = await page.locator(".bl-photo-grid").boundingBox();
    const featured = await photoTiles(page).first().boundingBox();

    expect(new Set(lefts).size).toBe(2);
    expect(Math.round(featured?.width ?? 0)).toBe(Math.round(grid?.width ?? -1));
  });

  test("lightbox still opens and navigates by tapping the arrows", async ({ page }) => {
    await page.goto(LANDING);

    await photoTiles(page).first().click();
    await page.locator(".lb-arrow.next").click();

    await expect(page.locator(".lb-counter")).toHaveText(`2 / ${GALLERY_SIZE}`);
  });
});
