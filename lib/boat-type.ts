// Boat type (the catalog's `?type=` filter), kept out of lib/wix.ts (which is
// `server-only`) so the SearchBox client component can render the options.
export type BoatType = "velero" | "crucero" | "lancha";

export const BOAT_TYPES: { value: BoatType; label: string }[] = [
  { value: "velero", label: "Velero" },
  { value: "crucero", label: "Crucero" },
  { value: "lancha", label: "Lancha" },
];

const VALUES: readonly string[] = BOAT_TYPES.map((t) => t.value);

/** Read the URL param. Anything unknown filters nothing, like a junk price bound. */
export function parseBoatType(raw: string | undefined): BoatType | null {
  return raw && VALUES.includes(raw) ? (raw as BoatType) : null;
}

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

/**
 * Wix has no crucero category — the type only exists in the listing name, which the
 * owner writes consistently ("VELERO …", "CRUCERO …", "LANCHA …").
 *
 * Sailboats first, and that order is load-bearing: "VELERO CP 26 (CRUCERO)" is a
 * sailboat, not a cruiser. Catamarans are sailboats too and get no pill of their own —
 * there are two in the catalog, and their name never says "velero", so it is said here.
 */
export function boatTypeFromName(name: string): BoatType | null {
  const n = norm(name);
  if (n.includes("VELERO") || n.includes("VELA") || n.includes("CATAMARAN")) return "velero";
  if (n.includes("CRUCERO")) return "crucero";
  if (n.includes("LANCHA")) return "lancha";
  return null;
}
