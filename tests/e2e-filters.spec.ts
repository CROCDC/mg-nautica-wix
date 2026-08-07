/**
 * E2E: the catalog filter bar — the most logic-dense screen on the site.
 *
 * Split out from e2e-catalog.spec.ts, which owns reaching the catalog and opening a
 * boat; this file owns the controls themselves: the search form, the price bounds, the
 * sort and flag pills, the clear button, and how they compose.
 *
 * Two things here are deliberate rather than incidental:
 *   - The form is submitted with Enter as well as the button. Enter is how most people
 *     search, and it goes through the same onSubmit the button does.
 *   - There is a mobile block at the end. The filter bar overflowed the viewport at
 *     375px (the "Buscar" button sat off-screen at x=428), and a desktop-only suite
 *     would never have noticed a control the visitor cannot reach.
 */

import { test, expect, type Page } from "./fixtures";
import { CATALOG, results, visiblePrices, gotoCatalog, cardCount } from "./helpers/catalog";

const search = "input#q";
const minPrice = "input#min";
const maxPrice = "input#max";
const submit = { name: "Buscar" } as const;

/**
 * A pill inside the filter bar, scoped so "Crucero" cannot match a boat card titled
 * "CRUCERO MAMBA 25" — the grid is full of links whose names contain these words.
 */
const pill = (page: Page, name: string) =>
  page.locator(".filter-bar").getByRole("link", { name, exact: true });

/** Titles of the cards currently on the grid, uppercased for keyword assertions. */
const cardTitles = async (page: Page) =>
  (await page.locator(".boat-card-title").allTextContents()).map((t) => t.toUpperCase());

// ----- Search -----------------------------------------------------------------

test("visitor searches with the button", async ({ page }) => {
  await gotoCatalog(page);
  const total = await cardCount(page);

  await page.fill(search, "DRAKKAR");
  await page.getByRole("button", submit).click();

  await page.waitForURL(/[?&]q=DRAKKAR/);
  await results(page).waitFor();
  expect(await cardCount(page)).toBeLessThan(total);
});

test("visitor searches by pressing Enter in the field", async ({ page }) => {
  // The button is not the only path into onSubmit, and it is not the common one.
  await gotoCatalog(page);
  const total = await cardCount(page);

  await page.fill(search, "DRAKKAR");
  await page.locator(search).press("Enter");

  await page.waitForURL(/[?&]q=DRAKKAR/);
  await results(page).waitFor();
  const titles = await page.locator(".boat-card-title").allTextContents();
  expect(titles.length).toBeGreaterThan(0);
  expect(titles.length).toBeLessThan(total);
  for (const title of titles) expect(title.toUpperCase()).toContain("DRAKKAR");
});

test("the search field keeps what the visitor typed after submitting", async ({ page }) => {
  await gotoCatalog(page);

  await page.fill(search, "velero");
  await page.locator(search).press("Enter");

  await page.waitForURL(/[?&]q=velero/);
  await expect(page.locator(search)).toHaveValue("velero");
});

test("surrounding whitespace is trimmed off the search term", async ({ page }) => {
  await gotoCatalog(page);
  await page.fill(search, "  velero  ");
  await page.locator(search).press("Enter");

  // Trimmed before it reaches the URL, so the query stays clean and shareable.
  await page.waitForURL(/[?&]q=velero(&|$)/);
  await results(page).waitFor();
  expect(await cardCount(page)).toBeGreaterThan(0);
});

test("a single match is announced in the singular", async ({ page }) => {
  // 'DRAKKAR' matches exactly one boat, which is the only way to reach this branch.
  await gotoCatalog(page, "?q=DRAKKAR");

  await expect(results(page)).toHaveText("1 embarcación para “DRAKKAR”");
  await expect(page.locator(".boat-card")).toHaveCount(1);
});

test("the search ignores accents in both directions", async ({ page }) => {
  await gotoCatalog(page, "?q=vel%C3%A9ro");

  const titles = await page.locator(".boat-card-title").allTextContents();
  expect(titles.length).toBeGreaterThan(0);
  for (const title of titles) expect(title.toUpperCase()).toContain("VELERO");
});

// ----- Price bounds -----------------------------------------------------------

