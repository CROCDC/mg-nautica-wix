/**
 * E2E: subscribing to the newsletter and following boat models.
 *
 * The form's success text is the least interesting assertion here. What matters is
 * what reached Wix — a contact carrying the "Newsletter" label plus one label per
 * model, and an email subscription set to SUBSCRIBED — because that is what the owner
 * segments a campaign by. The mock fakes those CRM writes and logs them (see
 * fakeCrmWrite in mock/wix-http-mock.mjs), so each test reads back what was sent.
 *
 * Three controls pick a model — the suggested/search chips, the full checkbox list and
 * the remove buttons on the tags — and they all drive the same state. The checkboxes
 * are what submits, even while their list is folded away, so the flows below pick
 * through the chips and assert on what Wix received.
 */

import { test, expect, type Page } from "./fixtures";
import { readWixWrites, uniqueEmail } from "./helpers/wix-writes";

const chip = (page: Page, label: string) =>
  page.locator(".nl-chip").filter({ hasText: new RegExp(`^${label}$`) });
const tags = (page: Page) => page.locator(".nl-tag-name");
const search = (page: Page) => page.getByLabel("Buscar modelo");
const email = (page: Page) => page.getByLabel("Tu email");
const submit = (page: Page) => page.getByRole("button", { name: "Activar alertas" }).click();

// By class rather than role: Next's route announcer is also a role="alert" in the page.
const done = (page: Page) => page.locator(".nl-done");
const failure = (page: Page) => page.locator(".alert-error");

/** The createContact request the app sent for this address, if any. */
function contactWrite(address: string) {
  return readWixWrites().find(
    (w) =>
      w.path.endsWith("/contacts/v4/contacts") &&
      JSON.stringify(w.body).includes(`"email":"${address}"`),
  );
}

function subscriptionWrite(address: string) {
  return readWixWrites().find(
    (w) =>
      w.path.endsWith("/email-subscriptions") &&
      JSON.stringify(w.body).includes(`"email":"${address}"`),
  );
}

// ----- The happy path -----------------------------------------------------------

test("visitor follows two suggested models and subscribes", async ({ page }) => {
  const address = uniqueEmail();
  await page.goto("/newsletter");

  await chip(page, "Colibrí").click();
  await chip(page, "Bries").click();
  await expect(chip(page, "Colibrí")).toHaveAttribute("aria-pressed", "true");
  // Tags follow the list order — the order the form submits in.
  await expect(tags(page)).toHaveText(["Bries", "Colibrí"]);
  await email(page).fill(address);
  await submit(page);

  await expect(done(page)).toContainText("Tus alertas están activas");
  await expect(done(page)).toContainText("apenas ingrese un Bries o Colibrí");
  await expect(done(page)).toBeFocused();

  expect(contactWrite(address)?.body).toMatchObject({
    info: {
      emails: { items: [{ email: address, tag: "MAIN" }] },
      labelKeys: { items: ["custom.newsletter", "custom.modelo-bries", "custom.modelo-colibri"] },
    },
  });
  expect(subscriptionWrite(address)?.body).toEqual({
    subscription: { email: address, subscriptionStatus: "SUBSCRIBED" },
  });
});

test("subscribing without picking models still subscribes", async ({ page }) => {
  const address = uniqueEmail();
  await page.goto("/newsletter");

  await expect(page.getByText("Todavía no elegiste modelos.")).toBeVisible();
  await email(page).fill(address);
  await submit(page);

  await expect(done(page)).toContainText("novedades del catálogo");
  expect(contactWrite(address)?.body).toMatchObject({
    info: { labelKeys: { items: ["custom.newsletter"] } },
  });
  expect(subscriptionWrite(address)).toBeTruthy();
});

test("an email already in the CRM gets the new models added", async ({ page }) => {
  // The mock answers "existente-…" with Wix's 409 DUPLICATE_CONTACT_EXISTS.
  const address = uniqueEmail("existente");
  await page.goto("/newsletter");

  await chip(page, "Plenamar").click();
  await email(page).fill(address);
  await submit(page);

  await expect(done(page)).toContainText("apenas ingrese un Plenamar");

  const create = contactWrite(address);
  expect(create?.status).toBe(409);
  const existingId = (
    create?.response as { details: { applicationError: { data: { duplicateContactId: string } } } }
  ).details.applicationError.data.duplicateContactId;
  // The labels go onto the contact Wix pointed at, not onto a second one.
  const labelled = readWixWrites().find((w) => w.path.endsWith(`/contacts/${existingId}/labels`));
  expect(labelled?.body).toMatchObject({
    labelKeys: ["custom.newsletter", "custom.modelo-plenamar"],
  });
  expect(subscriptionWrite(address)).toBeTruthy();
});

// ----- Finding a model ------------------------------------------------------------

test("search swaps the suggestions for matches, accents optional", async ({ page }) => {
  await page.goto("/newsletter");
  await expect(page.locator(".nl-options .nl-label")).toHaveText("Sugeridos");

  await search(page).fill("chaparron");

  await expect(page.locator(".nl-options .nl-label")).toHaveText("Resultados");
  await expect(page.locator(".nl-chip")).toHaveText(["Chaparrón"]);
});

