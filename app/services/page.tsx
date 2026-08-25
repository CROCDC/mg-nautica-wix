import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Gestión de corretaje, trámite AIS (alta ISMM / MMSI ante ENACOM), mantenimiento técnico, traslados y asesoría integral en Argentina y Uruguay.",
};

const WHATSAPP_URL = "https://wa.me/5491126949628";
const AIS_WHATSAPP_URL =
  "https://wa.me/5491126949628?text=" +
  encodeURIComponent("Hola! Quiero hacer el trámite de AIS (alta ISMM / MMSI). ¿Me asesoran?");

// Alta ISMM / MMSI ante ENACOM: lo que resolvemos en el trámite, tal como se comunica
// en la campaña impresa.
const AIS_STEPS = [
  "Gestión completa de alta ISMM / MMSI ante ENACOM",
  "Alta y carga de todos los equipos: VHF, AIS, GPS, EPIRB, etc.",
  "Asesoramiento personalizado y paso a paso",
  "Carga correcta de datos técnicos y documentación",
  "Seguimiento del trámite hasta su aprobación",
  "Ahorro de tiempo, sin errores ni rechazos",
];

const AIS_PILLARS = [
  { icon: "⚓", title: "Experiencia", body: "en trámites náuticos" },
  { icon: "🛡️", title: "Seguridad", body: "y confianza garantizada" },
  { icon: "⏱️", title: "Rapidez", body: "y eficiencia en cada paso" },
  { icon: "🎧", title: "Atención", body: "personalizada siempre" },
];

const SERVICES = [
  {
    icon: "⚓",
    title: "Gestión de corretaje",
    body: "Compra y venta con asesoramiento experto y brokers especializados en cada región. Valuación precisa y acompañamiento durante todo el proceso.",
  },
  {
    icon: "🔧",
    title: "Mantenimiento técnico",
    body: "Cuidado artesanal y mantenimiento periódico para mantener tu embarcación en condiciones óptimas. Trabajamos con talleres y técnicos de confianza.",
  },
  {
    icon: "🗺️",
    title: "Traslados y logística",
    body: "Traslados nacionales e internacionales con capitanes certificados. Coordinación completa de ruta, puertos y documentación.",
  },
  {
    icon: "📋",
    title: "Trámites y gestión",
    body: "Gestión de matrículas, seguros y habilitaciones ante PNA, ARBA y AGIP. Asesoramiento desde el primer día hasta la transferencia definitiva.",
  },
  {
    icon: "📡",
    title: "Trámite AIS · ISMM / MMSI",
    body: "Alta ISMM / MMSI ante ENACOM y carga de todos tus equipos: VHF, AIS, GPS, EPIRB. Gestionamos el trámite completo hasta su aprobación.",
  },
  {
    icon: "🌊",
    title: "Asesoría de fondeo y amarre",
    body: "Recomendaciones de puertos, marinas y fondeaderos en Argentina, Uruguay y el exterior. Gestión de arañas y lugares de guarda.",
  },
  {
    icon: "📸",
    title: "Marketing y publicación",
    body: "Fotografía profesional, descripción técnica y publicación en canales de mayor alcance náutico para maximizar la exposición de tu embarcación.",
  },
];

export default function Services() {
  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">Lo que hacemos</span>
            <h1>Nuestros servicios</h1>
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
        </div>
      </section>

      <section className="section section-surface" id="ais">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">Trámites ISMM / MMSI</span>
            <h2>¿Querés tener tu AIS?</h2>
            <p>
              Para navegar con seguridad. Rápido, simple y sin complicaciones: nos ocupamos de
              todo el trámite ante ENACOM y vos solo disfrutá del mar.
            </p>
          </div>

          <div className="content-2col">
            <div className="doc-card">
              <h3>🧭 ¿Qué hacemos por vos?</h3>
              <ul className="doc-list">
                {AIS_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>

            <div>
              <span
                className="section-eyebrow"
                style={{ textAlign: "left", display: "block", marginBottom: "1.25rem" }}
              >
                Servicio integral de gestoría náutica
              </span>
              <div className="coverage-grid" style={{ marginTop: 0 }}>
                {AIS_PILLARS.map((p) => (
                  <div className="coverage-card" key={p.title}>
                    <h3>
                      {p.icon} {p.title}
                    </h3>
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: ".9rem" }}>{p.body}</p>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                <a
                  className="btn btn-primary btn-lg"
                  href={AIS_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener"
                >
                  💬 Consultar por mi AIS
                </a>
                <p style={{ marginTop: ".75rem", color: "var(--muted)", fontSize: ".9rem" }}>
                  Navegá tranquilo, nos encargamos de todo el trámite.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <h2>¿Necesitás más información?</h2>
        <p>Hablá con nosotros y te asesoramos sin compromiso.</p>
        <div className="cta-row">
          <a className="btn btn-primary btn-lg" href={WHATSAPP_URL} target="_blank" rel="noopener">
            💬 WhatsApp
          </a>
          <Link className="btn btn-outline-white btn-lg" href="/contact">
            Formulario de contacto
          </Link>
        </div>
      </section>
    </>
  );
}