test("visitor filters by a price floor", async ({ page }) => {
  await gotoCatalog(page);
  const total = await cardCount(page);

  await page.fill(minPrice, "100000");
  await page.locator(minPrice).press("Enter");

  await page.waitForURL(/[?&]min=100000/);
  await results(page).waitFor();

  const prices = await visiblePrices(page);
  expect(prices.length).toBeGreaterThan(0);
  expect(prices.length).toBeLessThan(total);
  for (const price of prices) expect(price).toBeGreaterThanOrEqual(100000);
});

test("visitor filters by a price ceiling", async ({ page }) => {
  await gotoCatalog(page, "?max=10000");

  const prices = await visiblePrices(page);
  expect(prices.length).toBeGreaterThan(0);
  for (const price of prices) expect(price).toBeLessThanOrEqual(10000);
});

test("visitor combines both bounds into a range", async ({ page }) => {
  await gotoCatalog(page, "?min=10000&max=50000");

  const prices = await visiblePrices(page);
  expect(prices.length).toBeGreaterThan(0);
  for (const price of prices) {
    expect(price).toBeGreaterThanOrEqual(10000);
    expect(price).toBeLessThanOrEqual(50000);
  }
});

for (const bound of ["0", "abc", "-5"]) {
  test(`a price bound of "${bound}" is treated as no bound at all`, async ({ page }) => {
    // toNum() only accepts a finite number above zero; everything else must not filter,
    // otherwise a stray value would silently empty the catalog.
    await gotoCatalog(page);
    const total = await cardCount(page);

    await gotoCatalog(page, `?min=${encodeURIComponent(bound)}`);
    expect(await cardCount(page)).toBe(total);
  });
}

test("a price range that matches nothing explains itself", async ({ page }) => {
  await gotoCatalog(page, "?min=99999999");

  // Distinct from the no-results-for-a-search wording, and a separate branch.
  await expect(page.getByText("No se encontraron embarcaciones con esos filtros.")).toBeVisible();
  await expect(page.locator(".boat-card")).toHaveCount(0);
});

test("search and price bounds compose instead of overriding each other", async ({ page }) => {
  await gotoCatalog(page);

  await page.fill(search, "velero");
  await page.fill(minPrice, "10000");
  await page.fill(maxPrice, "60000");
  await page.getByRole("button", submit).click();

  await page.waitForURL(/[?&]q=velero/);
  await results(page).waitFor();
  await expect(page).toHaveURL(/min=10000/);
  await expect(page).toHaveURL(/max=60000/);

  const titles = await page.locator(".boat-card-title").allTextContents();
  const prices = await visiblePrices(page);
  expect(titles.length).toBeGreaterThan(0);
  for (const title of titles) expect(title.toUpperCase()).toContain("VELERO");
  for (const price of prices) {
    expect(price).toBeGreaterThanOrEqual(10000);
    expect(price).toBeLessThanOrEqual(60000);
  }
});

// ----- Boat type --------------------------------------------------------------
// The type is read off the listing name (Wix has no crucero/catamarán category), so
// asserting the keyword is in every visible title is not a tautology dressed up as a
// test — it is the round trip from name, through the classifier, to the grid.

test("visitor filters by boat type", async ({ page }) => {
  await gotoCatalog(page);
  const total = await cardCount(page);

  await pill(page, "Crucero").click();

  await page.waitForURL(/[?&]type=crucero/);
  await results(page).waitFor();

  const shown = await cardTitles(page);
  expect(shown.length).toBeGreaterThan(0);
  expect(shown.length).toBeLessThan(total);
  for (const title of shown) expect(title).toContain("CRUCERO");
});

test("the active type pill is the one highlighted", async ({ page }) => {
  await gotoCatalog(page);
  // With no type in the URL the catch-all is the active one.
  await expect(pill(page, "Todos")).toHaveClass(/btn-navy/);

  await pill(page, "Velero").click();
  await page.waitForURL(/[?&]type=velero/);

  await expect(pill(page, "Velero")).toHaveClass(/btn-navy/);
  await expect(pill(page, "Todos")).not.toHaveClass(/btn-navy/);
});

test("the catch-all pill drops the type and keeps everything else", async ({ page }) => {
  await gotoCatalog(page, "?sort=price-asc&q=velero&type=crucero");

  await pill(page, "Todos").click();

  await page.waitForURL((url) => url.searchParams.get("type") === null);
  await results(page).waitFor();
  await expect(page).toHaveURL(/sort=price-asc/);
  await expect(page).toHaveURL(/q=velero/);
  await expect(pill(page, "Todos")).toHaveClass(/btn-navy/);
});

