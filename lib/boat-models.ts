// Boat models a visitor can follow from the newsletter. Kept out of lib/newsletter.ts
// (which is `server-only`) so the NewsletterForm client component can render the chips.
//
// Hand-curated, not read off the catalog: the point of an alert is the model that is NOT
// listed today (a Colibrí, a Bries), and the owner's rule is that nothing is inferred
// from listing text. One entry per model family — whoever follows "Plenamar" wants the
// 23 and the 36 alike. Each one becomes a Wix contact label (see modelLabel), so renaming
// a `label` here starts a new label in the CRM; the old contacts keep the old one.
export type BoatModelGroup = "vela" | "motor";

export type BoatModel = { slug: string; label: string; group: BoatModelGroup };

export const MODEL_GROUPS: { value: BoatModelGroup; label: string }[] = [
  { value: "vela", label: "Veleros" },
  { value: "motor", label: "A motor" },
];

const vela = (slug: string, label: string): BoatModel => ({ slug, label, group: "vela" });
const motor = (slug: string, label: string): BoatModel => ({ slug, label, group: "motor" });

export const BOAT_MODELS: BoatModel[] = [
  vela("alpha", "Alpha"),
  vela("bora-bora", "Bora Bora"),
  vela("bramador", "Bramador"),
  vela("brasilia", "Brasilia"),
  vela("bries", "Bries"),
  vela("chaparron", "Chaparrón"),
  vela("clipper", "Clipper"),
  vela("colibri", "Colibrí"),
  vela("comodore", "Comodore"),
  vela("conte", "Conte"),
  vela("corum", "Corum"),
  vela("cp-26", "CP 26"),
  vela("dangelo", "D'Angelo"),
  vela("del-plata", "Del Plata"),
  vela("dolphin", "Dolphin"),
  vela("drakkar", "Drakkar"),
  vela("dufour", "Dufour"),
  vela("eitin", "Eitin"),
  vela("fr-17", "FR 17"),
  vela("grumete", "Grumete"),
  vela("h20", "H20"),
  vela("h26", "H26"),
  vela("holland", "Holland"),
  vela("jeanneau", "Jeanneau"),
  vela("kripton", "Kripton"),
  vela("limbo", "Limbo"),
  vela("longarela", "Longarela"),
  vela("mastracchio", "Mastracchio"),
  vela("maxi", "Maxi"),
  vela("miura", "Miura"),
  vela("nautitech", "Nautitech"),
  vela("navegante", "Navegante"),
  vela("pandora", "Pandora"),
  vela("peterson", "Peterson"),
  vela("pk-22", "PK 22"),
  vela("plenamar", "Plenamar"),
  vela("regge", "Regge"),
  vela("resch", "Resch"),
  vela("roy", "Roy"),
  vela("s2", "S2"),
  vela("sailor", "Sailor"),
  vela("seidelmann", "Seidelmann"),
  vela("sosiego", "Sosiego"),
  vela("super-22", "Super 22"),
  vela("zabra", "Zabra"),
  motor("custon", "Custon"),
  motor("mamba", "Mamba"),
  motor("marine-sur", "Marine Sur"),
  motor("quicksilver", "Quicksilver"),
  motor("sea-ray", "Sea Ray"),
  motor("trento", "Trento"),
];

const BY_SLUG = new Map(BOAT_MODELS.map((m) => [m.slug, m]));

/** Read the submitted slugs. Unknown ones are dropped, like a junk `?type=`; dupes too. */
export function parseModels(raw: readonly string[]): BoatModel[] {
  const seen = new Set<string>();
  const out: BoatModel[] = [];
  for (const slug of raw) {
    const model = BY_SLUG.get(slug);
    if (model && !seen.has(slug)) {
      seen.add(slug);
      out.push(model);
    }
  }
  return out;
}

/** The Wix contact label a model is stored under — what the owner segments a campaign by. */
export function modelLabel(model: BoatModel): string {
  return `Modelo: ${model.label}`;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Chip search: accent- and case-insensitive, so "colibri" finds "Colibrí". */
export function matchesModel(model: BoatModel, query: string): boolean {
  const q = norm(query.trim());
  return q === "" || norm(model.label).includes(q);
}
