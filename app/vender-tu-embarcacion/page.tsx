import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Vendé tu embarcación",
  description:
    "Vendé tu embarcación con MG Náutica. Gestionamos cada paso con transparencia y documentación completa.",
};

const WHATSAPP_URL =
  "https://wa.me/5491126949628?text=" +
  encodeURIComponent("Hola! Quiero vender mi embarcación. ¿Podemos coordinar una valuación?");

const STEPS = [
  {
    title: "Valuación y presentación",
    body: "Revisamos tu embarcación en detalle y la presentamos de forma impecable con fotos profesionales y descripción técnica.",
  },
  {
    title: "Difusión estratégica",
    body: "Publicamos en portales náuticos de Argentina, Uruguay y mercados internacionales para maximizar la exposición.",
  },
  {
    title: "Negociación y cierre",
    body: "Gestionamos consultas, visitas y negociación con potenciales compradores siempre en tu nombre.",
  },
  {
    title: "Documentación y transferencia",
    body: "Soporte técnico y administrativo completo hasta la transferencia definitiva ante PNA, ARBA o AGIP.",
  },
];

export default function VenderTuEmbarcacion() {
  return (
    <>
      <div className="page-banner">
        <div className="container">
          <span className="section-eyebrow">Confiá en los expertos</span>
          <h1>Vendé tu embarcación</h1>
          <p>
            Nos ocupamos de cada paso con transparencia y documentación completa, desde la
            valuación hasta la transferencia.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="content-2col">
            <div>
              <span
                className="section-eyebrow"
                style={{ textAlign: "left", display: "block", marginBottom: "1.25rem" }}
              >
                Cómo trabajamos
              </span>
              <ol className="step-list">
                {STEPS.map((s) => (
                  <li key={s.title}>
                    <div>
                      <strong>{s.title}</strong>
                      <p style={{ margin: ".25rem 0 0", color: "var(--muted)", fontSize: ".9rem" }}>
                        {s.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <span
                className="section-eyebrow"
                style={{ textAlign: "left", display: "block", marginBottom: "1.25rem" }}
              >
                Documentación requerida
              </span>
              <div className="doc-hero">
                <Image
                  src="/site/documentacion-nautica.jpg"
                  alt="Documentación náutica"
                  width={800}
                  height={500}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.25rem" }}>
                <div className="doc-card">
                  <h3>📋 Técnica</h3>
                  <ul className="doc-list">
                    <li>Matrícula y certificado de navegabilidad</li>
                    <li>Inventario de a bordo</li>
                    <li>Verificación de titularidad</li>
                    <li>Historial de mejoras y mantenimiento</li>
                  </ul>
                </div>
                <div className="doc-card">
                  <h3>🗂️ Administrativa</h3>
                  <ul className="doc-list">
                    <li>Título de propiedad</li>
                    <li>ARBA / AGIP / PNA al día</li>
                    <li>Seguro vigente de la unidad</li>
                    <li>Autorizaciones de venta si aplica</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-surface">
        <div className="container" style={{ maxWidth: "640px" }}>
          <div className="section-head">
            <span className="section-eyebrow">Primer contacto</span>
            <h2>Coordiná una valuación</h2>
            <p>
              Escribinos por WhatsApp con los datos de tu embarcación (marca, modelo, año, eslora,
              estado general) y coordinamos una visita y valuación sin compromiso.
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <a className="btn btn-primary btn-lg" href={WHATSAPP_URL} target="_blank" rel="noopener">
              💬 Consultar por WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
