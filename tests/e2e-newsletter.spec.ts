/**
 * E2E: subscribing to the newsletter and following boat models.
 *
 * The form's success text is the least interesting assertion here. What matters is
 * what reached Wix — a contact carrying the "Newsletter" and channel labels plus one
 * label per model, with a WhatsApp number in E.164 or an email subscribed to marketing —
 * because that is what the owner filters by to send an alert. The mock fakes those CRM
 * writes and logs them (see fakeCrmWrite in mock/wix-http-mock.mjs), so each test reads
 * back what was sent.
 *
 * Boats are picked in a single predictive field: type, and it suggests models from the
 * list (sail and motor together); Enter or a click adds one as a tag, as many as wanted.
 * The alert goes by WhatsApp (the default) or by email.
 */

import { test, expect, type Page } from "./fixtures";
import { readWixWrites, uniqueEmail, uniquePhone } from "./helpers/wix-writes";

const field = (page: Page) => page.getByRole("combobox", { name: "Embarcaciones que buscás" });
// Scoped to the suggestions: the country prefix <select> has options of its own.
const options = (page: Page) => page.getByRole("listbox").getByRole("option");
const tags = (page: Page) => page.locator(".nl-tag-name");
const phone = (page: Page) => page.getByLabel("Tu número de WhatsApp");
const prefix = (page: Page) => page.getByLabel("Código de país");
const email = (page: Page) => page.getByLabel("Tu email");
const channel = (page: Page, name: "WhatsApp" | "Email") => page.getByRole("radio", { name });
const submit = (page: Page) => page.getByRole("button", { name: "Activar alertas" }).click();

// By class rather than role: Next's route announcer is also a role="alert" in the page.
const done = (page: Page) => page.locator(".nl-done");
const failure = (page: Page) => page.locator(".alert-error");

/** Type part of a name and take the first suggestion. */
async function addBoat(page: Page, typed: string) {
  await field(page).fill(typed);
  await field(page).press("Enter");
}

async function useEmail(page: Page, address: string) {
  await channel(page, "Email").check();
  await email(page).fill(address);
}

/** The latest createContact request carrying this email or phone, if any. */
function contactWrite(contact: string) {
  return readWixWrites()
    .filter(
      (w) =>
        w.path.endsWith("/contacts/v4/contacts") &&
        JSON.stringify(w.body).includes(`"${contact}"`),
    )
    .at(-1);
}

function subscriptionWrite(address: string) {
  return readWixWrites().find(
    (w) =>
      w.path.endsWith("/email-subscriptions") &&
      JSON.stringify(w.body).includes(`"email":"${address}"`),
  );
}

// ----- WhatsApp (the default) -------------------------------------------------------

test("visitor adds several boats and subscribes by WhatsApp", async ({ page }) => {
  const number = uniquePhone();
  await page.goto("/newsletter");

  await expect(channel(page, "WhatsApp")).toBeChecked();
  await addBoat(page, "colib");
  await addBoat(page, "brie");
  await addBoat(page, "trento"); // a motor model, from the same field
  await expect(tags(page)).toHaveText(["Colibrí", "Bries", "Trento"]);
  // Typed the way people write their own mobile: no 9, no 15.
  await phone(page).fill(number.typed);
  await submit(page);

  await expect(done(page)).toContainText("Tus alertas están activas");
  await expect(done(page)).toContainText("por WhatsApp apenas ingrese un Colibrí, Bries o Trento");
  await expect(done(page)).toBeFocused();

  const create = contactWrite(number.e164);
  expect(create?.body).toEqual({
    info: {
      phones: { items: [{ phone: number.e164, countryCode: "AR", tag: "MOBILE", primary: true }] },
      labelKeys: {
        items: [
          "custom.newsletter",
          "custom.canal-whatsapp",
          "custom.modelo-colibri",
          "custom.modelo-bries",
          "custom.modelo-trento",
        ],
      },
    },
  });
});

