/**
 * Unit layer for the newsletter form rules — the gate in front of every Wix write.
 *
 * The browser's own checks are not the gate: `type="email"` accepts `a@b`, `type="tel"`
 * accepts anything, and a script never runs either. Whatever passes here becomes a CRM
 * contact — and a WhatsApp number that passes has to be one a chat can actually reach.
 */

import { test, expect } from "@playwright/test";
import { HONEYPOT_FIELD } from "@/lib/newsletter-form";
import { parseNewsletterForm } from "@/lib/newsletter-input";

function form(fields: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    for (const v of [value].flat()) fd.append(name, v);
  }
  return fd;
}

const email = (address: string, extra: Record<string, string | string[]> = {}) =>
  form({ channel: "email", email: address, ...extra });
const whatsapp = (phone: string, extra: Record<string, string | string[]> = {}) =>
  form({ channel: "whatsapp", country: "AR", phone, ...extra });

// ----- Email ----------------------------------------------------------------------

test("an email submission comes back normalised", () => {
  const parsed = parseNewsletterForm(email("  Nombre@Ejemplo.COM ", { models: ["colibri", "bries"] }));

  expect(parsed).toEqual({
    kind: "ok",
    input: {
      contact: { channel: "email", email: "nombre@ejemplo.com" },
      models: [
        { slug: "colibri", label: "Colibrí" },
        { slug: "bries", label: "Bries" },
      ],
    },
  });
});

test("a missing email asks for one", () => {
  expect(parseNewsletterForm(email("   "))).toEqual({ kind: "invalid", message: "Ingresá tu email." });
});

for (const bad of ["a@b", "a@b.", "a@.com", "sin-arroba.com", "a b@c.com", "a@b@c.com"]) {
  test(`"${bad}" is rejected`, () => {
    expect(parseNewsletterForm(email(bad))).toMatchObject({ kind: "invalid" });
  });
}

test("an address longer than RFC 5321 allows is rejected", () => {
  expect(parseNewsletterForm(email(`${"a".repeat(250)}@b.com`))).toMatchObject({ kind: "invalid" });
});

// ----- WhatsApp ---------------------------------------------------------------------

test("a WhatsApp submission is stored as E.164 with its country", () => {
  const parsed = parseNewsletterForm(whatsapp("11 2694-9628", { models: "plenamar" }));

  expect(parsed).toEqual({
    kind: "ok",
    input: {
      contact: { channel: "whatsapp", phone: "+5491126949628", country: "AR" },
      models: [{ slug: "plenamar", label: "Plenamar" }],
    },
  });
});

test("WhatsApp is the channel when none is sent", () => {
  const parsed = parseNewsletterForm(form({ phone: "11 2694-9628" }));
  expect(parsed).toMatchObject({ kind: "ok", input: { contact: { channel: "whatsapp" } } });
});

test("the Uruguay prefix applies to a local Uruguayan number", () => {
  const parsed = parseNewsletterForm(whatsapp("099 123 456", { country: "UY" }));
  expect(parsed).toMatchObject({
    kind: "ok",
    input: { contact: { phone: "+59899123456", country: "UY" } },
  });
});

test("an unknown prefix value falls back to Argentina", () => {
  const parsed = parseNewsletterForm(whatsapp("11 2694-9628", { country: "XX" }));
  expect(parsed).toMatchObject({ kind: "ok", input: { contact: { phone: "+5491126949628" } } });
});

test("a missing number asks for one", () => {
  expect(parseNewsletterForm(whatsapp("  "))).toEqual({
    kind: "invalid",
    message: "Ingresá tu número de WhatsApp.",
  });
});

test("a number without area code is rejected with a hint", () => {
  const parsed = parseNewsletterForm(whatsapp("15 2694 9628"));
  expect(parsed).toMatchObject({ kind: "invalid", message: expect.stringContaining("código de área") });
});

test("an absurdly long value is rejected before parsing", () => {
  expect(parseNewsletterForm(whatsapp("1".repeat(40)))).toMatchObject({ kind: "invalid" });
});

test("the email field is ignored on the WhatsApp channel, and vice versa", () => {
  // Both inputs never render together, but a crafted post can send both.
  expect(parseNewsletterForm(whatsapp("11 2694-9628", { email: "x@y.com" }))).toMatchObject({
    input: { contact: { channel: "whatsapp" } },
  });
  expect(parseNewsletterForm(email("x@y.com", { phone: "11 2694-9628" }))).toMatchObject({
    input: { contact: { channel: "email", email: "x@y.com" } },
  });
});

// ----- Models and bots -------------------------------------------------------------

test("models are optional", () => {
  expect(parseNewsletterForm(email("nombre@ejemplo.com"))).toMatchObject({
    kind: "ok",
    input: { models: [] },
  });
});

test("unknown models are ignored, not an error", () => {
  expect(parseNewsletterForm(email("nombre@ejemplo.com", { models: "trucho" }))).toMatchObject({
    kind: "ok",
    input: { models: [] },
  });
});

test("a filled honeypot is a bot, even with a valid contact", () => {
  expect(
    parseNewsletterForm(whatsapp("11 2694-9628", { [HONEYPOT_FIELD]: "https://spam.example" })),
  ).toEqual({ kind: "bot" });
});

test("an empty honeypot is a person", () => {
  expect(parseNewsletterForm(email("nombre@ejemplo.com", { [HONEYPOT_FIELD]: "" })).kind).toBe("ok");
});
