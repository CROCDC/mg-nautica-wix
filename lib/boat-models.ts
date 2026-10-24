// Boat models a visitor can follow from the newsletter. Kept out of lib/newsletter.ts
// (which is `server-only`) so the NewsletterForm client component can suggest them.
//
// Hand-curated, not read off the catalog: the point of an alert is the model that is NOT
// listed today (a Colibrí, a Bries), and the owner's rule is that nothing is inferred
// from listing text. One entry per model family — whoever follows "Plenamar" wants the
// 23 and the 36 alike. Sail and motor share one list: the visitor types a name, and the
// kind of boat adds nothing to finding it. Each entry becomes a Wix contact label (see
// modelLabel), so renaming a `label` starts a new label in the CRM; the old contacts
// keep the old one.
export type BoatModel = {
  slug: string;
  label: string;
  /** Other spellings the owner has used in listing names, for modelsInListing. */
  aliases?: string[];
};

const model = (slug: string, label: string, aliases?: string[]): BoatModel =>
  aliases ? { slug, label, aliases } : { slug, label };

export const BOAT_MODELS: BoatModel[] = [
  model("alpha", "Alpha"),
  model("bora-bora", "Bora Bora"),
  model("bramador", "Bramador"),
  model("brasilia", "Brasilia"),
  model("bries", "Bries"),
  model("chaparron", "Chaparrón"),
  model("clipper", "Clipper"),
  model("colibri", "Colibrí"),
  model("comodore", "Comodore"),
  model("conte", "Conte"),
  model("corum", "Corum"),
  model("cp-26", "CP 26"),
  model("custon", "Custon"),
  model("dangelo", "D'Angelo", ["Dangelo"]),
  model("del-plata", "Del Plata"),
  model("dolphin", "Dolphin"),
  model("drakkar", "Drakkar"),
  model("dufour", "Dufour"),
  model("eitin", "Eitin"),
  model("fr-17", "FR 17"),
  model("grumete", "Grumete"),
  model("h20", "H20"),
  model("h26", "H26"),
  model("holland", "Holland"),
  model("jeanneau", "Jeanneau"),
  model("kripton", "Kripton", ["Krypton"]),
  model("limbo", "Limbo"),
  model("longarela", "Longarela"),
  model("mamba", "Mamba"),
  model("marine-sur", "Marine Sur"),
  model("mastracchio", "Mastracchio"),
  model("maxi", "Maxi"),
  model("miura", "Miura"),
  model("nautitech", "Nautitech"),
  model("navegante", "Navegante"),
  model("pandora", "Pandora"),
  model("peterson", "Peterson"),
  model("pk-22", "PK 22"),
  model("plenamar", "Plenamar"),
  model("quicksilver", "Quicksilver"),
  model("regge", "Regge"),
  model("resch", "Resch"),
  model("roy", "Roy"),
  model("s2", "S2"),
  model("sailor", "Sailor"),
  model("sea-ray", "Sea Ray"),
  model("seidelmann", "Seidelmann", ["Seildelmann"]),
  model("sosiego", "Sosiego"),
  model("super-22", "Super 22"),
  model("trento", "Trento"),
  model("zabra", "Zabra"),
];

const BY_SLUG = new Map(BOAT_MODELS.map((m) => [m.slug, m]));

/** Read the submitted slugs. Unknown ones are dropped, like a junk `?type=`; dupes too. */
export function parseModels(raw: readonly string[]): BoatModel[] {
  const seen = new Set<string>();
  const out: BoatModel[] = [];
  for (const slug of raw) {
    const found = BY_SLUG.get(slug);
    if (found && !seen.has(slug)) {
      seen.add(slug);
      out.push(found);
    }
  }
  return out;
}

/** The Wix contact label a model is stored under — what the owner segments a campaign by. */
export function modelLabel(m: BoatModel): string {
  return `Modelo: ${m.label}`;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * What the newsletter field suggests while the visitor types — accent- and
 * case-insensitive, so "colibri" finds "Colibrí". Names that start with the text come
 * first, then a later word that does ("ray" → "Sea Ray"), then any other match; list
 * order within each. Already-picked models are left out, and nothing is suggested
 * before the first keystroke.
 */
export function suggestModels(query: string, exclude: readonly string[] = [], limit = 6): BoatModel[] {
  const q = norm(query.trim());
  if (!q) return [];
  const rank = (m: BoatModel) => {
    const label = norm(m.label);
    if (label.startsWith(q)) return 0;
    if (label.split(/[\s'-]+/).some((word) => word.startsWith(q))) return 1;
    return label.includes(q) ? 2 : -1;
  };
  return BOAT_MODELS.map((m) => ({ m, r: rank(m) }))
    .filter(({ m, r }) => r >= 0 && !exclude.includes(m.slug))
    .sort((a, b) => a.r - b.r)
    .slice(0, limit)
    .map(({ m }) => m);
}

/** Lowercase, accents and symbols (emoji, "|", "–") folded to single spaces. */
const words = (s: string) =>
  ` ${norm(s).replace(/[^a-z0-9]+/g, " ").trim()} `;

/**
 * The models a catalog listing is a boat of, read off its name — what decides who gets
 * an alert when it is published. Whole words only, so "Roy" does not fire on "Royal".
 *
 * This reads text, which the owner's rule otherwise avoids (see lib/boat-type.ts for the
 * one other place): there is no Wix field for the model. The owner names listings
 * consistently ("VELERO PLENAMAR 23 | …"), every current name is pinned in the unit
 * tests, and a spelling the owner uses that the list does not know goes in `aliases`.
 */
export function modelsInListing(name: string): BoatModel[] {
  const listing = words(name);
  return BOAT_MODELS.filter((m) =>
    [m.label, ...(m.aliases ?? [])].some((spelling) => listing.includes(words(spelling))),
  );
}