test("a catamaran shows up under the sailboats", async ({ page }) => {
  // Catamarans have no pill of their own, and nothing in their name says "velero", so
  // this is the assertion that catches them being dropped from the catalog entirely.
  await gotoCatalog(page, "?type=velero");

  const shown = await cardTitles(page);
  expect(shown.some((title) => title.includes("CATAMARAN"))).toBe(true);
});

test('a type of "barco" is treated as no type at all', async ({ page }) => {
  await gotoCatalog(page);
  const total = await cardCount(page);

  await gotoCatalog(page, "?type=barco");

  // Same contract as a junk price bound: unrecognised means unfiltered, not empty. And
  // it must not survive into the pill links, which would spread it across the whole bar.
  expect(await cardCount(page)).toBe(total);
  await expect(pill(page, "Todos")).toHaveClass(/btn-navy/);
  await expect(pill(page, "Velero")).toHaveAttribute("href", `${CATALOG}?type=velero`);
});

test("type composes with the search and the price bounds", async ({ page }) => {
  await gotoCatalog(page);

  await page.fill(search, "velero");
  await page.fill(minPrice, "10000");
  await page.fill(maxPrice, "60000");
  await page.getByRole("button", submit).click();
  await page.waitForURL(/[?&]q=velero/);
  await results(page).waitFor();
  const searched = await cardCount(page);

  await pill(page, "Velero").click();

  // The pill is a plain link built server-side from the active URL, so the whole filter
  // state has to be baked into its href — nothing here re-submits the form.
  await page.waitForURL(/[?&]type=velero/);
  await results(page).waitFor();
  await expect(page).toHaveURL(/q=velero/);
  await expect(page).toHaveURL(/min=10000/);
  await expect(page).toHaveURL(/max=60000/);

  const shown = await cardTitles(page);
  expect(shown.length).toBeGreaterThan(0);
  expect(shown.length).toBeLessThanOrEqual(searched);
  for (const title of shown) expect(title).toContain("VELERO");
  for (const price of await visiblePrices(page)) {
    expect(price).toBeGreaterThanOrEqual(10000);
    expect(price).toBeLessThanOrEqual(60000);
  }
});

test("searching keeps the active type", async ({ page }) => {
  await gotoCatalog(page, "?type=velero");

  await page.fill(search, "plenamar");
  await page.locator(search).press("Enter");

  // The form is a client component that rebuilds the URL by hand; the type lives outside
  // it, so it is the one filter the form could silently drop.
  await page.waitForURL(/[?&]q=plenamar/);
  await results(page).waitFor();
  await expect(page).toHaveURL(/type=velero/);
  await expect(pill(page, "Velero")).toHaveClass(/btn-navy/);
});

test("sorting keeps the active type", async ({ page }) => {
  await gotoCatalog(page, "?type=velero");
  const filtered = await cardCount(page);

  await page.getByRole("link", { name: "Precio ↑" }).click();

  await page.waitForURL(/sort=price-asc/);
  await results(page).waitFor();
  await expect(page).toHaveURL(/type=velero/);
  await expect(page.locator(".boat-card")).toHaveCount(filtered);
  await expect(pill(page, "Velero")).toHaveClass(/btn-navy/);
});

test("a type that matches nothing in this category explains itself", async ({ page }) => {
  // Uruguay stocks sailboats, a cruiser and a catamaran but no lancha — the only way to
  // reach the empty state through the type filter alone.
  await page.goto("/category/ropa-n%C3%A1utica?type=lancha", { waitUntil: "domcontentloaded" });
  await results(page).waitFor();

  await expect(page.getByText("No se encontraron embarcaciones con esos filtros.")).toBeVisible();
  await expect(page.locator(".boat-card")).toHaveCount(0);
});

test("clearing resets the type along with everything else", async ({ page }) => {
  await gotoCatalog(page);
  const total = await cardCount(page);

  // The ✕ lives in the form and the type does not, so this is the seam worth testing:
  // the button has to clear a filter it does not own.
  await pill(page, "Crucero").click();
  await page.waitForURL(/[?&]type=crucero/);
  await results(page).waitFor();
  expect(await cardCount(page)).toBeLessThan(total);

  await page.getByRole("button", { name: "✕" }).click();

  await page.waitForURL(`**${CATALOG}`);
  await results(page).waitFor();
  await expect(page.locator(".boat-card")).toHaveCount(total);
  await expect(pill(page, "Todos")).toHaveClass(/btn-navy/);
  expect(new URL(page.url()).search).toBe("");
});

