/**
 * Unit layer for the newsletter's model list — no browser, no server.
 *
 * Each model becomes a Wix contact label, which is what the owner segments a campaign
 * by. Two entries sharing a label would silently merge two audiences in the CRM, and a
 * slug that changes orphans everyone who followed it — so the list is pinned here. So
 * is the ranking behind the predictive field: what shows first is what gets picked.
 */

import { test, expect } from "@playwright/test";
import {
  BOAT_MODELS,
  modelLabel,
  modelsInListing,
  parseModels,
  suggestModels,
} from "@/lib/boat-models";

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

// ----- Reading the model off a listing name ------------------------------------------
// Every listing in the recorded catalog, pinned to the models it alerts. A listing that
// starts matching something else (or stops matching) changes who gets messaged, so a
// change here should be a deliberate one.

const LISTINGS: [string, string[]][] = [
  ["BALLENERA CLÁSICA DE MADERA🇦🇷 | 1949", []],
  ["CATAMARAN ASTILLERO PAGLIETTINI", []],
  ["CATAMARAN NAUTITECH 46 OPEN | 📍Piriapolis 🇺🇾 | En Venta", ["Nautitech"]],
  ["CRUCERO CLÁSICO A REPARAR", []],
  ["CRUCERO MAMBA 25", ["Mamba"]],
  ["CRUCERO TRENTO 250", ["Trento"]],
  ["CUSTON SPECIAL 28 PIES ", ["Custon"]],
  ["Crucero SEA RAY 48 | 📍Uruguay Piriapolis", ["Sea Ray"]],
  ["DUFOUR 425 GRAND LARGE | 2008 | EN VENTA🇺🇾", ["Dufour"]],
  ["Fareast 420 – Año 2008", []],
  ["GOMON ZODIAC +MOTOR", []],
  ["GOMÓN INFLABLE AQUAMARINA U-DELUXE 350", []],
  ["Gomon Moon 260", []],
  ["Heladeras 12 vol Varias", []],
  ["IMPECABLE GRUMETE DE MADERA | SOLO PARA ENTENDIDOS", ["Grumete"]],
  ["LANCHA 505", []],
  ["LANCHA MARINE SUR 1500", ["Marine Sur"]],
  ["LANCHA QUICKSILVER 1800 | IMPECABLE", ["Quicksilver"]],
  ["MOTO DE AGUA YAMAHA", []],
  ["MOTOR FUERA DE BORDA TOHATSU 25 HP PATA CORTA", []],
  ["MOTOVELERO CLÁSICO DOBLE PROA", []],
  ["Motor Interno Ruggerini PM 105-2 40 HP", []],
  ["RESERVADO ✅️ VELERO ALUMINIO 46 PIES | OPORTUNIDAD ", []],
  ["RESERVADO ➡️H26 | EN VENTA", ["H26"]],
  ["SUZUKI 6 HP 4T PATA CORTA", []],
  ["Sillon Timonel", []],
  ["VELERO ALPHA 25 | EN VENTA", ["Alpha"]],
  ["VELERO BORA BORA 26.8", ["Bora Bora"]],
  ["VELERO BRAMADOR 24 | 2010 | EN VENTA", ["Bramador"]],
  ["VELERO BRAMADOR 34 | CONCEPCIÓN DEL URUGUAY ", ["Bramador"]],
  ["VELERO BRASILIA 32 | BANDERA 🇺🇾 | MOTOR NUEVO", ["Brasilia"]],
  ["VELERO CHAPARRON 28", ["Chaparrón"]],
  ["VELERO CLÁSICO DOBLE PROA", []],
  ["VELERO CLÁSICO FERROCEMENTO | CON ORZA | BANDERA 🇦🇷", []],
  ["VELERO CLÁSICO SOSIEGO 33 | EN VENTA", ["Sosiego"]],
  ["VELERO COMODORE 24 | EN ENTRE RIOS", ["Comodore"]],
  ["VELERO CONTE 24 ", ["Conte"]],
  ["VELERO CORUM 340 ", ["Corum"]],
  ["VELERO CP 26 (CRUCERO)", ["CP 26"]],
  ["VELERO DANGELO 30", ["D'Angelo"]],
  ["VELERO DEL PLATA 31 | ✨️MOTOR NUEVO", ["Del Plata"]],
  ["VELERO DOLPHIN 25 | EN VENTA", ["Dolphin"]],
  ["VELERO DRAKKAR 32 | A REACCONDICIONAR", ["Drakkar"]],
  ["VELERO DUFOUR 4800 | 📍PANAMA", ["Dufour"]],
  ["VELERO EITIN 25 ", ["Eitin"]],
  ["VELERO FR 17 | BANDERA URUGUAYA🇺🇾", ["FR 17"]],
  ["VELERO H20 | EN VENTA", ["H20"]],
  ["VELERO HOLLAND 23 ", ["Holland"]],
  ["VELERO JEANNEAU SUN ODYSSEY 39 DS", ["Jeanneau"]],
  ["VELERO JEANNEAU SUN ODYSSEY 54 DS  🇺🇾", ["Jeanneau"]],
  ["VELERO KRIPTON 20 | OPORTUNIDAD ", ["Kripton"]],
  ["VELERO LIMBO 21 | Impecable", ["Limbo"]],
  ["VELERO LIMBO 23 ", ["Limbo"]],
  ["VELERO LONGARELA 21", ["Longarela"]],
  ["VELERO MADERA CLÁSICO | ITHURBIDE | OPORTUNIDAD", []],
  ["VELERO MASTRACCHIO 24.5", ["Mastracchio"]],
  ["VELERO MAXI 20 ", ["Maxi"]],
  ["VELERO MIURA 25 - A MEJORAR", ["Miura"]],
  ["VELERO MIURA 25 DOMINANTE II", ["Miura"]],
  ["VELERO NAVEGANTE 35", ["Navegante"]],
  ["VELERO PANDORA 23", ["Pandora"]],
  ["VELERO PANDORA 34", ["Pandora"]],
  ["VELERO PETERSON 34 | 📍CARIBE  | BANDERA 🇦🇷", ["Peterson"]],
  ["VELERO PK 22 ", ["PK 22"]],
  ["VELERO PLENAMAR 23 ", ["Plenamar"]],
  ["VELERO PLENAMAR 23 | LISTO PARA NAVEGAR", ["Plenamar"]],
  ["VELERO PLENAMAR 36", ["Plenamar"]],
  ["VELERO REGGE 30", ["Regge"]],
  ["VELERO RESCH 26 ", ["Resch"]],
  ["VELERO ROY 20", ["Roy"]],
  ["VELERO SEILDELMANN 34 | 1984 | 📍PANAMA", ["Seidelmann"]],
  ["VELERO ZABRA 980", ["Zabra"]],
  ["Velero Aluminio Oceánico", []],
  ["Velero Clipper 32", ["Clipper"]],
  ["Velero Krypton 20 – Oportunidad", ["Kripton"]],
  ["Velero Sailor 1000 (a Mejorar)", ["Sailor"]],
  ["Velero Super 22 – Nuevo Precio – Oportunidad", ["Super 22"]],
  ["Velero de Madera CLÁSICO 🇺🇾", []],
  ["🇺🇾VELERO S2 36 PIES | EN VENTA", ["S2"]],
];

for (const [name, expected] of LISTINGS) {
  test(`listing ${JSON.stringify(name)} → ${expected.join(", ") || "no model"}`, () => {
    expect(modelsInListing(name).map((m) => m.label)).toEqual(expected);
  });
}

test("a model is matched on whole words only", () => {
  expect(modelsInListing("VELERO ROYAL 30")).toEqual([]);
  expect(modelsInListing("VELERO MAXIMUS 20")).toEqual([]);
  expect(modelsInListing("VELERO ROY 20").map((m) => m.label)).toEqual(["Roy"]);
});

test("a listing with two models matches both", () => {
  expect(modelsInListing("PERMUTO PLENAMAR 23 POR LIMBO 21").map((m) => m.label)).toEqual([
    "Limbo",
    "Plenamar",
  ]);
});
