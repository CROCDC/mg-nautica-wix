import Link from "next/link";
import Image from "next/image";

const WHATSAPP_URL = "https://wa.me/5491126949628";

export default function Home() {
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
                {/* Placeholder count — wired to the live Wix product count in Phase 2. */}
                <div className="hero-stat-num" data-count="60" data-suffix="+">
                  0+
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
    </>
  );
}