test("Enter on a single match picks it and clears the search", async ({ page }) => {
  await page.goto("/newsletter");

  await search(page).fill("colibri");
  await search(page).press("Enter");

  await expect(tags(page)).toHaveText(["Colibrí"]);
  await expect(search(page)).toHaveValue("");
  // Enter never submits the form from the search box.
  await expect(done(page)).toHaveCount(0);
  await expect(failure(page)).toHaveCount(0);
});

test("Enter with several matches does nothing but stay in the search", async ({ page }) => {
  await page.goto("/newsletter");

  await search(page).fill("pa");
  await search(page).press("Enter");

  await expect(search(page)).toHaveValue("pa");
  await expect(page.getByText("Todavía no elegiste modelos.")).toBeVisible();
});

test("a search with no match says so", async ({ page }) => {
  await page.goto("/newsletter");

  await search(page).fill("zzz");

  await expect(page.getByText("No encontramos ese modelo.")).toBeVisible();
});

test("the full list reaches a model that is not suggested", async ({ page }) => {
  const address = uniqueEmail();
  await page.goto("/newsletter");

  await page.getByText(/Ver los \d+ modelos/).click();
  await page.getByRole("checkbox", { name: "Trento" }).check();
  await expect(tags(page)).toHaveText(["Trento"]);
  await email(page).fill(address);
  await submit(page);

  await expect(done(page)).toContainText("apenas ingrese un Trento");
  expect(JSON.stringify(contactWrite(address)?.body)).toContain("custom.modelo-trento");
});

test("removing a tag unpicks the model everywhere", async ({ page }) => {
  await page.goto("/newsletter");

  await chip(page, "Limbo").click();
  await page.getByRole("button", { name: "Quitar Limbo" }).click();

  await expect(tags(page)).toHaveCount(0);
  await expect(chip(page, "Limbo")).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("checkbox", { name: "Limbo", includeHidden: true })).not.toBeChecked();
});

test("a model in the URL arrives already picked; junk is ignored", async ({ page }) => {
  await page.goto("/newsletter?modelo=plenamar&modelo=no-existe");

  await expect(tags(page)).toHaveText(["Plenamar"]);
  await expect(chip(page, "Plenamar")).toHaveAttribute("aria-pressed", "true");
});

// ----- Failures keep what the visitor entered ------------------------------------

test("an address the browser accepts but the server rejects keeps the form", async ({ page }) => {
  // `type="email"` lets "a@b" through, so this is the server-side rule speaking —
  // and React resets a form after an action, which must not wipe the picks.
  await page.goto("/newsletter");

  await chip(page, "Limbo").click();
  await email(page).fill("nombre@dominio");
  await submit(page);

  await expect(failure(page)).toContainText("no parece válido");
  await expect(email(page)).toHaveValue("nombre@dominio");
  await expect(tags(page)).toHaveText(["Limbo"]);
});

test("Wix failing shows a retry message and keeps the picks", async ({ page }) => {
  // The mock answers "falla-…" with a 500.
  const address = uniqueEmail("falla");
  await page.goto("/newsletter");

  await chip(page, "Bries").click();
  await email(page).fill(address);
  await submit(page);

  await expect(failure(page)).toContainText("Probá de nuevo");
  await expect(email(page)).toHaveValue(address);
  await expect(tags(page)).toHaveText(["Bries"]);
  expect(subscriptionWrite(address)).toBeUndefined();
});

// ----- Bots -----------------------------------------------------------------------

test("a filled honeypot looks like success and never reaches Wix", async ({ page }) => {
  const address = uniqueEmail();
  await page.goto("/newsletter");

  await email(page).fill(address);
  await page.locator('input[name="website"]').fill("https://spam.example");
  await submit(page);

  await expect(done(page)).toContainText("Tus alertas están activas");
  expect(contactWrite(address)).toBeUndefined();
  expect(subscriptionWrite(address)).toBeUndefined();
});

// ----- Ways in --------------------------------------------------------------------

test("a model on the home promo opens the form with it picked", async ({ page }) => {
  await page.goto("/");

  await page.locator(".nl-promo").getByRole("link", { name: "Plenamar" }).click();

  await page.waitForURL("**/newsletter?modelo=plenamar");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Alertas por modelo");
  await expect(tags(page)).toHaveText(["Plenamar"]);
});

test("the home promo button opens an empty form", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Crear mi alerta" }).click();

  await page.waitForURL(/\/newsletter$/);
  await expect(page.getByText("Todavía no elegiste modelos.")).toBeVisible();
});

// ----- Phone ------------------------------------------------------------------------

test.describe("on a 375px phone", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("chips, email and button all fit the screen", async ({ page }) => {
    await page.goto("/newsletter");

    await chip(page, "Colibrí").click();
    await expect(tags(page)).toHaveText(["Colibrí"]);

    for (const target of [email(page), page.getByRole("button", { name: "Activar alertas" })]) {
      const box = await target.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(376);
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });

  test("the confirmation scrolls into view after subscribing", async ({ page }) => {
    await page.goto("/newsletter");

    await chip(page, "Colibrí").click();
    await email(page).fill(uniqueEmail());
    await submit(page);

    await expect(done(page)).toBeInViewport();
  });
});
