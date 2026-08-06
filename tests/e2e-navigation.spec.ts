/**
 * E2E: getting around the site — the header nav, the footer columns and the 404 exit.
 *
 * These are the flows that break silently after a route rename (the site moved from
 * Spanish to English paths), which is exactly why every destination is walked rather
 * than spot-checked.
 */

import { test, expect } from "./fixtures";

const NAV = [
  { label: "Embarcaciones", path: "/category/all-products", heading: "Embarcaciones" },
  { label: "Accesorios", path: "/accessories", heading: "Accesorios náuticos" },
  { label: "Curso en Brasil", path: "/brazil-course", heading: "Cursos Internacionales — Brasil" },
  { label: "Servicios", path: "/services", heading: "Nuestros servicios" },
  { label: "Vendé tu embarcación", path: "/sell-your-boat", heading: "Vendé tu embarcación" },
  { label: "Quiénes somos", path: "/about-us", heading: "Quiénes somos" },
  { label: "Contacto", path: "/contact", heading: "Contacto" },
];

// ----- Header -----------------------------------------------------------------

for (const item of NAV) {
  test(`header nav reaches ${item.label}`, async ({ page }) => {
    await page.goto("/");

    await page.locator(".nav-links").getByRole("link", { name: item.label, exact: true }).click();

    await page.waitForURL(`**${item.path}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(item.heading);
  });
}

test("brand link returns the visitor home from a deep page", async ({ page }) => {
  await page.goto("/contact");

  await page.locator("a.brand").click();

  await page.waitForURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("broker y gestor");
});

test("header keeps a WhatsApp shortcut on every page", async ({ page }) => {
  await page.goto("/services");

  const wa = page.locator(".nav-actions").getByRole("link", { name: "WhatsApp" });
  await expect(wa).toHaveAttribute("href", "https://wa.me/5491126949628");
  await expect(wa).toHaveAttribute("target", "_blank");
});

// ----- Mobile navigation ------------------------------------------------------
// At <=768px the whole nav collapses behind the burger: `.nav-links` is display:none
// until `.open` is toggled on. Every test above runs at desktop width, where none of
// this code path is reachable — so on a phone the entire navigation was unverified.

test.describe("on a 375px phone", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  const burger = "#nav-burger";
  const links = "#nav-links";

  test("the nav is collapsed behind the burger", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(burger)).toBeVisible();
    await expect(page.locator(links)).not.toBeVisible();
  });

  test("tapping the burger opens the nav and updates aria-expanded", async ({ page }) => {
    await page.goto("/");

    await page.locator(burger).click();

    await expect(page.locator(links)).toBeVisible();
    await expect(page.locator(burger)).toHaveAttribute("aria-expanded", "true");
  });

  test("tapping the burger again closes the nav", async ({ page }) => {
    await page.goto("/");

    await page.locator(burger).click();
    await expect(page.locator(links)).toBeVisible();
    await page.locator(burger).click();

    await expect(page.locator(links)).not.toBeVisible();
    await expect(page.locator(burger)).toHaveAttribute("aria-expanded", "false");
  });

  test("visitor navigates from the burger menu", async ({ page }) => {
    await page.goto("/");

    await page.locator(burger).click();
    await page.locator(links).getByRole("link", { name: "Contacto", exact: true }).click();

    await page.waitForURL("**/contact");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contacto");
    // The menu closes itself on navigation, otherwise it would cover the new page.
    await expect(page.locator(links)).not.toBeVisible();
  });

  test("tapping outside the header closes the menu", async ({ page }) => {
    await page.goto("/");
    await page.locator(burger).click();
    await expect(page.locator(links)).toBeVisible();

    // The open menu is absolutely positioned over the top ~350px of the page, so the
    // tap has to land below it — the top of <main> is still the menu, not "outside".
    await page.locator(".hero-stats").click();

    await expect(page.locator(links)).not.toBeVisible();
    await expect(page.locator(burger)).toHaveAttribute("aria-expanded", "false");
  });
});

// ----- Footer -----------------------------------------------------------------

test("footer company links reach their pages", async ({ page }) => {
  const links = [
    { label: "Quiénes somos", path: "/about-us" },
    { label: "Servicios", path: "/services" },
    { label: "Vendé tu embarcación", path: "/sell-your-boat" },
    { label: "Contacto", path: "/contact" },
  ];

  for (const link of links) {
    await page.goto("/");
    await page.locator(".site-footer").getByRole("link", { name: link.label }).click();
    await page.waitForURL(`**${link.path}`);
  }
});

test("footer boat links reach real category pages", async ({ page }) => {
  await page.goto("/");
  const footerLinks = page.locator(".site-footer").getByRole("link", { name: /Bandera Argentina/ });

  await footerLinks.click();

  await page.waitForURL(/\/category\//);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Argentina");
  await expect(page.locator("p.results-count:not(.sk)")).toBeVisible();
});

// ----- Not found --------------------------------------------------------------

test("an unknown category renders the 404 page rather than an empty catalog", async ({ page }) => {
  const response = await page.goto("/category/no-such-category");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible();
  // The catalog shell must not appear at all — it used to stream in before the
  // not-found page replaced it.
  await expect(page.locator(".filter-bar")).toHaveCount(0);
});

test("an unknown path renders the 404 page with a way home", async ({ page }) => {
  const response = await page.goto("/definitely-not-a-page");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible();

  await page.getByRole("link", { name: "Volver al inicio" }).click();

  await page.waitForURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("broker y gestor");
});
