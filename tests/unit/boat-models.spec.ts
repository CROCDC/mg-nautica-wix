/**
 * Unit layer for the newsletter's model list — no browser, no server.
 *
 * Each model becomes a Wix contact label, which is what the owner segments a campaign
 * by. Two entries sharing a label would silently merge two audiences in the CRM, and a
 * slug that changes orphans everyone who followed it — so the list is pinned here. So
 * is the ranking behind the predictive field: what shows first is what gets picked.
 */

import { test, expect } from "@playwright/test";
import { BOAT_MODELS, modelLabel, parseModels, suggestModels } from "@/lib/boat-models";

const bySlug = (slug: string) => BOAT_MODELS.find((m) => m.slug === slug)!;
const labels = (query: string, exclude: string[] = [], limit?: number) =>
  suggestModels(query, exclude, limit).map((m) => m.label);

// ----- The list ---------------------------------------------------------------

test("slugs and labels are unique", () => {
  const slugs = BOAT_MODELS.map((m) => m.slug);
  const crmLabels = BOAT_MODELS.map(modelLabel);
  expect(new Set(slugs).size).toBe(slugs.length);
  expect(new Set(crmLabels).size).toBe(crmLabels.length);
});

test("slugs are URL- and form-safe", () => {
  for (const m of BOAT_MODELS) expect(m.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test("labels are precomposed, so the field can highlight by index", () => {
  // The suggestion highlight folds accents and assumes that keeps every character in
  // place — true for "í", not for an "i" followed by a combining accent.
  for (const m of BOAT_MODELS) expect(m.label).toBe(m.label.normalize("NFC"));
});

test("the models asked for by name are on the list", () => {
  // Neither is in the catalog today — which is exactly why someone would want an alert.
  expect(bySlug("colibri").label).toBe("Colibrí");
  expect(bySlug("bries").label).toBe("Bries");
});

// ----- Parsing the submitted form ----------------------------------------------

test("submitted slugs map back to models, in the order given", () => {
  expect(parseModels(["limbo", "colibri"]).map((m) => m.label)).toEqual(["Limbo", "Colibrí"]);
});

test("unknown slugs are dropped instead of failing the subscription", () => {
  expect(parseModels(["colibri", "not-a-model", "<script>"]).map((m) => m.slug)).toEqual([
    "colibri",
  ]);
});

test("a slug sent twice counts once", () => {
  expect(parseModels(["bries", "bries"])).toHaveLength(1);
});

test("the CRM label reads as a segment name", () => {
  expect(modelLabel(bySlug("colibri"))).toBe("Modelo: Colibrí");
});

// ----- Suggestions while typing ------------------------------------------------

test("nothing is suggested before the first keystroke", () => {
  expect(suggestModels("")).toEqual([]);
  expect(suggestModels("   ")).toEqual([]);
});

test("accents and case do not matter", () => {
  expect(labels("colibri")).toEqual(["Colibrí"]);
  expect(labels("CHAPARRÓN")).toEqual(["Chaparrón"]);
});

test("sail and motor models come up together", () => {
  // Maxi and Mastracchio are sailboats, Mamba and Marine Sur are motor — one list.
  expect(labels("ma")).toEqual(
    expect.arrayContaining(["Mamba", "Marine Sur", "Mastracchio", "Maxi"]),
  );
});

test("names starting with the text come before names that merely contain it", () => {
  const result = labels("pa");
  expect(result[0]).toBe("Pandora");
  expect(result).toContain("Chaparrón");
  expect(result.indexOf("Pandora")).toBeLessThan(result.indexOf("Chaparrón"));
});

test("a later word that starts with the text outranks a mid-word match", () => {
  expect(labels("ray")[0]).toBe("Sea Ray");
});

test("already-picked models are not suggested again", () => {
  expect(labels("colibri", ["colibri"])).toEqual([]);
});

test("the list is capped", () => {
  expect(suggestModels("a").length).toBe(6);
  expect(suggestModels("a", [], 3).length).toBe(3);
});
