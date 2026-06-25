import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug, getBoatsInCategory, type Boat } from "@/lib/wix";
import BoatCard from "@/components/BoatCard";

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    const cats = await getCategories();
    // Pre-render clean slugs only; emoji slugs render on-demand (dynamicParams default).
    return cats.filter((c) => /^[\p{L}\p{N}-]+$/u.test(c.slug)).map((c) => ({ slug: c.slug }));
  } catch {
    // No Wix client id at build time (e.g. CI) — render all on-demand instead.
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(decodeURIComponent(slug));
  const title = cat ? title_(cat.name, cat.slug) : "Catálogo";
  return { title, alternates: { canonical: `/category/${slug}` } };
}

function title_(name: string, slug: string) {
  return slug === "all-products" ? "Embarcaciones" : name;
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

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const { sort = "" } = await searchParams;
  const cat = await getCategoryBySlug(decodeURIComponent(slug));
  if (!cat) notFound();

  const boats = sortBoats(await getBoatsInCategory(cat.id), sort);
  const heading = title_(cat.name, cat.slug);

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
          <label>Ordenar</label>
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            {SORTS.map((s) => (
              <Link
                key={s.key}
                href={s.key ? `/category/${slug}?sort=${s.key}` : `/category/${slug}`}
                className={`btn btn-sm ${sort === s.key ? "btn-navy" : "btn-ghost"}`}
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
