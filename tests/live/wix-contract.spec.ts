/**
 * Live smoke suite — the only tests that talk to the real Wix API.
 *
 * Run with `npm run test:live` (needs the credentials in .env.local). Everything else
 * replays a committed cassette, which is what keeps the main suite deterministic and
 * keeps the screenshot baseline from churning whenever the owner edits the catalog.
 * The cost of that isolation is that a breaking change in Wix's contract would go
 * unnoticed — this file is what buys that back.
 *
 * So these assertions are deliberately about SHAPE, never about specific boats:
 * the catalog answers, products map to a name/price/photo, a detail page resolves.
 * A boat being sold must never turn this suite red.
 */

import { test, expect } from "../fixtures";

test("the live catalog answers with mapped boats", async ({ page }) => {
  await page.goto("/category/all-products");

  await expect(page.locator("p.results-count:not(.sk)")).toBeVisible();
  const cards = page.locator(".boat-card");
  expect(await cards.count()).toBeGreaterThan(0);

  // Every card proves the whole mapping chain survived: Wix payload -> Boat -> card.
  const first = cards.first();
  await expect(first.locator(".boat-card-title")).not.toBeEmpty();
  await expect(first.locator(".boat-card-price")).toContainText("US$");
});

test("the live catalog still serves boat photos from the Wix CDN", async ({ page }) => {
  await page.goto("/category/all-products");
  await expect(page.locator("p.results-count:not(.sk)")).toBeVisible();

  const src = await page.locator(".boat-card-img img").first().getAttribute("src");
  expect(src).toContain("static.wixstatic.com");

  // parseWixImage + wixImageUrl only produce this shape if the media URI parsed.
  expect(src).toMatch(/\/v1\/fill\/w_\d+,h_\d+/);
});

test("a live boat detail page resolves from the catalog", async ({ page }) => {
  await page.goto("/category/all-products");
  await expect(page.locator("p.results-count:not(.sk)")).toBeVisible();

  const card = page.locator(".boat-card").first();
  const name = (await card.locator(".boat-card-title").textContent())?.trim() ?? "";
  await card.click();

  await page.waitForURL("**/product-page/**");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.locator(".gallery-main img")).toBeVisible();
  await expect(page.getByRole("link", { name: /Contactar por WhatsApp/ })).toBeVisible();
});

test("the live category tree still separates accessories from boats", async ({ page }) => {
  // Accessories live in their own Wix category and must never leak into the catalog.
  // If Wix's category ids moved, this is where it shows up first.
  await page.goto("/accessories");
  const accessories = page.locator(".boat-card-title");
  await expect(accessories.first()).toBeVisible();
  const accessoryNames = new Set(await accessories.allTextContents());

  await page.goto("/category/all-products");
  await expect(page.locator("p.results-count:not(.sk)")).toBeVisible();
  const boatNames = await page.locator(".boat-card-title").allTextContents();

  expect(boatNames.length).toBeGreaterThan(0);
  for (const name of boatNames) expect(accessoryNames.has(name)).toBe(false);
});

test("the live flag categories still resolve to real pages", async ({ page }) => {
  await page.goto("/category/all-products");
  await page.getByRole("link", { name: /Uruguay/ }).first().click();

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Uruguay");
  await expect(page.locator("p.results-count:not(.sk)")).toBeVisible();
});

test("the live home page renders its featured grid", async ({ page }) => {
  await page.goto("/");

  const cards = page.locator(".boat-card");
  expect(await cards.count()).toBeGreaterThan(0);
  // The hero counter reads the real catalog size; 0 would mean the query came back empty.
  await expect(page.locator(".hero-stat-num").first()).not.toHaveText("0");
});
