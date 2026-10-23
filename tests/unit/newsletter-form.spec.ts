/**
 * Unit layer for the newsletter form rules — the gate in front of every Wix write.
 *
 * The browser's own `type="email"` check is not the gate: it accepts `a@b`, and a
 * script never runs it at all. Whatever passes here becomes a CRM contact.
 */

import { test, expect } from "@playwright/test";
import { HONEYPOT_FIELD, parseNewsletterForm } from "@/lib/newsletter-form";

function form(fields: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    for (const v of [value].flat()) fd.append(name, v);
  }
  return fd;
}

test("a valid submission comes back normalised", () => {
  const parsed = parseNewsletterForm(
    form({ email: "  Nombre@Ejemplo.COM ", models: ["colibri", "bries"] }),
  );

  expect(parsed).toEqual({
    kind: "ok",
    input: {
      email: "nombre@ejemplo.com",
      models: [
        { slug: "colibri", label: "Colibrí", group: "vela" },
        { slug: "bries", label: "Bries", group: "vela" },
      ],
    },
  });
});

test("models are optional", () => {
  const parsed = parseNewsletterForm(form({ email: "nombre@ejemplo.com" }));
  expect(parsed).toMatchObject({ kind: "ok", input: { models: [] } });
});

test("unknown models are ignored, not an error", () => {
  const parsed = parseNewsletterForm(form({ email: "nombre@ejemplo.com", models: "trucho" }));
  expect(parsed).toMatchObject({ kind: "ok", input: { models: [] } });
});

test("a missing email asks for one", () => {
  expect(parseNewsletterForm(form({ email: "   " }))).toEqual({
    kind: "invalid",
    message: "Ingresá tu email.",
  });
  expect(parseNewsletterForm(form({}))).toMatchObject({ kind: "invalid" });
});

for (const bad of ["a@b", "a@b.", "a@.com", "sin-arroba.com", "a b@c.com", "a@b@c.com"]) {
  test(`"${bad}" is rejected`, () => {
    expect(parseNewsletterForm(form({ email: bad }))).toMatchObject({ kind: "invalid" });
  });
}

test("an address longer than RFC 5321 allows is rejected", () => {
  const email = `${"a".repeat(250)}@b.com`;
  expect(parseNewsletterForm(form({ email }))).toMatchObject({ kind: "invalid" });
});

test("a filled honeypot is a bot, even with a valid email", () => {
  const parsed = parseNewsletterForm(
    form({ email: "nombre@ejemplo.com", [HONEYPOT_FIELD]: "https://spam.example" }),
  );
  expect(parsed).toEqual({ kind: "bot" });
});

test("an empty honeypot is a person", () => {
  const parsed = parseNewsletterForm(form({ email: "nombre@ejemplo.com", [HONEYPOT_FIELD]: "" }));
  expect(parsed.kind).toBe("ok");
});
