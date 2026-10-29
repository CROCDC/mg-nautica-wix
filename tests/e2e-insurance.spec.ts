/**
 * E2E: the Parrado Seguros alliance — the /insurance page, its quote builder and the
 * places across the site that lead to it.
 *
 * The quote builder never submits anything: it composes a WhatsApp message. So what a
 * visitor relies on is the link it ends in, which is what these specs read back.
 */

import { test, expect, type Page } from "./fixtures";
import { SAMPLE_PRODUCT_SLUG } from "./pages";

const sendLink = (page: Page) => page.getByRole("link", { name: "Enviar por WhatsApp" });

async function sentMessage(page: Page): Promise<string> {
  const href = await sendLink(page).getAttribute("href");
  expect(href).toMatch(/^https:\/\/wa\.me\/5491126949628\?text=/);
  return new URL(href!).searchParams.get("text")!;
}

test("the page introduces the alliance and both discounts", async ({ page }) => {
  await page.goto("/insurance");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Asegurá tu embarcación");
  await expect(page.getByRole("img", { name: /Parrado & Asociados/ }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /Autos/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Hogar/ })).toBeVisible();
  await expect(page.getByText("Descuento en el seguro de autos de hasta 5 años de antigüedad.")).toBeVisible();
});

test("the quote starts with the boat and sends it by WhatsApp", async ({ page }) => {
  await page.goto("/insurance#consulta");

  await expect(page.getByRole("checkbox", { name: /Embarcación/ })).toBeChecked();
  await page.getByRole("textbox", { name: "¿Qué embarcación?" }).fill("Velero Grumete 24");

  expect(await sentMessage(page)).toBe(
    "Hola! Quiero cotizar un seguro con Parrado Seguros.\n• Embarcación: Velero Grumete 24",
  );
});

test("a recent car is told it gets the discount", async ({ page }) => {
  await page.goto("/insurance#consulta");
  const recent = String(new Date().getFullYear() - 1);

  await page.getByRole("checkbox", { name: /Auto/ }).check();
  await page.getByRole("textbox", { name: "Año del auto" }).fill(recent);

  await expect(page.locator("#pq-car-status")).toHaveText("Entra en el descuento del 30%.");
  expect(await sentMessage(page)).toContain(`• Auto, año ${recent} (descuento del 30%)`);
});

test("an older car is quoted without the discount", async ({ page }) => {
  await page.goto("/insurance#consulta");
  const old = String(new Date().getFullYear() - 10);

  await page.getByRole("checkbox", { name: /Auto/ }).check();
  await page.getByRole("textbox", { name: "Año del auto" }).fill(old);

  await expect(page.locator("#pq-car-status")).toContainText("el descuento no aplica");
  const message = await sentMessage(page);
  expect(message).toContain(`• Auto, año ${old}`);
  expect(message).not.toContain("descuento");
});

test("home insurance can be added and the boat left out", async ({ page }) => {
  await page.goto("/insurance#consulta");

  await page.getByRole("checkbox", { name: /Embarcación/ }).uncheck();
  await page.getByRole("checkbox", { name: /Hogar/ }).check();

  await expect(page.getByRole("textbox", { name: "¿Qué embarcación?" })).toHaveCount(0);
  expect(await sentMessage(page)).toBe(
    "Hola! Quiero cotizar un seguro con Parrado Seguros.\n• Hogar (descuento del 20%)",
  );
});

test("a product page sends its boat into the quote", async ({ page }) => {
  await page.goto(`/product-page/${SAMPLE_PRODUCT_SLUG}`);
  const boatName = (await page.getByRole("heading", { level: 1 }).textContent())!.trim();

  await page.getByRole("link", { name: "Cotizar el seguro" }).click();

  await page.waitForURL("**/insurance?embarcacion=*");
  await expect(page.getByRole("textbox", { name: "¿Qué embarcación?" })).toHaveValue(boatName);
  expect(await sentMessage(page)).toContain(`• Embarcación: ${boatName}`);
});

test("the alliance band on the services page leads to the page", async ({ page }) => {
  await page.goto("/services");

  await page.locator(".pa-band").getByRole("link", { name: "Ver los beneficios" }).click();

  await page.waitForURL("**/insurance");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Asegurá tu embarcación");
});

test("the home only mentions the insurer, under the services", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".pa-band")).toHaveCount(0);
  await page.locator(".pa-mention").getByRole("link", { name: "Ver beneficios" }).click();

  await page.waitForURL("**/insurance");
});

test("the footer shows the insurer and links to the page", async ({ page }) => {
  await page.goto("/contact");

  await page.locator(".site-footer").getByRole("link", { name: /Aseguradora aliada/ }).click();

  await page.waitForURL("**/insurance");
});
