/**
 * Unit layer for WhatsApp number normalisation — no browser, no server.
 *
 * Argentine numbers are the trap: people write their mobile three different ways, and
 * the most common one ("11 2694-9628") parses as a landline, which WhatsApp cannot
 * reach. Every habit seen in the wild is pinned here to the one E.164 a chat opens on.
 */

import { test, expect } from "@playwright/test";
import { parseWhatsAppNumber } from "@/lib/phone";

const BA_MOBILE = "+5491126949628";

const argentine: [string, string][] = [
  ["11 2694-9628", BA_MOBILE], // how people write their own mobile
  ["1126949628", BA_MOBILE],
  ["011 15 2694-9628", BA_MOBILE], // the old local dialling habit
  ["11 15 2694-9628", BA_MOBILE],
  ["+54 9 11 2694 9628", BA_MOBILE], // international, as WhatsApp shows it
  ["5491126949628", BA_MOBILE],
  ["+54 11 2694-9628", BA_MOBILE], // international, without the 9
  ["0221 15 456-7890", "+5492214567890"], // La Plata
  ["221 456-7890", "+5492214567890"],
];

for (const [typed, e164] of argentine) {
  test(`AR: "${typed}" → ${e164}`, () => {
    expect(parseWhatsAppNumber(typed, "AR")).toEqual({ e164, country: "AR" });
  });
}

test("UY: a local mobile with the Uruguay prefix", () => {
  expect(parseWhatsAppNumber("099 123 456", "UY")).toEqual({ e164: "+59899123456", country: "UY" });
  expect(parseWhatsAppNumber("99 123 456", "UY")).toEqual({ e164: "+59899123456", country: "UY" });
});

test("a typed +code wins over the prefix selector", () => {
  expect(parseWhatsAppNumber("+598 99 123 456", "AR")).toEqual({
    e164: "+59899123456",
    country: "UY",
  });
  expect(parseWhatsAppNumber("+34 612 345 678", "AR")).toEqual({
    e164: "+34612345678",
    country: "ES",
  });
});

for (const bad of ["", "123", "15 2694 9628", "4567-8901", "hola", "+54"]) {
  test(`"${bad}" is not a number a chat can reach`, () => {
    expect(parseWhatsAppNumber(bad, "AR")).toBeNull();
  });
}
