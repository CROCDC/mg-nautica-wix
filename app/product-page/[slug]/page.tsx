import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllBoats,
  getBoatBySlug,
  formatUsd,
  ricosToPlainText,
} from "@/lib/wix";
import Gallery from "@/components/Gallery";
import RichText from "@/components/RichText";

export const revalidate = 600;

const WHATSAPP = "5491126949628";

export async function generateStaticParams() {
  try {
    const boats = await getAllBoats();
    return boats
      .filter((b) => /^[\p{L}\p{N}-]+$/u.test(b.slug))
      .map((b) => ({ slug: b.slug }));
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
  const boat = await getBoatBySlug(decodeURIComponent(slug));
  if (!boat) return { title: "Embarcación no encontrada" };
  const description = ricosToPlainText(boat.description, 180) || `${boat.name} en venta.`;
  return {
    title: boat.name,
    description,
    alternates: { canonical: `/product-page/${slug}` },
    openGraph: {
      title: boat.name,
      description,
      images: boat.mainImage ? [boat.mainImage.url] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const boat = await getBoatBySlug(decodeURIComponent(slug));
  if (!boat) notFound();

  const waText = encodeURIComponent(
    `Hola! Me interesa: ${boat.name}. ¿Podemos coordinar una visita?`,
  );
  const savings =
    boat.onSale && boat.compareAtUsd && boat.priceUsd
      ? boat.compareAtUsd - boat.priceUsd
      : null;

  return (
    <div className="container" style={{ paddingTop: "1.5rem", paddingBottom: "3rem" }}>
      <nav className="breadcrumb" aria-label="Ubicación">
        <Link href="/">Inicio</Link>
        <span className="breadcrumb-sep">/</span>
        <Link href="/category/all-products">Embarcaciones</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{boat.name}</span>
      </nav>

      <h1 className="detail-title">{boat.name}</h1>
      {boat.ribbon ? (
        <div className="detail-meta">
          <span className="detail-chip">{boat.ribbon}</span>
        </div>
      ) : null}

      <div className="detail-layout">
        <div className="detail-main">
          <Gallery images={boat.images} />

          {boat.description ? (
            <section style={{ margin: "2rem 0" }}>
              <h2 style={{ marginBottom: ".75rem" }}>Descripción</h2>
              <div style={{ color: "var(--muted)", lineHeight: 1.8, fontSize: ".95rem" }}>
                <RichText content={boat.description} />
              </div>
            </section>
          ) : null}
        </div>

        <aside className="detail-sidebar">
          <div className="sidebar-box">
            <div className="sidebar-price">
              {formatUsd(boat.priceUsd) ?? "Consultar"}
              {savings ? <span className="badge-save">— {formatUsd(savings)}</span> : null}
            </div>
            {boat.onSale && boat.compareAtUsd ? (
              <div className="sidebar-price-old">Antes: {formatUsd(boat.compareAtUsd)}</div>
            ) : null}

            <div className="sidebar-actions">
              <a
                className="btn btn-primary btn-lg"
                href={`https://wa.me/${WHATSAPP}?text=${waText}`}
                target="_blank"
                rel="noopener"
              >
                💬 Contactar por WhatsApp
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
