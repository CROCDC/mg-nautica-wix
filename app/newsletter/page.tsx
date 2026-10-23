import type { Metadata } from "next";
import NewsletterForm from "@/components/NewsletterForm";
import { parseModels } from "@/lib/boat-models";

export const metadata: Metadata = {
  title: "Newsletter y alertas por modelo",
  description:
    "Elegí los modelos de barco que buscás y dejanos tu email: MG Náutica te escribe apenas ingresa uno al catálogo.",
};

const WHATSAPP_URL =
  "https://wa.me/5491126949628?text=" +
  encodeURIComponent("Hola! Estoy buscando un modelo de barco en particular.");

const STEPS = [
  {
    title: "Elegí tus modelos",
    body: "Buscalos por nombre o recorré la lista completa. Podés seguir todos los que quieras.",
  },
  { title: "Dejanos tu email", body: "Es lo único que te pedimos." },
  {
    title: "Te avisamos",
    body: "Cuando ingresa al catálogo uno de tus modelos, te escribimos con la publicación.",
  },
];

// `?modelo=plenamar` (repeatable) arrives already picked — the home page's model links
// land here. Unknown slugs are dropped, like any other junk parameter.
export default async function Newsletter({
  searchParams,
}: {
  searchParams: Promise<{ modelo?: string | string[] }>;
}) {
  const { modelo } = await searchParams;
  const initial = parseModels([modelo ?? []].flat()).map((m) => m.slug);

  return (
    <>
      <div className="page-banner">
        <div className="container">
          <span className="section-eyebrow">Newsletter</span>
          <h1>Alertas por modelo</h1>
          <p>Elegí los modelos que buscás y te escribimos apenas ingrese uno al catálogo.</p>
        </div>
      </div>

      <section className="section">
        <div className="container nl-layout">
          {/* Keyed so arriving with a different ?modelo= starts from that pick. */}
          <NewsletterForm key={initial.join(",")} initialModels={initial} />

          <aside className="nl-aside">
            <h2>Cómo funciona</h2>
            <ol className="step-list">
              {STEPS.map((s) => (
                <li key={s.title}>
                  <div>
                    <strong>{s.title}</strong>
                    <p>{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="nl-note">
              <p>
                <strong>Sin spam.</strong> Solo embarcaciones y novedades de MG Náutica.
              </p>
              <p>
                ¿Buscás algo muy puntual?{" "}
                <a href={WHATSAPP_URL} target="_blank" rel="noopener">
                  Escribinos por WhatsApp
                </a>
                .
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
