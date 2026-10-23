"use client";

import { startTransition, useActionState, useState } from "react";
import { subscribeToNewsletter } from "@/app/newsletter/actions";
import { BOAT_MODELS, MODEL_GROUPS, matchesModel } from "@/lib/boat-models";
import { HONEYPOT_FIELD, NEWSLETTER_IDLE } from "@/lib/newsletter-form";

/** "Colibrí", "Colibrí o Bries", "Colibrí, Bries o Limbo". */
function orList(items: string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} o ${items.at(-1)}`;
}

export default function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeToNewsletter, NEWSLETTER_IDLE);
  const [email, setEmail] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  if (state.status === "ok") {
    return (
      <div className="alert alert-success newsletter-done" role="status">
        <strong>¡Listo, ya estás suscripto!</strong>
        <p>
          {state.models.length > 0
            ? `Te vamos a avisar cuando ingrese un ${orList(state.models)}.`
            : "Te vamos a escribir con las novedades del catálogo."}
        </p>
      </div>
    );
  }

  const toggle = (slug: string) =>
    setPicked((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));
  const visible = BOAT_MODELS.filter((m) => matchesModel(m, query));

  // React resets a form after its `action` runs, which unticks every chip on an error
  // answer. Once hydrated, dispatching from onSubmit skips that reset; before hydration
  // (or without JS) the browser still posts to the Server Action through `action`.
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  }

  return (
    <form className="form newsletter-form" action={action} onSubmit={submit}>
      <label>
        Tu email
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="nombre@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <fieldset className="newsletter-models">
        <legend>
          Modelos que te interesan <span>(opcional)</span>
        </legend>
        <input
          type="search"
          className="newsletter-search"
          aria-label="Buscar modelo"
          placeholder="Buscar modelo… (ej. Colibrí)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // Enter here means "search", not "subscribe".
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        />
        {MODEL_GROUPS.map((g) => {
          const models = BOAT_MODELS.filter((m) => m.group === g.value);
          const shown = models.some((m) => visible.includes(m));
          return (
            // Filtered-out chips are hidden, not unmounted: a picked model has to stay in
            // the submitted form even while the search hides it.
            <div className="model-group" key={g.value} hidden={!shown}>
              <h3>{g.label}</h3>
              <div className="model-chips">
                {models.map((m) => (
                  <label className="model-chip" key={m.slug} hidden={!visible.includes(m)}>
                    <input
                      type="checkbox"
                      name="models"
                      value={m.slug}
                      checked={picked.includes(m.slug)}
                      onChange={() => toggle(m.slug)}
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="newsletter-hint">
            No tenemos ese modelo en la lista. Suscribite igual y escribinos por WhatsApp cuál
            buscás.
          </p>
        )}
        <p className="newsletter-hint" aria-live="polite">
          {picked.length === 0
            ? "Sin elegir modelos recibís todas las novedades."
            : `${picked.length} ${picked.length === 1 ? "modelo elegido" : "modelos elegidos"}.`}
        </p>
      </fieldset>

      {/* Honeypot: off-screen and skipped by keyboard and autofill; only a bot fills it. */}
      <div className="newsletter-trap" aria-hidden="true">
        <label>
          Sitio web
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.status === "error" && (
        <div className="alert alert-error" role="alert">
          {state.message}
        </div>
      )}

      <button className="btn btn-primary btn-lg" type="submit" disabled={pending}>
        {pending ? "Suscribiendo…" : "Suscribirme"}
      </button>
      <p className="newsletter-legal">
        Solo te escribimos sobre embarcaciones y novedades de MG Náutica. Podés darte de baja
        desde el link que viene en cada email.
      </p>
    </form>
  );
}