test("the clear button shows up for a type picked on its own", async ({ page }) => {
  await gotoCatalog(page);
  await expect(page.getByRole("button", { name: "✕" })).toHaveCount(0);

  await pill(page, "Crucero").click();

  await page.waitForURL(/[?&]type=crucero/);
  await expect(page.getByRole("button", { name: "✕" })).toBeVisible();
});

test("switching category resets the type", async ({ page }) => {
  await gotoCatalog(page, "?type=crucero");
  await expect(pill(page, "Crucero")).toHaveClass(/btn-navy/);

  await page.getByRole("link", { name: /Uruguay/ }).first().click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Uruguay/);
  await expect(pill(page, "Todos")).toHaveClass(/btn-navy/);
  expect(new URL(page.url()).search).toBe("");
});

// ----- Sorting ----------------------------------------------------------------

test("the active sort pill is the one highlighted", async ({ page }) => {
  await gotoCatalog(page);
  // With no sort in the URL the default is highlighted.
  await expect(page.getByRole("link", { name: "Más recientes" })).toHaveClass(/btn-navy/);

  await page.getByRole("link", { name: "Precio ↑" }).click();
  await page.waitForURL(/sort=price-asc/);

  await expect(page.getByRole("link", { name: "Precio ↑" })).toHaveClass(/btn-navy/);
  await expect(page.getByRole("link", { name: "Más recientes" })).not.toHaveClass(/btn-navy/);
});

test("sorting keeps the active price bounds", async ({ page }) => {
  await gotoCatalog(page, "?min=10000&max=50000");
  const filtered = await cardCount(page);

  await page.getByRole("link", { name: "Precio ↑" }).click();

  await page.waitForURL(/sort=price-asc/);
  await results(page).waitFor();
  await expect(page).toHaveURL(/min=10000/);
  await expect(page).toHaveURL(/max=50000/);
  await expect(page.locator(".boat-card")).toHaveCount(filtered);

  const prices = await visiblePrices(page);
  expect([...prices]).toEqual([...prices].sort((a, b) => a - b));
});

test("searching keeps the active sort", async ({ page }) => {
  await gotoCatalog(page, "?sort=price-desc");

  await page.fill(search, "velero");
  await page.locator(search).press("Enter");

  await page.waitForURL(/[?&]q=velero/);
  await results(page).waitFor();
  await expect(page).toHaveURL(/sort=price-desc/);

  const prices = await visiblePrices(page);
  expect([...prices]).toEqual([...prices].sort((a, b) => b - a));
});

// ----- The clear button -------------------------------------------------------

test("the clear button only appears once something is filtered", async ({ page }) => {
  await gotoCatalog(page);
  await expect(page.getByRole("button", { name: "✕" })).toHaveCount(0);

  // It keys off the live field state, so it shows up while typing — before submitting.
  await page.fill(search, "v");
  await expect(page.getByRole("button", { name: "✕" })).toBeVisible();
});

test("clearing empties every field and leaves a clean url", async ({ page }) => {
  await gotoCatalog(page);
  const total = await cardCount(page);

  await page.fill(search, "velero");
  await page.fill(minPrice, "5000");
  await page.fill(maxPrice, "90000");
  await page.getByRole("button", submit).click();
  await page.waitForURL(/[?&]q=velero/);
  await results(page).waitFor();
  expect(await cardCount(page)).toBeLessThan(total);

  await page.getByRole("button", { name: "✕" }).click();

  await page.waitForURL(`**${CATALOG}`);
  await results(page).waitFor();
  await expect(page.locator(".boat-card")).toHaveCount(total);
  await expect(page.locator(search)).toHaveValue("");
  await expect(page.locator(minPrice)).toHaveValue("");
  await expect(page.locator(maxPrice)).toHaveValue("");
  // No empty q=&min=&max= left behind — the URL is what gets shared.
  expect(new URL(page.url()).search).toBe("");
});

