import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Curso Internacional de Vela — Brasil",
  description:
    "Cursos internacionales de vela en Brasil con MG Náutica. Formación práctica integral, experiencia real a bordo de un Beneteau 42.3 y certificación oficial.",
};

const WHATSAPP_URL =
  "https://wa.me/5491126949628?text=" +
  encodeURIComponent(
    "Hola! Quiero información sobre los cursos internacionales de vela en Brasil.",
  );

const FEATURES = [
  { icon: "⚓", text: "Formación práctica integral" },
  { icon: "⛵", text: "Experiencia real a bordo" },
  { icon: "📚", text: "Programas internacionales estructurados" },
  { icon: "🏅", text: "Certificación oficial" },
];

const PROGRAM = [
  {
    icon: "⛵",
    title: "Maniobras de Navegación",
    body: "Práctica intensiva de viradas, trasluchadas y control de velas en diversas condiciones de mar.",
  },
  {
    icon: "🛟",
    title: "Seguridad y Protocolos",
    body: "Gestión de emergencias, uso de equipo de seguridad y procedimientos de hombre al agua.",
  },
  {
    icon: "🧭",
    title: "Vida a Bordo",
    body: "Convivencia, estiba de víveres y mantenimiento básico del velero durante la travesía.",
  },
];

const LEVELS = ["Principiante", "Intermedio", "Avanzado", "Profesional"];

export default function BrazilCourse() {
  return (
    <>
      <div className="page-banner">
        <div className="container">
          <span className="section-eyebrow">Formación náutica internacional</span>
          <h1>Cursos Internacionales — Brasil</h1>
          <p>
            Se vienen nuevas oportunidades para aprender y crecer en el mar. Cursos de vela en
            Brasil, para dar tus primeros pasos o ganar autonomía navegando.
          </p>
        </div>
      </div>

      {/* Intro + featured poster */}
      <section className="section">
        <div className="container">
          <div className="content-2col">
            <div>
              <span
                className="section-eyebrow"
                style={{ textAlign: "left", display: "block", marginBottom: "1.25rem" }}
              >
                Una nueva oportunidad
              </span>
              <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
                En MG Náutica estamos acercando información sobre cursos internacionales de vela que
                se realizarán en Brasil, orientados tanto a quienes quieren dar sus primeros pasos
                como a quienes buscan perfeccionar sus conocimientos y ganar autonomía navegando.
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: ".75rem" }}>
                {FEATURES.map((f) => (
                  <li key={f.text} style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
                    <span style={{ fontSize: "1.4rem", lineHeight: 1 }} aria-hidden="true">
                      {f.icon}
                    </span>
                    <span style={{ fontWeight: 500 }}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginTop: "2rem" }}>
                <a className="btn btn-primary btn-lg" href={WHATSAPP_URL} target="_blank" rel="noopener">
                  💬 Solicitar información
                </a>
                <Link className="btn btn-outline btn-lg" href="/contact">
                  Formulario de contacto
                </Link>
              </div>
            </div>

            <div
              style={{
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                boxShadow: "var(--shadow-lg)",
                maxWidth: "380px",
                margin: "0 auto",
              }}
            >
              <Image
                src="/site/brazil-course-poster.jpg"
                alt="Pieza gráfica del curso internacional de vela en Brasil"
                width={1080}
                height={1920}
                style={{ width: "100%", height: "auto" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Detailed program */}
      <section className="section section-surface">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">El programa</span>
            <h2>Programa detallado del curso</h2>
            <p>Una formación completa que combina técnica, seguridad y vida real a bordo.</p>
          </div>
          <div className="services-grid">
            {PROGRAM.map((p) => (
              <div className="service-card" key={p.title}>
                <div className="service-icon">{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real experience */}
      <section className="section">
        <div className="container">
          <div className="content-2col">
            <div
              style={{
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                boxShadow: "var(--shadow)",
              }}
            >
              <Image
                src="/site/brazil-course-bow.jpg"
                alt="Persona navegando en la proa de un velero en Brasil"
                width={520}
                height={978}
                style={{ width: "100%", height: "auto" }}
              />
            </div>

            <div>
              <span
                className="section-eyebrow"
                style={{ textAlign: "left", display: "block", marginBottom: "1.25rem" }}
              >
                Experiencia real
              </span>
              <h2 style={{ marginBottom: ".75rem" }}>Para principiantes y expertos</h2>
              <p style={{ color: "var(--muted)" }}>
                Navegar en Brasil no es solo aprender técnica; es sumergirse en una cultura náutica
                vibrante. A bordo de un Beneteau 42.3, vivirás la libertad de la travesía real,
                ganando confianza y autonomía en cada salida.
              </p>
              <p style={{ fontWeight: 600, margin: "1.75rem 0 .75rem" }}>Niveles disponibles</p>
              <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                {LEVELS.map((level) => (
                  <span
                    key={level}
                    style={{
                      padding: ".4rem .9rem",
                      borderRadius: "999px",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      fontSize: ".9rem",
                      fontWeight: 500,
                      color: "var(--navy)",
                    }}
                  >
                    {level}
                  </span>
                ))}
              </div>

              <div
                style={{
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  boxShadow: "var(--shadow)",
                  marginTop: "2rem",
                }}
              >
                <Image
                  src="/site/brazil-course-onboard.jpg"
                  alt="Vida a bordo durante el curso de vela en Brasil"
                  width={932}
                  height={625}
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-band">
        <h2>¿Te sumás al próximo curso en Brasil?</h2>
        <p>Escribinos y te enviamos toda la información sobre fechas, niveles y cupos disponibles.</p>
        <div className="cta-row">
          <a className="btn btn-primary btn-lg" href={WHATSAPP_URL} target="_blank" rel="noopener">
            💬 Hablar por WhatsApp
          </a>
          <Link className="btn btn-outline-white btn-lg" href="/contact">
            Solicitar información
          </Link>
        </div>
      </section>
    </>
  );
}
