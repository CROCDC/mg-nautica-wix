/**
 * E2E: subscribing to the newsletter and following boat models.
 *
 * The form's success text is the least interesting assertion here. What matters is
 * what reached Wix — a contact carrying the "Newsletter" label plus one label per
 * model, and an email subscription set to SUBSCRIBED — because that is what the owner
 * segments a campaign by. The mock fakes those CRM writes and logs them (see
 * fakeCrmWrite in mock/wix-http-mock.mjs), so each test reads back what was sent.
 */

import { test, expect, type Page } from "./fixtures";
import { readWixWrites, uniqueEmail } from "./helpers/wix-writes";

const chip = (page: Page, label: string) =>
  page.locator(".model-chip").filter({ hasText: new RegExp(`^${label}$`) });

const submit = (page: Page) => page.getByRole("button", { name: "Suscribirme" }).click();

// By class rather than role: Next's route announcer is also a role="alert" in the page.
const done = (page: Page) => page.locator(".newsletter-done");
const failure = (page: Page) => page.locator(".alert-error");

/** The createContact request the app sent for this address, if any. */
function contactWrite(email: string) {
  return readWixWrites().find(
    (w) =>
      w.path.endsWith("/contacts/v4/contacts") &&
      JSON.stringify(w.body).includes(`"email":"${email}"`),
  );
}

function subscriptionWrite(email: string) {
  return readWixWrites().find(
    (w) =>
      w.path.endsWith("/email-subscriptions") &&
      JSON.stringify(w.body).includes(`"email":"${email}"`),
  );
}

// ----- The happy path -----------------------------------------------------------

test("visitor subscribes following two models", async ({ page }) => {
  const email = uniqueEmail();
  await page.goto("/newsletter");

  await page.getByLabel("Tu email").fill(email);
  await chip(page, "Colibrí").click();
  await chip(page, "Bries").click();
  await expect(page.getByText("2 modelos elegidos.")).toBeVisible();
  await submit(page);

  await expect(done(page)).toContainText("ya estás suscripto");
  // The form posts the chips in list order, not in the order they were tapped.
  await expect(done(page)).toContainText("cuando ingrese un Bries o Colibrí");

  const contact = contactWrite(email);
  expect(contact?.body).toMatchObject({
    info: {
      emails: { items: [{ email, tag: "MAIN" }] },
      labelKeys: { items: ["custom.newsletter", "custom.modelo-bries", "custom.modelo-colibri"] },
    },
  });
  expect(subscriptionWrite(email)?.body).toEqual({
    subscription: { email, subscriptionStatus: "SUBSCRIBED" },
  });
});

test("subscribing without picking models still subscribes", async ({ page }) => {
  const email = uniqueEmail();
  await page.goto("/newsletter");

  await expect(page.getByText("Sin elegir modelos recibís todas las novedades.")).toBeVisible();
  await page.getByLabel("Tu email").fill(email);
  await submit(page);

  await expect(done(page)).toContainText("novedades del catálogo");
  expect(contactWrite(email)?.body).toMatchObject({
    info: { labelKeys: { items: ["custom.newsletter"] } },
  });
  expect(subscriptionWrite(email)).toBeTruthy();
});

test("an email already in the CRM gets the new models added", async ({ page }) => {
  // The mock answers "existente-…" with Wix's 409 DUPLICATE_CONTACT_EXISTS.
  const email = uniqueEmail("existente");
  await page.goto("/newsletter");

  await page.getByLabel("Tu email").fill(email);
  await chip(page, "Plenamar").click();
  await submit(page);

  await expect(done(page)).toContainText("cuando ingrese un Plenamar");

  const create = contactWrite(email);
  expect(create?.status).toBe(409);
  const existingId = (
    create?.response as { details: { applicationError: { data: { duplicateContactId: string } } } }
  ).details.applicationError.data.duplicateContactId;
  // The labels go onto the contact Wix pointed at, not onto a second one.
  const labelled = readWixWrites().find((w) => w.path.endsWith(`/contacts/${existingId}/labels`));
  expect(labelled?.body).toMatchObject({
    labelKeys: ["custom.newsletter", "custom.modelo-plenamar"],
  });
  expect(subscriptionWrite(email)).toBeTruthy();
});

