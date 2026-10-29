import type { Metadata } from "next";
import NewsletterForm from "@/components/NewsletterForm";
import { parseModels } from "@/lib/boat-models";

export const metadata: Metadata = {
  title: "Newsletter y alertas por modelo",
  description:
    "Elegí los modelos de barco que buscás y dejanos tu email: MG Náutica te avisa cuando publica uno en el catálogo.",
};

// `?modelo=plenamar` (repeatable) arrives already picked, so a link can open the form
// on a model. Unknown slugs are dropped, like any other junk parameter.
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
          <h1>Alertas por modelo</h1>
          <p>Elegí los modelos que buscás. Cuando publiquemos uno en el catálogo, te avisamos por email.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {/* Keyed so arriving with a different ?modelo= starts from that pick. */}
          <NewsletterForm key={initial.join(",")} initialModels={initial} register />
        </div>
      </section>
    </>
  );
}
