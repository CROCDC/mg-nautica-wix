/**
 * Unit layer: the rules behind the Parrado Seguros quote builder in lib/parrado.ts.
 *
 * The car discount only covers cars up to five years old, so the year check is where a
 * wrong promise to a customer would come from.
 */

import { test, expect } from "@playwright/test";
import { DEFAULT_QUOTE, carDiscountApplies, insuranceHref, quoteMessage } from "@/lib/parrado";

const YEAR = 2026;

test("a car up to five years old gets the discount", () => {
  expect(carDiscountApplies("2026", YEAR)).toBe(true);
  expect(carDiscountApplies("2021", YEAR)).toBe(true);
});

test("a car older than five years does not", () => {
  expect(carDiscountApplies("2020", YEAR)).toBe(false);
});

test("an empty, partial or implausible year is not judged yet", () => {
  for (const year of ["", "20", "202", "1850", "2031", "abcd"]) {
    expect(carDiscountApplies(year, YEAR)).toBeNull();
  }
});

test("the default message asks about the visitor's boat", () => {
  expect(quoteMessage(DEFAULT_QUOTE, YEAR)).toBe(
    "Hola! Quiero cotizar un seguro con Parrado Seguros.\n• Mi embarcación",
  );
});

test("the message names the boat, the car year and both discounts", () => {
  const message = quoteMessage(
    { boat: true, boatName: "Velero Grumete 24", car: true, carYear: "2023", home: true },
    YEAR,
  );
  expect(message).toBe(
    [
      "Hola! Quiero cotizar un seguro con Parrado Seguros.",
      "• Embarcación: Velero Grumete 24",
      "• Auto, año 2023 (descuento del 30%)",
      "• Hogar (descuento del 20%)",
    ].join("\n"),
  );
});

test("an older car is still quoted, without promising the discount", () => {
  const message = quoteMessage({ ...DEFAULT_QUOTE, boat: false, car: true, carYear: "2015" }, YEAR);
  expect(message).toContain("• Auto, año 2015");
  expect(message).not.toContain("descuento");
});

test("product pages link to the quote with the boat filled in", () => {
  expect(insuranceHref("Velero R630 año 2006")).toBe(
    "/insurance?embarcacion=Velero%20R630%20a%C3%B1o%202006#consulta",
  );
  expect(insuranceHref()).toBe("/insurance#consulta");
});
