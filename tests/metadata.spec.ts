/**
 * Metadata layer: the tags nobody sees in the browser but that decide how the site
 * looks in Google and in a WhatsApp link preview.
 *
 * Worth pinning down because the failure mode is invisible in normal use — a missing
 * og:image:secure_url or a relative image URL simply makes the preview render blank,
 * and nothing in the UI would ever hint at it.
 */

import { test, expect, type Page } from "./fixtures";
import { SAMPLE_PRODUCT_SLUG } from "./pages";

const content = (page: Page, selector: string) =>
  page.locator(selector).first().getAttribute("content");

// ----- Site-wide --------------------------------------------------------------

test("home page carries the site title and description", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("MG Náutica — Su broker y gestor naval");
  expect(await content(page, 'meta[name="description"]')).toContain("Broker y gestor naval");
});

test("inner pages get their own title through the template", async ({ page }) => {
  await page.goto("/contact");
  await expect(page).toHaveTitle("Contacto · MG Náutica");
});

test("the document declares Spanish so screen readers and Google read it right", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});

// ----- Open Graph -------------------------------------------------------------

test("home page open graph tags are complete enough for a WhatsApp preview", async ({ page }) => {
  await page.goto("/");

  expect(await content(page, 'meta[property="og:site_name"]')).toBe("MG Náutica");
  expect(await content(page, 'meta[property="og:type"]')).toBe("website");
  expect(await content(page, 'meta[property="og:locale"]')).toBe("es_AR");

  // A bare og:image string is not enough: Meta's bot needs the secure URL and the
  // dimensions, and it rejects relative URLs — so both have to be absolute HTTPS.
  const image = await content(page, 'meta[property="og:image"]');
  const secure = await content(page, 'meta[property="og:image:secure_url"]');
  expect(image).toMatch(/^https:\/\//);
  expect(secure).toMatch(/^https:\/\//);
  expect(await content(page, 'meta[property="og:image:width"]')).toBe("1200");
  expect(await content(page, 'meta[property="og:image:height"]')).toBe("630");
});

test("the open graph image is actually served", async ({ page, request }) => {
  await page.goto("/");
  const image = await content(page, 'meta[property="og:image"]');

  // Fetch it by path against the app under test — the absolute URL points at production.
  const response = await request.get(new URL(image ?? "").pathname, {
    headers: { "user-agent": "WhatsApp/2.23" },
  });
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image");
});

test("twitter card is the large-image variant", async ({ page }) => {
  await page.goto("/");
  expect(await content(page, 'meta[name="twitter:card"]')).toBe("summary_large_image");
});

// ----- Per-page ---------------------------------------------------------------

test("a boat page describes that boat rather than the site", async ({ page }) => {
  await page.goto(`/product-page/${SAMPLE_PRODUCT_SLUG}`);
  const name = (await page.getByRole("heading", { level: 1 }).textContent())?.trim() ?? "";

  await expect(page).toHaveTitle(`${name} · MG Náutica`);
  expect(await content(page, 'meta[property="og:title"]')).toBe(name);

  const description = await content(page, 'meta[name="description"]');
  expect(description).toBeTruthy();
  expect(description).not.toContain("Broker y gestor naval en Argentina y Uruguay.");
});

test("a boat page shares its own photo in the link preview", async ({ page }) => {
  await page.goto(`/product-page/${SAMPLE_PRODUCT_SLUG}`);

  const image = await content(page, 'meta[property="og:image"]');
  const secure = await content(page, 'meta[property="og:image:secure_url"]');
  expect(image).toContain("static.wixstatic.com");
  expect(secure).toBe(image);
});

test("canonical urls point at the english routes", async ({ page }) => {
  const canonical = async (path: string) => {
    await page.goto(path);
    return page.locator('link[rel="canonical"]').first().getAttribute("href");
  };

  expect(await canonical("/accessories")).toContain("/accessories");
  expect(await canonical("/category/all-products")).toContain("/category/all-products");
  expect(await canonical(`/product-page/${SAMPLE_PRODUCT_SLUG}`)).toContain(
    `/product-page/${SAMPLE_PRODUCT_SLUG}`,
  );
});

test("a boat that is missing gets a plain title instead of a broken one", async ({ page }) => {
  await page.goto("/product-page/no-such-boat-slug-for-tests");
  await expect(page).toHaveTitle("Embarcación no encontrada · MG Náutica");
});
