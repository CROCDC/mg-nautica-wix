/**
 * Unit layer for the boat-type classifier — no browser, no server.
 *
 * This is where the ordering lives, and the ordering is the whole trick: the type is
 * read off the listing name (Wix has no crucero/catamarán category), and several names
 * legitimately contain two type words. A catalog listing sorted into the wrong bucket is
 * invisible in review and only shows up as a boat missing from a filter, so the
 * ambiguous names are pinned here by name.
 */

import { test, expect } from "@playwright/test";
import { boatTypeFromName, parseBoatType, BOAT_TYPES } from "@/lib/boat-type";

// ----- The plain cases --------------------------------------------------------

const plain: [string, string][] = [
  ["VELERO DRAKKAR 32 | A REACCONDICIONAR", "velero"],
  ["CRUCERO MAMBA 25", "crucero"],
  ["LANCHA QUICKSILVER 1800 | IMPECABLE", "lancha"],
];

for (const [name, expected] of plain) {
  test(`"${name}" is a ${expected}`, () => {
    expect(boatTypeFromName(name)).toBe(expected);
  });
}

// ----- The ambiguous ones (why the order is what it is) -----------------------

test("a sailboat described as a cruiser stays a sailboat", () => {
  // Real listing. 'CRUCERO' here describes the sailboat's use, not its type.
  expect(boatTypeFromName("VELERO CP 26 (CRUCERO)")).toBe("velero");
});

test("a motorsailer is a sailboat", () => {
  expect(boatTypeFromName("MOTOVELERO CLÁSICO DOBLE PROA")).toBe("velero");
});

test("a catamaran is a sailboat", () => {
  // Catamarans have no pill of their own — two in the catalog, and "Catamarán" was the
  // label that wrapped the type row onto a second line on a phone. Nothing in the name
  // says "velero", so without this rule they would fall out of every filter.
  expect(boatTypeFromName("CATAMARAN NAUTITECH 46 OPEN | 📍Piriapolis 🇺🇾")).toBe("velero");
  expect(boatTypeFromName("CATAMARAN ASTILLERO PAGLIETTINI")).toBe("velero");
});

// ----- Normalisation ----------------------------------------------------------

test("case and accents do not change the answer", () => {
  expect(boatTypeFromName("Catamarán Nautitech 46")).toBe("velero");
  expect(boatTypeFromName("Velero Sailor 1000 (a Mejorar)")).toBe("velero");
  expect(boatTypeFromName("Crucero SEA RAY 48 | 📍Uruguay Piriapolis")).toBe("crucero");
});

// ----- No answer is a valid answer --------------------------------------------

test("a listing whose name says nothing gets no type", () => {
  // These are real listings. They stay in the catalog and out of every type filter,
  // until the owner renames them — deliberately, rather than being guessed into a bucket.
  expect(boatTypeFromName("MOTO DE AGUA YAMAHA")).toBeNull();
  expect(boatTypeFromName("DUFOUR 425 GRAND LARGE | 2008 | EN VENTA🇺🇾")).toBeNull();
  expect(boatTypeFromName("")).toBeNull();
});

// ----- The URL param ----------------------------------------------------------

test("every offered option is a value the URL parser accepts", () => {
  for (const { value } of BOAT_TYPES) expect(parseBoatType(value)).toBe(value);
});

for (const raw of ["", "barco", "CRUCERO", "crucero ", "catamaran", "velero,crucero"]) {
  test(`?type=${JSON.stringify(raw)} is not a type`, () => {
    // Anything unrecognised filters nothing, like a junk price bound.
    expect(parseBoatType(raw)).toBeNull();
  });
}

test("a missing param is not a type", () => {
  expect(parseBoatType(undefined)).toBeNull();
});
