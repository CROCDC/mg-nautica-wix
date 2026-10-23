/**
 * E2E: subscribing to the newsletter and following boat models.
 *
 * The form's success text is the least interesting assertion here. What matters is
 * what reached Wix — a contact carrying the "Newsletter" label plus one label per
 * model, and an email subscription set to SUBSCRIBED — because that is what the owner
 * segments a campaign by. The mock fakes those CRM writes and logs them (see
 * fakeCrmWrite in mock/wix-http-mock.mjs), so each test reads back what was sent.
 *
 * Boats are picked in a single predictive field: type, and it suggests models from the
 * list (sail and motor together); Enter or a click adds one as a tag, as many as wanted.
 */

import { test, expect, type Page } from "./fixtures";
import { readWixWrites, uniqueEmail } from "./helpers/wix-writes";

const field = (page: Page) => page.getByRole("combobox", { name: "Embarcaciones que buscás" });
const options = (page: Page) => page.getByRole("option");
const tags = (page: Page) => page.locator(".nl-tag-name");
const email = (page: Page) => page.getByLabel("Tu email");
const submit = (page: Page) => page.getByRole("button", { name: "Activar alertas" }).click();

// By class rather than role: Next's route announcer is also a role="alert" in the page.
const done = (page: Page) => page.locator(".nl-done");
const failure = (page: Page) => page.locator(".alert-error");

/** Type part of a name and take the first suggestion. */
async function addBoat(page: Page, typed: string) {
  await field(page).fill(typed);
  await field(page).press("Enter");
}

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

test("visitor adds several boats and subscribes", async ({ page }) => {
  const address = uniqueEmail();
  await page.goto("/newsletter");

  await addBoat(page, "colib");
  await addBoat(page, "brie");
  await addBoat(page, "trento"); // a motor model, from the same field
  await expect(tags(page)).toHaveText(["Colibrí", "Bries", "Trento"]);
  await email(page).fill(address);
  await submit(page);

  await expect(done(page)).toContainText("Tus alertas están activas");
  await expect(done(page)).toContainText("apenas ingrese un Colibrí, Bries o Trento");
  await expect(done(page)).toBeFocused();

  expect(contactWrite(address)?.body).toMatchObject({
    info: {
      emails: { items: [{ email: address, tag: "MAIN" }] },
      labelKeys: {
        items: [
          "custom.newsletter",
          "custom.modelo-colibri",
          "custom.modelo-bries",
          "custom.modelo-trento",
        ],
      },
    },
  });
  expect(subscriptionWrite(address)?.body).toEqual({
    subscription: { email: address, subscriptionStatus: "SUBSCRIBED" },
  });
});

test("subscribing without picking boats still subscribes", async ({ page }) => {
  const address = uniqueEmail();
  await page.goto("/newsletter");

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

  await addBoat(page, "plena");
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
});

// ----- The predictive field --------------------------------------------------------

test("nothing is suggested until the visitor types", async ({ page }) => {
  await page.goto("/newsletter");

  await field(page).focus();

  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(field(page)).toHaveAttribute("aria-expanded", "false");
});

test("suggestions follow what is typed, accents optional, sail and motor together", async ({
  page,
}) => {
  await page.goto("/newsletter");

  await field(page).fill("ma");

  await expect(field(page)).toHaveAttribute("aria-expanded", "true");
  // Names that start with the text first; Mamba and Marine Sur are motor, Maxi is sail.
  await expect(options(page).first()).toHaveText("Mamba");
  await expect(options(page)).toContainText(["Mamba", "Marine Sur", "Mastracchio", "Maxi"]);

  await field(page).fill("colibri");
  await expect(options(page)).toHaveText(["Colibrí"]);
});

