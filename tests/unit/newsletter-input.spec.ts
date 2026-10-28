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

// The rules of both channels, whatever WHATSAPP_ENABLED says today; the switched-off
// behaviour has its own section at the end.
const parse = (fd: FormData) => parseNewsletterForm(fd, { whatsapp: true });

// ----- Email ----------------------------------------------------------------------

test("an email submission comes back normalised", () => {
  const parsed = parse(email("  Nombre@Ejemplo.COM ", { models: ["colibri", "bries"] }));

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
  expect(parse(email("   "))).toEqual({ kind: "invalid", message: "Ingresá tu email." });
});

for (const bad of ["a@b", "a@b.", "a@.com", "sin-arroba.com", "a b@c.com", "a@b@c.com"]) {
  test(`"${bad}" is rejected`, () => {
    expect(parse(email(bad))).toMatchObject({ kind: "invalid" });
  });
}

test("an address longer than RFC 5321 allows is rejected", () => {
  expect(parse(email(`${"a".repeat(250)}@b.com`))).toMatchObject({ kind: "invalid" });
});

// ----- WhatsApp ---------------------------------------------------------------------

test("a WhatsApp submission is stored as E.164 with its country", () => {
  const parsed = parse(whatsapp("11 2694-9628", { models: "plenamar" }));

  expect(parsed).toEqual({
    kind: "ok",
    input: {
      contact: { channel: "whatsapp", phone: "+5491126949628", country: "AR" },
      models: [{ slug: "plenamar", label: "Plenamar" }],
    },
  });
});

test("WhatsApp is the channel when none is sent", () => {
  const parsed = parse(form({ phone: "11 2694-9628" }));
  expect(parsed).toMatchObject({ kind: "ok", input: { contact: { channel: "whatsapp" } } });
});

test("the Uruguay prefix applies to a local Uruguayan number", () => {
  const parsed = parse(whatsapp("099 123 456", { country: "UY" }));
  expect(parsed).toMatchObject({
    kind: "ok",
    input: { contact: { phone: "+59899123456", country: "UY" } },
  });
});

test("an unknown prefix value falls back to Argentina", () => {
  const parsed = parse(whatsapp("11 2694-9628", { country: "XX" }));
  expect(parsed).toMatchObject({ kind: "ok", input: { contact: { phone: "+5491126949628" } } });
});

test("a missing number asks for one", () => {
  expect(parse(whatsapp("  "))).toEqual({
    kind: "invalid",
    message: "Ingresá tu número de WhatsApp.",
  });
});

test("a number without area code is rejected with a hint", () => {
  const parsed = parse(whatsapp("15 2694 9628"));
  expect(parsed).toMatchObject({ kind: "invalid", message: expect.stringContaining("código de área") });
});

test("an absurdly long value is rejected before parsing", () => {
  expect(parse(whatsapp("1".repeat(40)))).toMatchObject({ kind: "invalid" });
});

test("the email field is ignored on the WhatsApp channel, and vice versa", () => {
  // Both inputs never render together, but a crafted post can send both.
  expect(parse(whatsapp("11 2694-9628", { email: "x@y.com" }))).toMatchObject({
    input: { contact: { channel: "whatsapp" } },
  });
  expect(parse(email("x@y.com", { phone: "11 2694-9628" }))).toMatchObject({
    input: { contact: { channel: "email", email: "x@y.com" } },
  });
});

// ----- Models and bots -------------------------------------------------------------

test("models are optional", () => {
  expect(parse(email("nombre@ejemplo.com"))).toMatchObject({
    kind: "ok",
    input: { models: [] },
  });
});

test("unknown models are ignored, not an error", () => {
  expect(parse(email("nombre@ejemplo.com", { models: "trucho" }))).toMatchObject({
    kind: "ok",
    input: { models: [] },
  });
});

test("a filled honeypot is a bot, even with a valid contact", () => {
  expect(
    parse(whatsapp("11 2694-9628", { [HONEYPOT_FIELD]: "https://spam.example" })),
  ).toEqual({ kind: "bot" });
});

test("an empty honeypot is a person", () => {
  expect(parse(email("nombre@ejemplo.com", { [HONEYPOT_FIELD]: "" })).kind).toBe("ok");
});

// ----- WhatsApp switched off -------------------------------------------------------

const offline = (fd: FormData) => parseNewsletterForm(fd, { whatsapp: false });

test("with WhatsApp off, a submission without a channel is filed as email", () => {
  expect(offline(form({ email: "Nombre@Ejemplo.com" }))).toMatchObject({
    kind: "ok",
    input: { contact: { channel: "email", email: "nombre@ejemplo.com" } },
  });
});

test("with WhatsApp off, a page cached from before that posts a number is asked for an email", () => {
  expect(offline(whatsapp("11 2694-9628"))).toEqual({ kind: "invalid", message: "Ingresá tu email." });
});
