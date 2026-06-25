import Link from "next/link";
import Image from "next/image";
import { getAllBoats, type Boat } from "@/lib/wix";
import BoatCard from "@/components/BoatCard";

export const revalidate = 600;

const WHATSAPP_URL = "https://wa.me/5491126949628";

const SERVICES = [
  { icon: "⚓", title: "Gestión de corretaje", body: "Compra y venta con asesoramiento experto y brokers especializados en cada región." },
  { icon: "🔧", title: "Mantenimiento técnico", body: "Cuidado artesanal y mantenimiento periódico para mantener tu embarcación en condiciones óptimas." },
  { icon: "🗺️", title: "Traslados y logística", body: "Traslados nacionales e internacionales con capitanes certificados." },
  { icon: "📋", title: "Asesoría integral", body: "Trámites, seguros, matrículas y gestión administrativa desde el primer día." },
];

export default async function Home() {
  let featured: Boat[] = [];
  let total = 0;
  try {
    const boats = await getAllBoats();
    total = boats.length;
    featured = boats.slice(0, 8);
  } catch {
    // No Wix client id at build time (e.g. CI) — render the hero without the live grid.
  }
  const countDisplay = total || 60;

  return (
    <>
      {/* Hero — ported from mg-nautica-web home.html */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <span className="hero-eyebrow">Argentina · Uruguay · El mundo</span>
            <h1>
              Su broker y gestor <em>naval</em>
            </h1>
            <p className="hero-lead">
              Más que barcos, conectamos personas con su próxima gran aventura en el océano.
              Corretaje, trámites y gestión integral en manos expertas.
            </p>
            <div className="hero-ctas">
              <Link className="btn btn-primary btn-lg" href="/category/all-products">
                Explorar embarcaciones
              </Link>
              <a
                className="btn btn-outline-white btn-lg"
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener"
              >
                Hablar con nosotros
              </a>
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-num" data-count={countDisplay} data-suffix="">
                  0
                </div>
                <div className="hero-stat-label">Embarcaciones disponibles</div>
              </div>
              <div>
                <div className="hero-stat-num">AR · UY · 🌎</div>
                <div className="hero-stat-label">Argentina, Uruguay y el mundo</div>
              </div>
              <div>
                <div className="hero-stat-num" data-count="10" data-suffix="+">
                  0+
                </div>
                <div className="hero-stat-label">Años de experiencia</div>
              </div>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-visual-img hero-visual-main">
              <Image
                src="/site/hero-ocean.jpg"
                alt="Navegando con MG Náutica"
                width={1200}
                height={800}
                priority
              />
            </div>
            <div className="hero-visual-img">
              <Image src="/site/founders-3.jpg" alt="Vida a bordo" width={600} height={400} />
            </div>
            <div className="hero-visual-img">
              <Image src="/site/thalia.jpg" alt="Motovelero Thalia" width={600} height={400} />
            </div>
          </div>
        </div>
      </section>

      {/* Featured boats — latest from Wix */}
      {featured.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="section-eyebrow">Catálogo</span>
              <h2>Últimos ingresos</h2>
              <p>Embarcaciones seleccionadas disponibles en Argentina, Uruguay y el exterior.</p>
            </div>
            <div className="boat-grid">
              {featured.map((boat) => (
                <BoatCard key={boat.id} boat={boat} />
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <Link className="btn btn-navy btn-lg" href="/category/all-products">
                Ver todas las embarcaciones
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      <section className="section section-surface">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">Lo que hacemos</span>
            <h2>Nuestros servicios</h2>
            <p>
              Gestión integral para que disfrutes de una navegación profesional y libre de
              preocupaciones.
            </p>
          </div>
          <div className="services-grid">
            {SERVICES.map((s) => (
              <div className="service-card" key={s.title}>
                <div className="service-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <Link className="btn btn-outline" href="/servicios">
              Ver todos los servicios
            </Link>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="cta-band">
        <h2>¿Querés vender tu embarcación?</h2>
        <p>Te acompañamos en cada paso: desde la valuación hasta la transferencia definitiva.</p>
        <div className="cta-row">
          <Link className="btn btn-primary btn-lg" href="/vender-tu-embarcacion">
            Gestión integral
          </Link>
          <a className="btn btn-outline-white btn-lg" href={WHATSAPP_URL} target="_blank" rel="noopener">
            💬 WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
