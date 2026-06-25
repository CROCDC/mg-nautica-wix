import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBoatBySlug, formatUsd, ricosToPlainText } from "@/lib/wix";
import Gallery from "@/components/Gallery";
import RichText from "@/components/RichText";

// Always fetch the latest from Wix on every request (no caching).
export const dynamic = "force-dynamic";

const WHATSAPP = "5491126949628";

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
      {boat.tags.length ? (
        <div className="detail-meta">
          {boat.tags.map((t) => (
            <span key={t.slug} className="detail-chip">
              {t.emoji ? `${t.emoji} ` : ""}
              {t.label}
            </span>
          ))}
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
            <p style={{ marginTop: ".85rem", fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.5 }}>
              Coordinamos visitas y respondemos consultas por WhatsApp. Gestión integral de la
              compra, trámites y traslado.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
