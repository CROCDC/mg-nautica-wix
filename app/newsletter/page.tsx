import type { Metadata } from "next";
import NewsletterForm from "@/components/NewsletterForm";
import { parseModels } from "@/lib/boat-models";

export const metadata: Metadata = {
  title: "Newsletter y alertas por modelo",
  description:
    "Elegí los modelos de barco que buscás y dejanos tu email: MG Náutica te escribe apenas ingresa uno al catálogo.",
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
          <span className="section-eyebrow">Newsletter</span>
          <h1>Alertas por modelo</h1>
          <p>Elegí los barcos que buscás y te escribimos apenas ingrese uno al catálogo.</p>
        </div>
      </div>

      <section className="section">
        <div className="container nl-wrap">
          {/* Keyed so arriving with a different ?modelo= starts from that pick. */}
          <NewsletterForm key={initial.join(",")} initialModels={initial} />
        </div>
      </section>
    </>
  );
}