test("arrow keys move the highlight and Enter adds that one", async ({ page }) => {
  await page.goto("/newsletter");

  await field(page).fill("ma");
  await expect(options(page).nth(0)).toHaveAttribute("aria-selected", "true");
  await field(page).press("ArrowDown");
  await expect(options(page).nth(1)).toHaveAttribute("aria-selected", "true");
  await field(page).press("Enter");

  await expect(tags(page)).toHaveText(["Marine Sur"]);
  // The field clears and stays focused, ready for the next boat.
  await expect(field(page)).toHaveValue("");
  await expect(field(page)).toBeFocused();
});

test("clicking a suggestion adds it", async ({ page }) => {
  await page.goto("/newsletter");

  await field(page).fill("pan");
  await options(page).filter({ hasText: "Pandora" }).click();

  await expect(tags(page)).toHaveText(["Pandora"]);
});

test("a boat already added is not suggested again", async ({ page }) => {
  await page.goto("/newsletter");

  await addBoat(page, "limbo");
  await field(page).fill("limbo");

  await expect(options(page)).toHaveText(["No está en la lista"]);
});

test("Escape closes the suggestions without adding anything", async ({ page }) => {
  await page.goto("/newsletter");

  await field(page).fill("col");
  await field(page).press("Escape");

  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(tags(page)).toHaveCount(0);
});

test("Enter in the field never submits the form", async ({ page }) => {
  await page.goto("/newsletter");

  await email(page).fill(uniqueEmail());
  await field(page).fill("zzz");
  await field(page).press("Enter");

  await expect(done(page)).toHaveCount(0);
  await expect(failure(page)).toHaveCount(0);
  await expect(tags(page)).toHaveCount(0);
});

test("a boat can be removed with its ✕ or with Backspace", async ({ page }) => {
  await page.goto("/newsletter");

  await addBoat(page, "colib");
  await addBoat(page, "brie");
  await page.getByRole("button", { name: "Quitar Colibrí" }).click();
  await expect(tags(page)).toHaveText(["Bries"]);

  await field(page).press("Backspace");
  await expect(tags(page)).toHaveCount(0);
});

test("a model in the URL arrives already added; junk is ignored", async ({ page }) => {
  await page.goto("/newsletter?modelo=plenamar&modelo=no-existe");

  await expect(tags(page)).toHaveText(["Plenamar"]);
});

// ----- Failures keep what the visitor entered ------------------------------------

test("an address the browser accepts but the server rejects keeps the form", async ({ page }) => {
  // `type="email"` lets "a@b" through, so this is the server-side rule speaking —
  // and React resets a form after an action, which must not drop the boats.
  await page.goto("/newsletter");

  await addBoat(page, "limbo");
  await email(page).fill("nombre@dominio");
  await submit(page);

  await expect(failure(page)).toContainText("no parece válido");
  await expect(email(page)).toHaveValue("nombre@dominio");
  await expect(tags(page)).toHaveText(["Limbo"]);
});

test("Wix failing shows a retry message and keeps the boats", async ({ page }) => {
  // The mock answers "falla-…" with a 500.
  const address = uniqueEmail("falla");
  await page.goto("/newsletter");

  await addBoat(page, "brie");
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

test("the home promo opens the form", async ({ page }) => {
  await page.goto("/");

  await page.locator(".nl-promo").getByRole("link", { name: "Crear mi alerta" }).click();

  await page.waitForURL(/\/newsletter$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Alertas por modelo");
  await expect(field(page)).toBeVisible();
});

// ----- Phone ------------------------------------------------------------------------

test.describe("on a 375px phone", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("the field, its suggestions and the button fit the screen", async ({ page }) => {
    await page.goto("/newsletter");

    await addBoat(page, "brie");
    await addBoat(page, "limbo");
    await field(page).fill("s");

    for (const target of [
      field(page),
      page.getByRole("listbox"),
      email(page),
      page.getByRole("button", { name: "Activar alertas" }),
    ]) {
      const box = await target.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(376);
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });

  test("the confirmation is in view after subscribing", async ({ page }) => {
    await page.goto("/newsletter");

    await addBoat(page, "colib");
    await email(page).fill(uniqueEmail());
    await submit(page);

    await expect(done(page)).toBeInViewport();
  });
});