// ----- The model search ---------------------------------------------------------

test("search narrows the chips, accents optional", async ({ page }) => {
  await page.goto("/newsletter");

  await page.getByLabel("Buscar modelo").fill("colibri");

  await expect(page.locator(".model-chip:visible")).toHaveCount(1);
  await expect(chip(page, "Colibrí")).toBeVisible();
  // The "A motor" group has nothing to show, so its heading goes too.
  await expect(page.getByRole("heading", { name: "A motor" })).toBeHidden();
});

test("a model hidden by the search is still submitted", async ({ page }) => {
  // The chips are hidden, not unmounted, precisely so this keeps working.
  const email = uniqueEmail();
  await page.goto("/newsletter");

  await page.getByLabel("Tu email").fill(email);
  await chip(page, "Colibrí").click();
  await page.getByLabel("Buscar modelo").fill("limbo");
  await expect(chip(page, "Colibrí")).toBeHidden();
  await submit(page);

  await expect(done(page)).toContainText("Colibrí");
  expect(JSON.stringify(contactWrite(email)?.body)).toContain("custom.modelo-colibri");
});

test("Enter in the search box searches instead of subscribing", async ({ page }) => {
  await page.goto("/newsletter");

  await page.getByLabel("Tu email").fill(uniqueEmail());
  await page.getByLabel("Buscar modelo").fill("limbo");
  await page.getByLabel("Buscar modelo").press("Enter");

  await expect(page.getByRole("button", { name: "Suscribirme" })).toBeVisible();
  await expect(done(page)).toHaveCount(0);
});

test("a search with no match says so", async ({ page }) => {
  await page.goto("/newsletter");

  await page.getByLabel("Buscar modelo").fill("zzz");

  await expect(page.getByText("No tenemos ese modelo en la lista.")).toBeVisible();
});

// ----- Failures keep what the visitor entered ------------------------------------

test("an address the browser accepts but the server rejects keeps the form", async ({ page }) => {
  // `type="email"` lets "a@b" through, so this is the server-side rule speaking —
  // and React resets a form after an action, which must not wipe the picks.
  await page.goto("/newsletter");

  await page.getByLabel("Tu email").fill("nombre@dominio");
  await chip(page, "Limbo").click();
  await submit(page);

  await expect(failure(page)).toContainText("no parece válido");
  await expect(page.getByLabel("Tu email")).toHaveValue("nombre@dominio");
  await expect(chip(page, "Limbo").locator("input")).toBeChecked();
});

test("Wix failing shows a retry message and keeps the picks", async ({ page }) => {
  // The mock answers "falla-…" with a 500.
  const email = uniqueEmail("falla");
  await page.goto("/newsletter");

  await page.getByLabel("Tu email").fill(email);
  await chip(page, "Bries").click();
  await submit(page);

  await expect(failure(page)).toContainText("Probá de nuevo");
  await expect(page.getByLabel("Tu email")).toHaveValue(email);
  await expect(chip(page, "Bries").locator("input")).toBeChecked();
  expect(subscriptionWrite(email)).toBeUndefined();
});

// ----- Bots -----------------------------------------------------------------------

test("a filled honeypot looks like success and never reaches Wix", async ({ page }) => {
  const email = uniqueEmail();
  await page.goto("/newsletter");

  await page.getByLabel("Tu email").fill(email);
  await page.locator('input[name="website"]').fill("https://spam.example");
  await submit(page);

  await expect(done(page)).toContainText("ya estás suscripto");
  expect(contactWrite(email)).toBeUndefined();
  expect(subscriptionWrite(email)).toBeUndefined();
});

// ----- Ways in --------------------------------------------------------------------

test("the home page leads to the newsletter", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Suscribirme al newsletter" }).click();

  await page.waitForURL("**/newsletter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Newsletter");
});

// ----- Phone ------------------------------------------------------------------------

test.describe("on a 375px phone", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("the chips wrap inside the screen and can be tapped", async ({ page }) => {
    await page.goto("/newsletter");

    await chip(page, "Colibrí").click();

    await expect(chip(page, "Colibrí").locator("input")).toBeChecked();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
});
