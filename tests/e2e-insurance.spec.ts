/**
 * E2E: the Parrado Seguros alliance — the /insurance page, its quote panels and the
 * places across the site that lead to it.
 *
 * The quote never submits anything: it composes a WhatsApp message. So what a visitor
 * relies on is the link it ends in, which is what these specs read back.
 */

import { test, expect, type Page } from "./fixtures";
import { SAMPLE_PRODUCT_SLUG } from "./pages";

const sendLink = (page: Page) => page.getByRole("link", { name: "Enviar por WhatsApp" });
const panel = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

async function sentMessage(page: Page): Promise<string> {
  const href = await sendLink(page).getAttribute("href");
  expect(href).toMatch(/^https:\/\/wa\.me\/5491126949628\?text=/);
  return new URL(href!).searchParams.get("text")!;
}

test("the page introduces the alliance and both discounts", async ({ page }) => {
  await page.goto("/insurance");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tu embarcación, siempre protegida");
  await expect(page.locator(".ps-hero").getByRole("img", { name: /Parrado & Asociados/ })).toBeVisible();
  const figures = page.locator(".ps-figures");
  await expect(figures).toContainText("30%");
  await expect(figures).toContainText("si tiene hasta 5 años");
  await expect(figures).toContainText("20%");
});

test("the quote starts with the boat and sends it by WhatsApp", async ({ page }) => {
  await page.goto("/insurance#consulta");

  await expect(panel(page, "Embarcación (en tu consulta)")).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("textbox", { name: "¿Qué embarcación?" }).fill("Velero Grumete 24");

  expect(await sentMessage(page)).toBe(
    "Hola! Quiero cotizar un seguro con Parrado Seguros.\n• Embarcación: Velero Grumete 24",
  );
});

test("opening a panel shows its offer and leaves the others closed", async ({ page }) => {
  await page.goto("/insurance#consulta");

  await panel(page, "Hogar").click();

  await expect(panel(page, "Hogar")).toHaveAttribute("aria-expanded", "true");
  await expect(panel(page, "Embarcación (en tu consulta)")).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByText("20% de descuento en el seguro de tu casa.")).toBeVisible();
});

test("a recent car is told it gets the discount", async ({ page }) => {
  await page.goto("/insurance#consulta");
  const recent = String(new Date().getFullYear() - 1);

  await panel(page, "Auto").click();
  await page.getByRole("button", { name: "Sumar a la consulta" }).click();
  await page.getByRole("textbox", { name: "Año del auto" }).fill(recent);

  await expect(page.locator("#ps-car-status")).toHaveText("Entra en el descuento del 30%.");
  expect(await sentMessage(page)).toContain(`• Auto, año ${recent} (descuento del 30%)`);
});

test("an older car is quoted without the discount", async ({ page }) => {
  await page.goto("/insurance#consulta");
  const old = String(new Date().getFullYear() - 10);

  await panel(page, "Auto").click();
  await page.getByRole("button", { name: "Sumar a la consulta" }).click();
  await page.getByRole("textbox", { name: "Año del auto" }).fill(old);

  await expect(page.locator("#ps-car-status")).toContainText("el descuento no aplica");
  const message = await sentMessage(page);
  expect(message).toContain(`• Auto, año ${old}`);
  expect(message).not.toContain("descuento");
});

test("the boat can be taken out and home insurance added", async ({ page }) => {
  await page.goto("/insurance#consulta");

  await page.getByRole("button", { name: "En tu consulta", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "¿Qué embarcación?" })).toHaveCount(0);
  await panel(page, "Hogar").click();
  await page.getByRole("button", { name: "Sumar a la consulta" }).click();

  await expect(panel(page, "Hogar (en tu consulta)")).toBeVisible();
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

test("the services section leads to the page", async ({ page }) => {
  await page.goto("/services");

  await page.locator("#seguros").getByRole("link", { name: "Conocé la alianza" }).click();

  await page.waitForURL("**/insurance");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tu embarcación, siempre protegida");
});

test("the home only mentions the insurer, under the services", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#seguros")).toHaveCount(0);
  await page.locator(".ps-mention").getByRole("link", { name: "Conocé la alianza" }).click();

  await page.waitForURL("**/insurance");
});

test("the footer shows the insurer and links to the page", async ({ page }) => {
  await page.goto("/contact");

  await page.locator(".site-footer").getByRole("link", { name: /Aseguradora aliada/ }).click();

  await page.waitForURL("**/insurance");
});
