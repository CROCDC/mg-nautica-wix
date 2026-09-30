import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { wixImageUrl } from "@/lib/wix-image";
import HeroVideo from "@/components/HeroVideo";
import PhotoGrid from "@/components/PhotoGrid";
import {
  EQUIPMENT,
  FEATURE_ROWS,
  GALLERY,
  HIGHLIGHTS,
  KEY_STATS,
  PHOTOS,
  SPECS,
  THALIA_PRICE_USD,
  THALIA_PRODUCT_SLUG,
  THALIA_VIDEO_URL,
  THALIA_WHATSAPP_URL,
  TIMELINE,
} from "./thalia";

const TITLE = "Thalia — Motovelero clásico de madera de 1931";
const DESCRIPTION =
  "Thalia, motovelero clásico de madera de 1931 con aparejo cutter, refit integral y cubierta de teca. 10,05 m de eslora, motor Volvo Penta 43 HP. En venta con MG Náutica.";

// Absolute on purpose: Meta's bot rejects relative og:image URLs (see app/layout.tsx).
const OG_IMAGE = wixImageUrl(PHOTOS.aerial, 1200, 630, { q: 82 });

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/thalia" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/thalia",
    images: [
      {
        url: OG_IMAGE,
        secureUrl: OG_IMAGE,
        type: "image/jpeg",
        width: 1200,
        height: 630,
        alt: PHOTOS.aerial.alt,
      },
    ],
  },
};

const PRICE = "US$ " + THALIA_PRICE_USD.toLocaleString("en-US");
const LISTING_PATH = `/product-page/${encodeURIComponent(THALIA_PRODUCT_SLUG)}`;

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Thalia — Motovelero clásico de madera (1931)",
  description: DESCRIPTION,
  image: GALLERY.map((img) => wixImageUrl(img, 1200, 800, { mode: "fit" })),
  offers: {
    "@type": "Offer",
    price: THALIA_PRICE_USD,
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: "https://mgnauticabroker.com/thalia",
    seller: { "@type": "Organization", name: "MG Náutica" },
  },
};

