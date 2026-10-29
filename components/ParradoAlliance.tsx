import Image from "next/image";
import Link from "next/link";
import { CAR_DISCOUNT, CAR_MAX_AGE_YEARS, HOME_DISCOUNT, PARRADO_MARK, PARRADO_SINCE } from "@/lib/parrado";

function Mark({ size }: { size: number }) {
  return (
    <Image
      src={PARRADO_MARK.src}
      alt="Parrado & Asociados"
      width={PARRADO_MARK.width}
      height={PARRADO_MARK.height}
      className="ps-mark"
      style={{ width: size, height: size }}
    />
  );
}

/** A one-line mention of the insurer, for pages where the alliance is not the subject. */
export function ParradoMention() {
  return (
    <div className="ps-mention">
      <Mark size={56} />
      <p>
        <strong>Aseguradora aliada: Parrado &amp; Asociados.</strong> Asegurá tu embarcación y
        accedé a {CAR_DISCOUNT}% de descuento en tu auto y {HOME_DISCOUNT}% en tu hogar.
      </p>
      <Link className="ps-btn ps-btn-sm" href="/insurance">
        Conocé la alianza
      </Link>
    </div>
  );
}

/** The insurance section of the services page. */
export function ParradoServices() {
  return (
    <section className="section ps-services" id="seguros">
      <div className="container ps-services-grid">
        <div className="ps-services-photo">
          <Image
            src="/site/hero-ocean.jpg"
            alt="Atardecer en el puerto visto desde la cubierta, con el salvavidas a mano"
            width={2000}
            height={1333}
            sizes="(max-width: 1024px) 80vw, 460px"
          />
        </div>
        <div className="ps-services-text">
          <Mark size={64} />
          <h2>Seguros con Parrado &amp; Asociados</h2>
          <p>
            Nuestra aseguradora de confianza, consultores en seguros desde {PARRADO_SINCE}. Al
            asegurar tu embarcación con ellos accedés a descuentos exclusivos.
          </p>
          <ul className="ps-ring-list">
            <li>Tu embarcación, con coberturas integrales.</li>
            <li>
              {CAR_DISCOUNT}% en el seguro de autos de hasta {CAR_MAX_AGE_YEARS} años.
            </li>
            <li>{HOME_DISCOUNT}% en el seguro de tu casa.</li>
          </ul>
          <div className="ps-services-actions">
            <Link className="ps-btn" href="/insurance">
              Conocé la alianza
            </Link>
            <Link className="ps-link" href="/insurance#consulta">
              Armar mi consulta
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The insurance box under the price on a boat's page. */
export function ParradoSidebar({ href }: { href: string }) {
  return (
    <div className="sidebar-box ps-sidebar">
      <div className="ps-sidebar-head">
        <Mark size={48} />
        <p>
          <strong>Asegurala con Parrado &amp; Asociados</strong> y sumá {CAR_DISCOUNT}% de descuento
          en tu auto y {HOME_DISCOUNT}% en tu hogar.
        </p>
      </div>
      <Link className="ps-btn ps-btn-outline" href={href}>
        Cotizar el seguro
      </Link>
    </div>
  );
}