test("clearing keeps the chosen sort", async ({ page }) => {
  await gotoCatalog(page, "?sort=price-asc&q=velero");

  await page.getByRole("button", { name: "✕" }).click();

  // Waiting on /sort=price-asc/ would match the URL we started on and assert nothing —
  // the change to wait for is `q` going away while `sort` survives.
  await page.waitForURL(
    (url) => url.searchParams.get("q") === null && url.searchParams.get("sort") === "price-asc",
  );
  await results(page).waitFor();
  await expect(page.locator("input#q")).toHaveValue("");
});

// ----- Crossing categories ----------------------------------------------------

test("switching category resets the filter fields", async ({ page }) => {
  // SearchBox is keyed by basePath, so the new category must not inherit the old query.
  await gotoCatalog(page, "?q=velero");
  await expect(page.locator(search)).toHaveValue("velero");

  await page.getByRole("link", { name: /Uruguay/ }).first().click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Uruguay/);
  await expect(page.locator(search)).toHaveValue("");
  expect(new URL(page.url()).search).toBe("");
});

test("the active flag pill is the one highlighted", async ({ page }) => {
  await gotoCatalog(page);
  await expect(page.getByRole("link", { name: "Todas" })).toHaveClass(/btn-navy/);

  await page.getByRole("link", { name: /Uruguay/ }).first().click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Uruguay/);
  await expect(page.getByRole("link", { name: /Uruguay/ }).first()).toHaveClass(/btn-navy/);
  await expect(page.getByRole("link", { name: "Todas" })).not.toHaveClass(/btn-navy/);
});

// ----- On a phone -------------------------------------------------------------

test.describe("on a 375px phone", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("every filter control is reachable and inside the viewport", async ({ page }) => {
    // The regression this guards: the bar used to be 428px wide at this viewport, so
    // the submit button sat off-screen. Bounding boxes catch that even if a click
    // would have been auto-scrolled into view by Playwright.
    await gotoCatalog(page);

    for (const selector of [search, minPrice, maxPrice]) {
      const box = await page.locator(selector).boundingBox();
      expect(box, `${selector} should be laid out`).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, `${selector} runs past the right edge`).toBeLessThanOrEqual(376);
    }

    const button = await page.getByRole("button", submit).boundingBox();
    expect(button!.x + button!.width).toBeLessThanOrEqual(376);
  });

  test("visitor can search from the phone layout", async ({ page }) => {
    await gotoCatalog(page);
    const total = await cardCount(page);

    await page.fill(search, "DRAKKAR");
    await page.getByRole("button", submit).click();

    await page.waitForURL(/[?&]q=DRAKKAR/);
    await results(page).waitFor();
    expect(await cardCount(page)).toBeLessThan(total);
  });

  test("every type pill fits on one line inside the viewport", async ({ page }) => {
    // Why there are four pills and not five: "Catamarán" wrapped the row onto a second
    // line at 375px, so catamarans were folded into Velero. If a label grows past that
    // budget again, this is where it shows up.
    await gotoCatalog(page);

    const rows = new Set<number>();
    for (const name of ["Todos", "Velero", "Crucero", "Lancha"]) {
      const box = await pill(page, name).boundingBox();
      expect(box, `the ${name} pill should be laid out`).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, `the ${name} pill runs past the right edge`).toBeLessThanOrEqual(
        376,
      );
      rows.add(Math.round(box!.y));
    }

    expect([...rows], "the four type pills should share one line").toHaveLength(1);
  });

  test("visitor can filter by type from the phone layout", async ({ page }) => {
    await gotoCatalog(page);
    const total = await cardCount(page);

    await pill(page, "Crucero").click();

    await page.waitForURL(/[?&]type=crucero/);
    await results(page).waitFor();
    expect(await cardCount(page)).toBeLessThan(total);
  });

  test("visitor can filter by price and clear it from the phone layout", async ({ page }) => {
    await gotoCatalog(page);
    const total = await cardCount(page);

    await page.fill(minPrice, "100000");
    await page.getByRole("button", submit).click();
    await page.waitForURL(/[?&]min=100000/);
    await results(page).waitFor();
    expect(await cardCount(page)).toBeLessThan(total);

    await page.getByRole("button", { name: "✕" }).click();

    await page.waitForURL(`**${CATALOG}`);
    await results(page).waitFor();
    await expect(page.locator(".boat-card")).toHaveCount(total);
  });
});