export default function ThaliaLanding() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      {/* Hero */}
      <section className="bl-hero">
        <div className="bl-hero-media">
          <Image
            src={wixImageUrl(PHOTOS.aerialTender, 1600, 900, { q: 80 })}
            alt={PHOTOS.aerialTender.alt}
            fill
            priority
            unoptimized
            sizes="100vw"
          />
          <HeroVideo src={THALIA_VIDEO_URL} />
        </div>
        <div className="bl-hero-inner">
          <div className="hero-text bl-hero-text">
            <span className="hero-eyebrow">Motovelero clásico de madera · 1931</span>
            <h1>Thalia</h1>
            <p className="hero-lead">
              Un clásico con historia, navegación y alma. Casi un siglo a flote, con refit
              integral y listo para seguir sumando millas.
            </p>
            <div className="bl-hero-price">
              <span className="bl-hero-price-label">Precio</span>
              <span className="bl-hero-price-value">{PRICE}</span>
            </div>
            <div className="hero-ctas">
              <a className="btn btn-primary btn-lg" href={THALIA_WHATSAPP_URL} target="_blank" rel="noopener">
                💬 Consultar por WhatsApp
              </a>
              <a className="btn btn-glass btn-lg" href="#galeria">
                Ver fotos
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Key stats */}
      <section className="bl-stats" aria-label="Datos principales">
        <div className="container">
          <dl className="bl-stats-grid">
            {KEY_STATS.map((s) => (
              <div className="bl-stat" key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Story */}
      <section className="section">
        <div className="container">
          <div className="content-2col bl-story">
            <div>
              <span className="section-eyebrow">Su historia</span>
              <h2 className="bl-h2">Casi un siglo navegando</h2>
              <p className="bl-text">
                Thalia es un <strong>motovelero clásico de madera de 1931</strong>, de construcción
                completa, quilla corrida y aparejo cutter. Conserva el encanto y la calidez propios
                de un barco clásico y, además, recibió un importante refit y numerosas mejoras
                durante los últimos años.
              </p>
              <p className="bl-text">
                Sus actuales dueños lo adquirieron en 2021 y desde entonces fue mucho más que un
                velero: fue su casa y su compañero de travesías, con una{" "}
                <strong>media aproximada de 6 nudos</strong>.
              </p>
              <blockquote className="bl-quote">
                <p>
                  “Después de años siendo nuestra casa, buscamos un nuevo capitán que comprenda lo
                  que significa tener una embarcación así, que la cuide, la disfrute y continúe
                  escribiendo su historia.”
                </p>
              </blockquote>
            </div>
            <div className="bl-story-media">
              <Image
                src={wixImageUrl(PHOTOS.sunset, 800, 1000, { q: 80 })}
                alt={PHOTOS.sunset.alt}
                width={800}
                height={1000}
                unoptimized
                sizes="(max-width: 1024px) 100vw, 560px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="section section-surface">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">Por qué es único</span>
            <h2>Un clásico que sigue navegando</h2>
            <p>Historia, mantenimiento y equipamiento para disfrutarlo desde el primer día.</p>
          </div>
          <div className="services-grid">
            {HIGHLIGHTS.map((h) => (
              <div className="service-card" key={h.title}>
                <div className="service-icon" aria-hidden="true">
                  {h.icon}
                </div>
                <h3>{h.title}</h3>
                <p>{h.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="section" id="galeria">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">Galería</span>
            <h2>Thalia en fotos</h2>
            <p>Tocá cualquier foto para verla en grande.</p>
          </div>
          <PhotoGrid images={GALLERY} />
        </div>
      </section>

      {/* Technical sheet */}
      <section className="section section-surface" id="ficha-tecnica">
        <div className="container">
          <div className="content-2col">
            <div>
              <span className="section-eyebrow">Ficha técnica</span>
              <h2 className="bl-h2">Características principales</h2>
              <dl className="bl-spec-table">
                {SPECS.map((s) => (
                  <div className="bl-spec-row" key={s.label}>
                    <dt>{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <figure className="bl-figure">
              <Image
                src={wixImageUrl(PHOTOS.hull, 1000, 467, { q: 80 })}
                alt={PHOTOS.hull.alt}
                width={1000}
                height={467}
                unoptimized
                sizes="(max-width: 1024px) 100vw, 560px"
              />
              <figcaption>Quilla corrida y casco de madera, fotografiado en varadero.</figcaption>
              <Image
                src={wixImageUrl(PHOTOS.calm, 1000, 800, { q: 80 })}
                alt={PHOTOS.calm.alt}
                width={1000}
                height={800}
                unoptimized
                sizes="(max-width: 1024px) 100vw, 560px"
              />
            </figure>
          </div>
        </div>
      </section>

      {/* Feature rows */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">Equipamiento</span>
            <h2>Listo para salir a navegar</h2>
            <p>Todo lo que viene a bordo, área por área.</p>
          </div>
          <div className="bl-features">
            {FEATURE_ROWS.map((f) => (
              <article className="bl-feature" key={f.title}>
                <div className="bl-feature-media">
                  <Image
                    src={wixImageUrl(f.image, 900, 700, { q: 80 })}
                    alt={f.image.alt}
                    width={900}
                    height={700}
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 600px"
                  />
                </div>
                <div className="bl-feature-body">
                  <span className="section-eyebrow">{f.eyebrow}</span>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                  <ul className="bl-check-list">
                    {f.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          <div className="bl-equip-grid">
            {EQUIPMENT.map((e) => (
              <div className="bl-equip-card" key={e.title}>
                <h3>
                  <span aria-hidden="true">{e.icon}</span> {e.title}
                </h3>
                <ul className="bl-check-list">
                  {e.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section section-dark">
        <div className="container">
          <div className="section-head bl-head-dark">
            <span className="section-eyebrow">Línea de tiempo</span>
            <h2>De 1931 a hoy</h2>
            <p>Cada etapa dejó a Thalia mejor preparado para seguir navegando.</p>
          </div>
          <ol className="bl-timeline">
            {TIMELINE.map((t) => (
              <li key={t.year}>
                <span className="bl-timeline-year">{t.year}</span>
                <h3>{t.title}</h3>
                <p>{t.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Current state */}
      <section className="section">
        <div className="container">
          <div className="content-2col">
            <div>
              <span className="section-eyebrow">Estado actual</span>
              <h2 className="bl-h2">Navegando, con la pintura ya comprada</h2>
              <p className="bl-text">
                Thalia se encuentra <strong>navegando</strong>. El principal trabajo pendiente es
                volver a pintarlo, y las pinturas necesarias{" "}
                <strong>ya fueron adquiridas y se entregan junto con la embarcación</strong>.
              </p>
              <div className="bl-note">
                Se trata de un barco clásico de madera de 1931: requiere el mantenimiento y los
                cuidados propios de una embarcación de estas características.
              </div>
              <div className="bl-actions">
                <a className="btn btn-primary btn-lg" href={THALIA_WHATSAPP_URL} target="_blank" rel="noopener">
                  💬 Coordinar una visita
                </a>
                <Link className="btn btn-outline btn-lg" href={LISTING_PATH}>
                  Ver publicación
                </Link>
              </div>
            </div>
            <div className="bl-poster">
              <Image
                src={wixImageUrl(PHOTOS.poster, 800, 1200, { mode: "fit", q: 85 })}
                alt={PHOTOS.poster.alt}
                width={800}
                height={1200}
                unoptimized
                sizes="(max-width: 1024px) 100vw, 420px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-band">
        <h2>¿Querés ser el próximo capitán de Thalia?</h2>
        <p>Escribinos y coordinamos una visita. Nos ocupamos de la gestión integral de la compra y los trámites.</p>
        <div className="cta-row">
          <a className="btn btn-primary btn-lg" href={THALIA_WHATSAPP_URL} target="_blank" rel="noopener">
            💬 Hablar por WhatsApp
          </a>
          <Link className="btn btn-outline-white btn-lg" href="/contact">
            Otras formas de contacto
          </Link>
        </div>
      </section>
    </>
  );
}
