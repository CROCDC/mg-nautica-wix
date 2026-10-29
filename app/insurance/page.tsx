import type { Metadata } from "next";
import Image from "next/image";
import InsuranceQuote from "@/components/InsuranceQuote";
import RingCrossfade from "@/components/RingCrossfade";
import {
  CAR_DISCOUNT,
  CAR_MAX_AGE_YEARS,
  HOME_DISCOUNT,
  PARRADO_LOGO,
  PARRADO_SINCE,
  PILLARS,
  whatsappHref,
} from "@/lib/parrado";

const TITLE = "Seguros para embarcaciones con Parrado Seguros";
const DESCRIPTION = `Asegurá tu embarcación con Parrado & Asociados, consultores en seguros desde ${PARRADO_SINCE}, y accedé a descuentos exclusivos: ${CAR_DISCOUNT}% en autos de hasta ${CAR_MAX_AGE_YEARS} años y ${HOME_DISCOUNT}% en hogar.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/insurance" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/insurance" },
};

const HERO_PHOTOS = [
  {
    src: "/site/hero-ocean.jpg",
    alt: "Atardecer en el puerto visto desde la cubierta, con el salvavidas a mano",
    width: 2000,
    height: 1333,
  },
  { src: "/site/story-main.jpg", alt: "Velero clásico navegando cerca de la costa", width: 1600, height: 1200 },
  { src: "/site/founders-1.jpg", alt: "Velero amarrado en el puerto", width: 2000, height: 1125 },
];

const FIGURES = [
  { value: `${CAR_DISCOUNT}%`, label: `en el seguro de tu auto, si tiene hasta ${CAR_MAX_AGE_YEARS} años` },
  { value: `${HOME_DISCOUNT}%`, label: "en el seguro de tu casa" },
  { value: String(PARRADO_SINCE), label: "el año desde el que Parrado asesora en seguros" },
];

const CONTACT_MESSAGE = "Hola! Quiero consultar por el seguro de mi embarcación con Parrado Seguros.";

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
      <section className="ps-hero">
        <div className="ps-ring">
          <RingCrossfade photos={HERO_PHOTOS} />
        </div>
        <div className="container ps-hero-inner">
          <div className="ps-hero-text">
            <h1>Tu embarcación, siempre protegida</h1>
            <p className="ps-lead">
              Asegurala con Parrado &amp; Asociados, consultores en seguros desde {PARRADO_SINCE}, y
              accedé a descuentos exclusivos en tu auto y tu hogar.
            </p>
            <div className="ps-hero-actions">
              <a className="ps-btn" href="#consulta">
                Armar mi consulta
              </a>
              <a className="ps-link" href={whatsappHref(CONTACT_MESSAGE)} target="_blank" rel="noopener">
                o escribinos por WhatsApp
              </a>
            </div>
            <div className="ps-partners">
              <span className="ps-partners-mg">
                <Image src="/site/logo-mg-nautica.png" alt="" width={70} height={40} />
                MG <span>Náutica</span>
              </span>
              <span className="ps-partners-x" aria-hidden="true">×</span>
              <Image
                src={PARRADO_LOGO.color.src}
                alt={PARRADO_LOGO.alt}
                width={PARRADO_LOGO.color.width}
                height={PARRADO_LOGO.color.height}
                className="ps-partners-parrado"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="ps-band">
        <div className="container">
          <div className="ps-band-head">
            <h2>Del amarre a tu casa</h2>
            <p>
              Asegurás tu embarcación con nuestra aseguradora de confianza y el beneficio sigue en
              tierra: descuentos exclusivos en el seguro de tu auto y de tu casa.
            </p>
          </div>
          <ul className="ps-figures">
            {FIGURES.map((f) => (
              <li key={f.value}>
                <span className="ps-disc">{f.value}</span>
                <span className="ps-figure-label">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section ps-quote-section" id="consulta">
        <div className="container">
          <div className="ps-split-head">
            <h2>Armá tu consulta</h2>
            <p>
              Abrí cada panel y sumá lo que quieras asegurar. Te dejamos el mensaje listo para
              mandar por WhatsApp.
            </p>
          </div>
          <InsuranceQuote initialBoat={initialBoat} />
        </div>
      </section>

      <section className="ps-about">
        <div className="ps-about-panel">
          <div className="ps-about-main">
            <h2>Parrado, desde {PARRADO_SINCE}</h2>
            <div className="ps-about-photo">
              <Image
                src="/site/nautical-documents.jpg"
                alt="Documentación náutica sobre una mesa de madera"
                width={1200}
                height={1600}
                sizes="(max-width: 768px) 86vw, 38vw"
              />
            </div>
          </div>
          <div className="ps-about-side">
            <p className="ps-about-lead">
              Parrado &amp; Asociados, consultores en seguros: casi seis décadas en el mercado. Por
              eso son la aseguradora que elegimos para nuestros clientes.
            </p>
            <dl className="ps-pillars">
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

      <section className="ps-close">
        <div className="ps-tiles">
          <div className="ps-tile ps-tile-photo">
            <Image
              src="/site/founders-2.jpg"
              alt="Gaby y Nacho, fundadores de MG Náutica"
              width={1600}
              height={1200}
              sizes="(max-width: 768px) 50vw, 20vw"
            />
          </div>
          <div className="ps-tile ps-tile-main">
            <h2>Hablemos de tu seguro</h2>
            <p>
              Te respondemos nosotros, por WhatsApp, al +54&nbsp;9&nbsp;11&nbsp;2694-9628. Sin
              formularios.
            </p>
            <a className="ps-btn ps-btn-navy" href={whatsappHref(CONTACT_MESSAGE)} target="_blank" rel="noopener">
              Escribinos por WhatsApp
            </a>
          </div>
          <div className="ps-tile ps-tile-flat" aria-hidden="true" />
        </div>
      </section>
    </>
  );
}
