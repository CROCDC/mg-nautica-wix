import type { Metadata } from "next";
import NewsletterForm from "@/components/NewsletterForm";

export const metadata: Metadata = {
  title: "Newsletter",
  description:
    "Suscribite al newsletter de MG Náutica y elegí los modelos que buscás: te avisamos cuando ingrese uno.",
};

export default function Newsletter() {
  return (
    <>
      <div className="page-banner">
        <div className="container">
          <span className="section-eyebrow">Alertas por modelo</span>
          <h1>Newsletter</h1>
          <p>
            Dejanos tu email, elegí los modelos que buscás y te avisamos cuando ingrese uno al
            catálogo.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="container newsletter-container">
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
