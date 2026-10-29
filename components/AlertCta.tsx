import Link from "next/link";
import { alertHref, orList, parseModels, type BoatModel } from "@/lib/boat-models";

// Prefilled examples on the home panel: models the form's own placeholder and the owner's
// listings already use, not a popularity ranking (there is no data for one).
const EXAMPLES = parseModels(["plenamar", "colibri", "bries", "trento"]);

type Variant = "panel" | "strip" | "box" | "band";

/**
 * A way into the model alerts. `models` arrive already picked on the form, so a CTA next
 * to a Plenamar opens it on Plenamar. Every variant says the same verb the form's submit
 * button does.
 */
export default function AlertCta({ variant, models = [] }: { variant: Variant; models?: BoatModel[] }) {
  const href = alertHref(models);
  const named = models.length ? orList(models.map((m) => m.label)) : null;

  if (variant === "panel") {
    return (
      <div className="nl-promo">
        <div>
          <h2>¿No está el barco que buscás?</h2>
          <p>Decinos qué modelos seguís y te avisamos por email cuando publiquemos uno.</p>
          <p className="nl-promo-examples">
            Por ejemplo:{" "}
            {EXAMPLES.map((m, i) => (
              <span key={m.slug}>
                {i > 0 && ", "}
                <Link href={alertHref([m])}>{m.label}</Link>
              </span>
            ))}
          </p>
        </div>
        <Link className="btn btn-primary btn-lg" href={href}>
          Crear mi alerta
        </Link>
      </div>
    );
  }

  if (variant === "strip") {
    return (
      <div className="alert-strip">
        <p>
          <strong>{named ? "¿Ninguno es el tuyo?" : "¿No está el que buscás?"}</strong>{" "}
          {named
            ? `Te avisamos por email cuando publiquemos otro ${named}.`
            : "Elegí los modelos que seguís y te avisamos por email cuando publiquemos uno."}
        </p>
        <Link className="btn btn-navy btn-sm" href={href}>
          Crear mi alerta
        </Link>
      </div>
    );
  }

  if (variant === "box") {
    return (
      <div className="sidebar-box alert-box">
        <p>
          {named
            ? `Si entra otro ${named}, te avisamos por email.`
            : "¿Buscás otro modelo? Te avisamos por email cuando lo publiquemos."}
        </p>
        <Link className="btn btn-outline btn-sm" href={href}>
          Crear mi alerta
        </Link>
      </div>
    );
  }

  return (
    <div className="footer-alerts">
      <div className="footer-alerts-inner">
        <p>
          <strong>¿Buscás un modelo que hoy no está?</strong> Te avisamos por email cuando lo
          publiquemos.
        </p>
        <Link className="btn btn-primary" href={href}>
          Crear mi alerta
        </Link>
      </div>
    </div>
  );
}
