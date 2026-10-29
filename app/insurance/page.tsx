import type { Metadata } from "next";
import Image from "next/image";
import InsuranceQuote from "@/components/InsuranceQuote";
import { AllianceLockup } from "@/components/ParradoBand";
import {
  CAR_DISCOUNT,
  CAR_MAX_AGE_YEARS,
  HOME_DISCOUNT,
  PARRADO_SINCE,
  PILLARS,
  whatsappHref,
} from "@/lib/parrado";

const TITLE = "Seguros para embarcaciones con Parrado Seguros";
const DESCRIPTION = `Asegurá tu embarcación con Parrado Seguros, consultores en seguros desde ${PARRADO_SINCE}, y accedé a descuentos exclusivos: ${CAR_DISCOUNT}% en autos de hasta ${CAR_MAX_AGE_YEARS} años y ${HOME_DISCOUNT}% en hogar.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/insurance" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/insurance" },
};

export default async function Insurance({
  searchParams,
}: {
  searchParams: Promise<{ embarcacion?: string | string[] }>;
}) {
  // Product pages link here with the boat already named, so the quote starts filled in.
  const { embarcacion } = await searchParams;
  const initialBoat = (Array.isArray(embarcacion) ? embarcacion[0] : embarcacion)?.slice(0, 120) ?? "";

  return (
    <>
      <section className="pi-hero">
        <div className="container pi-hero-grid">
          <div className="pi-hero-text">
            <AllianceLockup tone="light" />
            <h1>Asegurá tu embarcación</h1>
            <p className="pi-lead">
              Con Parrado Seguros, consultores en seguros desde {PARRADO_SINCE}. Y como cliente
              de MG Náutica, con descuentos exclusivos en tu auto y tu hogar.
            </p>
            <div className="pi-hero-ctas">
              <a className="btn btn-primary btn-lg" href="#consulta">
                Armar mi consulta
              </a>
              <a
                className="btn btn-outline-white btn-lg"
                href={whatsappHref("Hola! Quiero consultar por el seguro de mi embarcación con Parrado Seguros.")}
                target="_blank"
                rel="noopener"
              >
                Consultar por WhatsApp
              </a>
            </div>
          </div>
          <figure className="pi-hero-media">
            <Image
              src="/site/hero-ocean.jpg"
              alt="Atardecer en el puerto visto desde la cubierta, con el salvavidas a mano"
              width={2000}
              height={1333}
              sizes="(max-width: 1024px) 100vw, 620px"
              priority
            />
          </figure>
        </div>
      </section>

      <section className="section pi-split">
        <div className="container">
          <div className="pi-split-head">
            <h2>En el mar y en tierra</h2>
            <p>
              Tu embarcación, siempre protegida. Y por asegurarla con nuestra aseguradora de
              confianza, descuentos en lo que te espera en tierra.
            </p>
          </div>
          <div className="pi-split-grid">
            <article className="pi-sea">
              <div className="pi-sea-media">
                <Image
                  src="/site/story-main.jpg"
                  alt="Velero clásico navegando cerca de la costa"
                  width={1600}
                  height={1200}
                  sizes="(max-width: 1024px) 100vw, 700px"
                />
              </div>
              <h3>Embarcaciones</h3>
              <p>
                Coberturas integrales para tu embarcación, con el asesoramiento de quienes
                conocen el mundo náutico y el de los seguros.
              </p>
            </article>
            <div className="pi-land">
              <article className="pi-offer">
                <p className="pi-offer-figure" aria-hidden="true">−{CAR_DISCOUNT}%</p>
                <h3>
                  Autos <span className="bl-sr">con {CAR_DISCOUNT}% de descuento</span>
                </h3>
                <p>Descuento en el seguro de autos de hasta {CAR_MAX_AGE_YEARS} años de antigüedad.</p>
              </article>
              <article className="pi-offer">
                <p className="pi-offer-figure" aria-hidden="true">−{HOME_DISCOUNT}%</p>
                <h3>
                  Hogar <span className="bl-sr">con {HOME_DISCOUNT}% de descuento</span>
                </h3>
                <p>Descuento en el seguro de tu casa.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-surface pi-since">
        <div className="container pi-since-grid">
          <div className="pi-since-media">
            <Image
              src="/site/nautical-documents.jpg"
              alt="Documentación náutica sobre una mesa de madera"
              width={1200}
              height={1600}
              sizes="(max-width: 1024px) 100vw, 440px"
            />
          </div>
          <div className="pi-since-text">
            <p className="pi-since-year" aria-hidden="true">{PARRADO_SINCE}</p>
            <h2>Parrado &amp; Asociados</h2>
            <p className="pi-since-lead">
              Consultores en seguros desde {PARRADO_SINCE}: casi seis décadas en el mercado. Por
              eso son la aseguradora que elegimos para nuestros clientes.
            </p>
            <dl className="pi-pillars">
              {PILLARS.map((p) => (
                <div key={p.title}>
                  <dt>{p.title}</dt>
                  <dd>{p.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="section pi-quote" id="consulta">
        <div className="container">
          <div className="pi-quote-head">
            <h2>Armá tu consulta</h2>
            <p>Elegí qué querés asegurar y te dejamos el mensaje listo para mandar por WhatsApp.</p>
          </div>
          <InsuranceQuote initialBoat={initialBoat} />
        </div>
      </section>
    </>
  );
}
