import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategoryBySlug,
  getBoatsInCategory,
  categoryLabel,
  TYPE_FILTERS,
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

const pill = (active: boolean) => `btn btn-sm ${active ? "btn-navy" : "btn-ghost"}`;
const pillRow = { display: "flex", gap: ".5rem", flexWrap: "wrap" as const };

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const { sort = "" } = await searchParams;
  const current = decodeURIComponent(slug);
  const cat = await getCategoryBySlug(current);
  if (!cat) notFound();

  const boats = sortBoats(await getBoatsInCategory(cat.id), sort);
  const heading = categoryLabel(cat.slug, cat.name);

  return (
    <div className="container">
      <div className="page-title">
        <h1>{heading}</h1>
        <p>
          {boats.length} embarcaci{boats.length === 1 ? "ón" : "ones"} disponible
          {boats.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>Tipo</label>
          <div style={pillRow}>
            <Link href="/category/all-products" className={pill(current === "all-products")}>
              Todos
            </Link>
            {TYPE_FILTERS.map((f) => (
              <Link key={f.slug} href={`/category/${f.slug}`} className={pill(current === f.slug)}>
                {f.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <label>Bandera</label>
          <div style={pillRow}>
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
              <Link
                key={s.key}
                href={s.key ? `/category/${slug}?sort=${s.key}` : `/category/${slug}`}
                className={pill(sort === s.key)}
              >
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
          <p>No hay embarcaciones en esta categoría por ahora.</p>
          <Link className="btn btn-outline" href="/category/all-products" style={{ marginTop: "1rem" }}>
            Ver todas
          </Link>
        </div>
      )}
    </div>
  );
}
