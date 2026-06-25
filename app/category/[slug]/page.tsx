import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategoryBySlug,
  getBoatsInCategory,
  categoryLabel,
  FLAG_FILTERS,
  type Boat,
} from "@/lib/wix";
import BoatCard from "@/components/BoatCard";

// Always fetch the latest from Wix on every request (no caching).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const cat = await getCategoryBySlug(decoded);
  const title = cat ? categoryLabel(cat.slug, cat.name) : "Catálogo";
  return { title, alternates: { canonical: `/category/${slug}` } };
}

const SORTS = [
  { key: "", label: "Más recientes" },
  { key: "price-asc", label: "Precio ↑" },
  { key: "price-desc", label: "Precio ↓" },
];

function sortBoats(boats: Boat[], sort: string): Boat[] {
  if (sort === "price-asc") return [...boats].sort((a, b) => (a.priceUsd ?? 0) - (b.priceUsd ?? 0));
  if (sort === "price-desc") return [...boats].sort((a, b) => (b.priceUsd ?? 0) - (a.priceUsd ?? 0));
  return boats;
}

// Accent-insensitive name search over real data (just filters, infers nothing).
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function searchBoats(boats: Boat[], q: string): Boat[] {
  const nq = norm(q.trim());
  return nq ? boats.filter((b) => norm(b.name).includes(nq)) : boats;
}

const pill = (active: boolean) => `btn btn-sm ${active ? "btn-navy" : "btn-ghost"}`;
const pillRow = { display: "flex", gap: ".5rem", flexWrap: "wrap" as const };

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const { slug } = await params;
  const { sort = "", q = "" } = await searchParams;
  const current = decodeURIComponent(slug);
  const cat = await getCategoryBySlug(current);
  if (!cat) notFound();

  const inCategory = await getBoatsInCategory(cat.id);
  const boats = sortBoats(searchBoats(inCategory, q), sort);
  const heading = categoryLabel(cat.slug, cat.name);

  // Build query strings that preserve the active search when switching sort.
  const qs = (sortKey: string) => {
    const p = new URLSearchParams();
    if (sortKey) p.set("sort", sortKey);
    if (q) p.set("q", q);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="container">
      <div className="page-title">
        <h1>{heading}</h1>
        <p>
          {boats.length} embarcaci{boats.length === 1 ? "ón" : "ones"}
          {q ? <> para “{q}”</> : <> disponible{boats.length === 1 ? "" : "s"}</>}
        </p>
      </div>

      <div className="filter-bar">
        <form className="filter-group filter-search">
          <label htmlFor="q">Buscar</label>
          <div style={{ display: "flex", gap: ".5rem" }}>
            <input
              id="q"
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Nombre del barco…"
              style={{ flex: 1 }}
            />
            {sort ? <input type="hidden" name="sort" value={sort} /> : null}
            <button type="submit" className="btn btn-sm btn-navy">
              Buscar
            </button>
          </div>
        </form>
        <div className="filter-group">
          <label>Bandera</label>
          <div style={pillRow}>
            <Link href="/category/all-products" className={pill(current === "all-products")}>
              Todas
            </Link>
            {FLAG_FILTERS.map((f) => (
              <Link key={f.slug} href={`/category/${f.slug}`} className={pill(current === f.slug)}>
                {f.emoji} {f.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <label>Ordenar</label>
          <div style={pillRow}>
            {SORTS.map((s) => (
              <Link key={s.key} href={`/category/${slug}${qs(s.key)}`} className={pill(sort === s.key)}>
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {boats.length ? (
        <div className="boat-grid">
          {boats.map((boat) => (
            <BoatCard key={boat.id} boat={boat} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <p>
            {q
              ? `No se encontraron embarcaciones para “${q}”.`
              : "No hay embarcaciones en esta categoría por ahora."}
          </p>
          <Link className="btn btn-outline" href={`/category/${slug}`} style={{ marginTop: "1rem" }}>
            {q ? "Limpiar búsqueda" : "Ver todas"}
          </Link>
        </div>
      )}
    </div>
  );
}
