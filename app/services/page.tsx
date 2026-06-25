import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Gestión de corretaje, mantenimiento técnico, traslados y asesoría integral en Argentina y Uruguay.",
};

const WHATSAPP_URL = "https://wa.me/5491126949628";

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
