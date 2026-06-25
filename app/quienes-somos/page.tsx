import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description:
    "Conocé la historia de Gaby y Nacho, fundadores de MG Náutica y creadores de @abordodelthalia.",
};

const WHATSAPP_URL = "https://wa.me/5491126949628";

const REGIONAL = [
  { name: "Sergio Ricci", area: "Buenos Aires Zona Norte y CABA" },
  { name: "Neil Skellorn", area: "Buenos Aires Zona Sur" },
  { name: "Rodrigo", area: "Montevideo y Punta del Este" },
  { name: "Víctor", area: "Piriápolis" },
];

export default function QuienesSomos() {
  return (
    <>
      <div className="page-banner">
        <div className="container">
          <span className="section-eyebrow">Nuestra historia</span>
          <h1>Quiénes somos</h1>
          <p>
            Más que un broker: somos navegantes que eligieron vivir en el mar y hoy acompañamos
            a otros a hacer lo mismo.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="content-2col">
            <div>
              <span
                className="section-eyebrow"
                style={{ textAlign: "left", display: "block", marginBottom: "1rem" }}
              >
                La historia
              </span>
              <p className="about-story">
                <strong>Gaby y Nacho</strong> son los fundadores de MG Náutica y creadores de{" "}
                <strong>@abordodelthalia</strong>. Su transformación comenzó hace más de diez
                años cuando encontraron un cartel de venta de un velero llamado Ibicuy. Sin
                presupuesto pero con mucha entrega, vendieron lo que tenían para firmar los papeles.
              </p>
              <p className="about-story" style={{ marginTop: "1rem" }}>
                Desde hace más de cinco años viven a bordo del <strong>Thalia</strong>, un
                motovelero clásico de lapacho, año 1930, diseño Parodi. <strong>Nacho</strong> es
                instructor de timonel y kitesurf. <strong>Gaby</strong> es gestora náutica de
                tradición familiar.
              </p>
              <p className="about-story" style={{ marginTop: "1rem" }}>
                Hoy, MG Náutica es una <strong>gestoría y brokería profesional</strong> con
                presencia en ambos márgenes del Río de la Plata, ofreciendo un servicio integral
                desde la valuación hasta la transferencia.
              </p>
            </div>
            <div className="photo-collage">
              <div className="photo-collage-main">
                <Image src="/site/founders-1.jpg" alt="Gaby y Nacho" width={800} height={600} />
              </div>
              <div className="photo-collage-sub">
                <Image src="/site/story-main.jpg" alt="Navegando un sueño" width={400} height={300} />
              </div>
              <div className="photo-collage-sub">
                <Image src="/site/thalia.jpg" alt="Motovelero Thalia" width={400} height={300} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-surface">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">Cobertura</span>
            <h2>Dónde estamos</h2>
            <p>Presencia en ambos márgenes del Río de la Plata.</p>
          </div>
          <div className="coverage-grid" style={{ maxWidth: "720px", margin: "0 auto" }}>
            <div className="coverage-card">
              <h3>🇦🇷 Argentina</h3>
              <ul>
                <li>CABA</li>
                <li>Buenos Aires Zona Norte</li>
                <li>Buenos Aires Zona Sur</li>
                <li>Quilmes · La Plata</li>
                <li>Rosario</li>
              </ul>
            </div>
            <div className="coverage-card">
              <h3>🇺🇾 Uruguay</h3>
              <ul>
                <li>Montevideo</li>
                <li>Punta del Este</li>
                <li>Piriápolis</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-surface">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">El equipo</span>
            <h2>Contactos regionales</h2>
          </div>
          <div className="services-grid">
            {REGIONAL.map((r) => (
              <div className="service-card" key={r.name}>
                <div className="service-icon">⚓</div>
                <h3>{r.name}</h3>
                <p>{r.area}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <h2>¿Querés trabajar con nosotros?</h2>
        <p>Contactanos por WhatsApp y te contamos cómo sumarte al equipo.</p>
        <div className="cta-row">
          <a className="btn btn-primary btn-lg" href={WHATSAPP_URL} target="_blank" rel="noopener">
            💬 WhatsApp
          </a>
          <Link className="btn btn-outline-white btn-lg" href="/contacto">
            Ver todos los contactos
          </Link>
        </div>
      </section>
    </>
  );
}
