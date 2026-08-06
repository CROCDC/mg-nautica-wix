/**
 * E2E: reaching the catalog and getting from a grid into a boat.
 *
 * The filter bar has its own file (e2e-filters.spec.ts); this one covers the paths
 * into and out of the grid, plus the sort/flag outcomes as a visitor experiences them.
 *
 * One test = one user journey, read top-to-bottom like a manual QA script. Assertions
 * are on what the visitor actually sees — the URL, the results count, the boat titles
 * and prices on the cards — never on internal state.
 */

import { test, expect, type Page } from "./fixtures";
import { CATALOG, results, visiblePrices, gotoCatalog, cardCount } from "./helpers/catalog";

/**
 * The pills are soft navigations, so the previous category's cards stay mounted for a
 * beat. The <h1> is rendered per category, which makes it the honest signal that the
 * new results — not the outgoing ones — are what we are measuring.
 */
async function waitForCategoryHeading(page: Page, heading: string | RegExp): Promise<void> {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
  await results(page).waitFor();
}

// ----- Reaching the catalog ---------------------------------------------------

test("visitor reaches the catalog from the home hero", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Explorar embarcaciones" }).click();

  await page.waitForURL(`**${CATALOG}`);
  await expect(page.getByRole("heading", { level: 1, name: "Embarcaciones" })).toBeVisible();
  await expect(results(page)).toContainText("embarcaciones");
  expect(await cardCount(page)).toBeGreaterThan(0);
});

test("visitor opens a boat from the home featured grid", async ({ page }) => {
  await page.goto("/");
  const firstCard = page.locator(".boat-card").first();
  const name = (await firstCard.locator(".boat-card-title").textContent())?.trim() ?? "";
  expect(name).not.toBe("");

  await firstCard.click();

  await page.waitForURL("**/product-page/**");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
});

test("visitor opens a boat from the catalog grid", async ({ page }) => {
  await gotoCatalog(page);
  const card = page.locator(".boat-card").first();
  const name = (await card.locator(".boat-card-title").textContent())?.trim() ?? "";
  const price = (await card.locator(".boat-card-price").textContent())?.trim() ?? "";

  await card.click();

  await page.waitForURL("**/product-page/**");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.locator(".sidebar-price")).toContainText(price);
});

// ----- Sorting the grid -------------------------------------------------------

test("visitor sorts the catalog by price ascending", async ({ page }) => {
  await gotoCatalog(page);
  await page.getByRole("link", { name: "Precio ↑" }).click();

  await page.waitForURL(/[?&]sort=price-asc/);
  await results(page).waitFor();

  const prices = await visiblePrices(page);
  expect(prices.length).toBeGreaterThan(1);
  expect([...prices]).toEqual([...prices].sort((a, b) => a - b));
});

test("visitor sorts the catalog by price descending", async ({ page }) => {
  await gotoCatalog(page);
  await page.getByRole("link", { name: "Precio ↓" }).click();

  await page.waitForURL(/[?&]sort=price-desc/);
  await results(page).waitFor();

  const prices = await visiblePrices(page);
  expect(prices.length).toBeGreaterThan(1);
  expect([...prices]).toEqual([...prices].sort((a, b) => b - a));
});

// ----- Empty state ------------------------------------------------------------

test("a search with no matches shows the empty state and a way back", async ({ page }) => {
  await gotoCatalog(page);
  const total = await cardCount(page);

  await page.fill("input#q", "zzzznosuchboat");
  await page.getByRole("button", { name: "Buscar" }).click();

  await page.waitForURL(/[?&]q=zzzznosuchboat/);
  await expect(page.getByText(/No se encontraron embarcaciones para/)).toBeVisible();
  await expect(page.locator(".boat-card")).toHaveCount(0);

  await page.getByRole("link", { name: "Limpiar filtros" }).click();

  await page.waitForURL(`**${CATALOG}`);
  await results(page).waitFor();
  await expect(page.locator(".boat-card")).toHaveCount(total);
});

// ----- Category pages ---------------------------------------------------------

test("visitor filters the catalog by flag and lands on that category", async ({ page }) => {
  await gotoCatalog(page);
  const total = await cardCount(page);

  await page.getByRole("link", { name: /Uruguay/ }).first().click();

  await page.waitForURL(/\/category\/[^/]+$/);
  await waitForCategoryHeading(page, /Uruguay/);

  const count = await cardCount(page);
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThan(total);
  // Every card on a flag category page carries that flag in its location line.
  const locations = await page.locator(".boat-card-location").allTextContents();
  for (const location of locations) expect(location).toContain("Uruguay");
});

test("visitor returns to the full catalog with the Todas pill", async ({ page }) => {
  await gotoCatalog(page);
  const total = await cardCount(page);

  await page.getByRole("link", { name: /Uruguay/ }).first().click();
  await waitForCategoryHeading(page, /Uruguay/);
  expect(await cardCount(page)).toBeLessThan(total);

  await page.getByRole("link", { name: "Todas" }).click();

  await page.waitForURL(`**${CATALOG}`);
  await waitForCategoryHeading(page, "Embarcaciones");
  await expect(page.locator(".boat-card")).toHaveCount(total);
});
