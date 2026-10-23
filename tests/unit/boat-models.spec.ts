/**
 * Unit layer for the newsletter's model list — no browser, no server.
 *
 * Each model becomes a Wix contact label, which is what the owner segments a campaign
 * by. Two entries sharing a label would silently merge two audiences in the CRM, and a
 * slug that changes orphans everyone who followed it — so the list is pinned here.
 */

import { test, expect } from "@playwright/test";
import {
  BOAT_MODELS,
  MODEL_GROUPS,
  matchesModel,
  modelLabel,
  parseModels,
} from "@/lib/boat-models";

const bySlug = (slug: string) => BOAT_MODELS.find((m) => m.slug === slug)!;

// ----- The list ---------------------------------------------------------------

test("slugs and labels are unique", () => {
  const slugs = BOAT_MODELS.map((m) => m.slug);
  const labels = BOAT_MODELS.map(modelLabel);
  expect(new Set(slugs).size).toBe(slugs.length);
  expect(new Set(labels).size).toBe(labels.length);
});

test("slugs are URL- and form-safe", () => {
  for (const m of BOAT_MODELS) expect(m.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test("every model sits in a group the form renders", () => {
  const groups = MODEL_GROUPS.map((g) => g.value);
  for (const m of BOAT_MODELS) expect(groups).toContain(m.group);
});

test("the models asked for by name are on the list", () => {
  // Neither is in the catalog today — which is exactly why someone would want an alert.
  expect(bySlug("colibri")).toMatchObject({ label: "Colibrí", group: "vela" });
  expect(bySlug("bries")).toMatchObject({ label: "Bries", group: "vela" });
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

// ----- Labels and search --------------------------------------------------------

test("the CRM label reads as a segment name", () => {
  expect(modelLabel(bySlug("colibri"))).toBe("Modelo: Colibrí");
});

test("search ignores accents and case", () => {
  const colibri = bySlug("colibri");
  expect(matchesModel(colibri, "colibri")).toBe(true);
  expect(matchesModel(colibri, "COLIBRÍ")).toBe(true);
  expect(matchesModel(colibri, "  col ")).toBe(true);
  expect(matchesModel(colibri, "limbo")).toBe(false);
});

test("an empty search shows everything", () => {
  expect(BOAT_MODELS.every((m) => matchesModel(m, ""))).toBe(true);
});
