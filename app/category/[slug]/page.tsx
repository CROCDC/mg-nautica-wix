import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getCategoryBySlug,
  getBoatsInCategory,
  categoryLabel,
  FLAG_FILTERS,
  type Boat,
} from "@/lib/wix";
import BoatCard from "@/components/BoatCard";
import SearchBox from "@/components/SearchBox";

// Always fetch the latest from Wix on every request (no caching).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = categoryLabel(decodeURIComponent(slug), "Catálogo");
  return { title, alternates: { canonical: `/category/${slug}` } };
}

const SORTS = [
  { key: "", label: "Más recientes" },
  { key: "price-asc", label: "Precio ↑" },
  { key: "price-desc", label: "Precio ↓" },
];

const pill = (active: boolean) => `btn btn-sm ${active ? "btn-navy" : "btn-ghost"}`;
const pillRow = { display: "flex", gap: ".5rem", flexWrap: "wrap" as const };

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

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
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const { slug } = await params;
  const { sort = "", q = "" } = await searchParams;
  const current = decodeURIComponent(slug);
  const heading = categoryLabel(current, "Embarcaciones");
  const basePath = `/category/${slug}`;

  // Sort links preserve the active search.
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
      </div>

      {/* Instant shell — renders without waiting on Wix; the grid below suspends. */}
      <div className="filter-bar" style={{ flexDirection: "column", alignItems: "stretch", gap: "1.1rem" }}>
        <SearchBox key={basePath} basePath={basePath} sort={sort} q={q} />
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          <div className="filter-group" style={{ flex: "0 1 auto" }}>
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
          <div className="filter-group" style={{ flex: "0 1 auto" }}>
            <label>Ordenar</label>
            <div style={pillRow}>
              {SORTS.map((s) => (
                <Link key={s.key} href={`${basePath}${qs(s.key)}`} className={pill(sort === s.key)}>
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Suspense key={`${current}:${sort}:${q}`} fallback={<GridSkeleton />}>
        <Results catSlug={current} backHref={basePath} sort={sort} q={q} />
      </Suspense>
    </div>
  );
}

async function Results({
  catSlug,
  backHref,
  sort,
  q,
}: {
  catSlug: string;
  backHref: string;
  sort: string;
  q: string;
}) {
  const cat = await getCategoryBySlug(catSlug);
  if (!cat) notFound();

  const nq = norm(q.trim());
  const inCategory = await getBoatsInCategory(cat.id);
  const filtered = nq ? inCategory.filter((b) => norm(b.name).includes(nq)) : inCategory;
  const boats = sortBoats(filtered, sort);

  return (
    <>
      <p className="results-count">
        {boats.length} embarcaci{boats.length === 1 ? "ón" : "ones"}
        {q ? <> para “{q}”</> : <> disponible{boats.length === 1 ? "" : "s"}</>}
      </p>

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
          <Link className="btn btn-outline" href={q ? backHref : "/category/all-products"} style={{ marginTop: "1rem" }}>
            {q ? "Limpiar búsqueda" : "Ver todas"}
          </Link>
        </div>
      )}
    </>
  );
}

function GridSkeleton() {
  return (
    <>
      <p className="results-count sk" style={{ width: 180, height: "1rem" }} aria-hidden />
      <div className="boat-grid" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <div className="sk-card" key={i}>
            <div className="sk-img sk" />
            <div style={{ padding: ".4rem .9rem 1.1rem" }}>
              <div className="sk-line sk" style={{ width: "75%" }} />
              <div className="sk-line sk" style={{ width: "45%" }} />
              <div className="sk-line sk" style={{ width: "55%", height: "1.1rem", marginTop: ".7rem" }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