test("the Uruguay prefix reaches Wix as a +598 number", async ({ page }) => {
  const digits = String(Math.floor(Math.random() * 1e6)).padStart(6, "0");
  await page.goto("/newsletter");

  await prefix(page).selectOption("UY");
  await expect(phone(page)).toHaveAttribute("placeholder", "99 123 456");
  await phone(page).fill(`099 ${digits}`);
  await submit(page);

  await expect(done(page)).toContainText("por WhatsApp");
  expect(contactWrite(`+59899${digits}`)?.body).toMatchObject({
    info: { phones: { items: [{ phone: `+59899${digits}`, countryCode: "UY" }] } },
  });
});

test("a number without area code is rejected and the form keeps everything", async ({ page }) => {
  await page.goto("/newsletter");

  await addBoat(page, "limbo");
  await phone(page).fill("15 2694 9628");
  await submit(page);

  await expect(failure(page)).toContainText("código de área");
  await expect(phone(page)).toHaveValue("15 2694 9628");
  await expect(tags(page)).toHaveText(["Limbo"]);
});

// ----- Email ------------------------------------------------------------------------

test("visitor subscribes by email instead", async ({ page }) => {
  const address = uniqueEmail();
  await page.goto("/newsletter");

  await addBoat(page, "plena");
  await useEmail(page, address);
  await submit(page);

  await expect(done(page)).toContainText("por email apenas ingrese un Plenamar");
  expect(contactWrite(address)?.body).toEqual({
    info: {
      emails: { items: [{ email: address, tag: "MAIN", primary: true }] },
      labelKeys: { items: ["custom.newsletter", "custom.canal-email", "custom.modelo-plenamar"] },
    },
  });
  // Email Marketing only mails contacts who opted in.
  expect(subscriptionWrite(address)?.body).toEqual({
    subscription: { email: address, subscriptionStatus: "SUBSCRIBED" },
  });
});

test("subscribing without picking boats still subscribes", async ({ page }) => {
  const address = uniqueEmail();
  await page.goto("/newsletter");

  await useEmail(page, address);
  await submit(page);

  await expect(done(page)).toContainText("novedades del catálogo");
  expect(contactWrite(address)?.body).toMatchObject({
    // Picking nothing is following everything.
    info: { labelKeys: { items: ["custom.newsletter", "custom.canal-email", "custom.modelo-todos"] } },
  });
});

test("an email already in the CRM gets the new models added", async ({ page }) => {
  // The mock answers "existente-…" with Wix's 409 DUPLICATE_CONTACT_EXISTS.
  const address = uniqueEmail("existente");
  await page.goto("/newsletter");

  await addBoat(page, "plena");
  await useEmail(page, address);
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
    labelKeys: ["custom.newsletter", "custom.canal-email", "custom.modelo-plenamar"],
  });
});

test("switching channel keeps what was typed in each", async ({ page }) => {
  await page.goto("/newsletter");

  await phone(page).fill("11 2694-9628");
  await useEmail(page, "nombre@ejemplo.com");
  await channel(page, "WhatsApp").check();
  await expect(phone(page)).toHaveValue("11 2694-9628");
  await channel(page, "Email").check();
  await expect(email(page)).toHaveValue("nombre@ejemplo.com");
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

  await phone(page).fill(uniquePhone().typed);
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
  await useEmail(page, "nombre@dominio");
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
  await useEmail(page, address);
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

  await useEmail(page, address);
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

  test("the field, its suggestions, the number and the button fit the screen", async ({
    page,
  }) => {
    await page.goto("/newsletter");

    await addBoat(page, "brie");
    await addBoat(page, "limbo");
    await field(page).fill("s");

    for (const target of [
      field(page),
      page.getByRole("listbox"),
      prefix(page),
      phone(page),
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
    await phone(page).fill(uniquePhone().typed);
    await submit(page);

    await expect(done(page)).toBeInViewport();
  });
});
