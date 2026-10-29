import Image from "next/image";
import Link from "next/link";
import { CAR_DISCOUNT, CAR_MAX_AGE_YEARS, HOME_DISCOUNT, PARRADO_LOGO } from "@/lib/parrado";

/** MG Náutica and Parrado side by side, as in the joint campaign. */
export function AllianceLockup({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const logo = tone === "light" ? PARRADO_LOGO.light : PARRADO_LOGO.color;
  return (
    <div className={`pa-lockup pa-lockup-${tone}`}>
      <span className="pa-lockup-mg">
        <Image src="/site/logo-mg-nautica.png" alt="" width={70} height={40} />
        MG <span>Náutica</span>
      </span>
      <span className="pa-lockup-x" aria-hidden="true">×</span>
      <Image
        src={logo.src}
        alt={PARRADO_LOGO.alt}
        width={logo.width}
        height={logo.height}
        className="pa-lockup-parrado"
      />
    </div>
  );
}

/** A one-line mention of the insurer, for pages where the alliance is not the subject. */
export function ParradoMention() {
  return (
    <div className="pa-mention">
      <Image
        src={PARRADO_LOGO.color.src}
        alt={PARRADO_LOGO.alt}
        width={PARRADO_LOGO.color.width}
        height={PARRADO_LOGO.color.height}
      />
      <p>
        <strong>Aseguradora aliada.</strong> Asegurá tu embarcación con Parrado Seguros y accedé a
        descuentos de {CAR_DISCOUNT}% en tu auto y {HOME_DISCOUNT}% en tu hogar.
      </p>
      <Link href="/insurance">Ver beneficios</Link>
    </div>
  );
}

// The alliance as it appears on the services page: the boat (sea) next to the
// two discounts on land, pointing at /insurance for the details.
export default function ParradoBand({ id }: { id?: string }) {
  return (
    <section className="section pa-band" id={id}>
      <div className="container pa-band-grid">
        <div className="pa-band-media">
          <Image
            src="/site/founders-1.jpg"
            alt="Velero amarrado en el puerto"
            width={2000}
            height={1125}
            sizes="(max-width: 1024px) 100vw, 560px"
          />
        </div>
        <div className="pa-band-text">
          <AllianceLockup />
          <h2>Tu aliado en el mar y en tierra</h2>
          <p>
            Asegurá tu embarcación con Parrado Seguros, nuestra aseguradora de confianza, y
            accedé a descuentos exclusivos en tu auto y tu hogar.
          </p>
          <dl className="pa-figures">
            <div>
              <dt>Embarcaciones</dt>
              <dd className="pa-figure-word">Protegida</dd>
            </div>
            <div>
              <dt>Autos de hasta {CAR_MAX_AGE_YEARS} años</dt>
              <dd>−{CAR_DISCOUNT}%</dd>
            </div>
            <div>
              <dt>Hogar</dt>
              <dd>−{HOME_DISCOUNT}%</dd>
            </div>
          </dl>
          <div className="pa-band-ctas">
            <Link className="btn btn-navy btn-lg" href="/insurance">
              Ver los beneficios
            </Link>
            <Link className="btn btn-outline btn-lg" href="/insurance#consulta">
              Armar mi consulta
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
