"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { subscribeToNewsletter } from "@/app/newsletter/actions";
import { BOAT_MODELS, MODEL_GROUPS, SUGGESTED_MODELS, matchesModel } from "@/lib/boat-models";
import { HONEYPOT_FIELD, NEWSLETTER_IDLE } from "@/lib/newsletter-form";

/** "Colibrí", "Colibrí o Bries", "Colibrí, Bries o Limbo". */
function orList(items: string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} o ${items.at(-1)}`;
}

const SearchIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <line x1="20" y1="20" x2="16.5" y2="16.5" />
  </svg>
);

/**
 * The confirmation replaces a much taller form, so on a phone it would land above the
 * viewport. Focusing it scrolls it into view and moves screen readers along with it.
 */
function Done({ models }: { models: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="nl-card nl-done" role="status" tabIndex={-1} ref={ref}>
      <span className="nl-done-icon" aria-hidden="true">✓</span>
      <h2>¡Listo! Tus alertas están activas</h2>
      <p>
        {models.length > 0
          ? `Te escribimos apenas ingrese un ${orList(models)}.`
          : "Te vamos a escribir con las novedades del catálogo."}
      </p>
      <Link className="btn btn-navy" href="/category/all-products">
        Mientras tanto, mirá el catálogo
      </Link>
    </div>
  );
}

export default function NewsletterForm({ initialModels = [] }: { initialModels?: string[] }) {
  const [state, action, pending] = useActionState(subscribeToNewsletter, NEWSLETTER_IDLE);
  const [email, setEmail] = useState("");
  const [picked, setPicked] = useState<string[]>(initialModels);
  const [query, setQuery] = useState("");

  if (state.status === "ok") return <Done models={state.models} />;

  const isPicked = (slug: string) => picked.includes(slug);
  const toggle = (slug: string) =>
    setPicked((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));
  // List order, not pick order — it is the order the checkboxes submit in.
  const pickedModels = BOAT_MODELS.filter((m) => isPicked(m.slug));
  const searching = query.trim() !== "";
  const results = searching ? BOAT_MODELS.filter((m) => matchesModel(m, query)) : [];

  // React resets a form after its `action` runs, which would untick every model on an
  // error answer. Once hydrated, dispatching from onSubmit skips that reset; before
  // hydration (or without JS) the browser still posts to the Server Action via `action`.
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  }

  // Enter means "search", never "subscribe". With a single match it picks that model,
  // so typing a name and pressing Enter does what it looks like it should.
  function searchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (results.length === 1) {
      if (!isPicked(results[0].slug)) toggle(results[0].slug);
      setQuery("");
    }
  }

  const chips = searching ? results : SUGGESTED_MODELS;

  return (
    <form className="nl-card" action={action} onSubmit={submit}>
      <div className="nl-step" role="group" aria-labelledby="nl-step-models">
        <h2 className="nl-step-title" id="nl-step-models">
          <span className="nl-step-num" aria-hidden="true">1</span>
          ¿Qué modelos buscás?
        </h2>
        <p className="nl-help">
          Podés seguir varios. Si no elegís ninguno, te llegan todas las novedades.
        </p>

        <div className="nl-search">
          {SearchIcon}
          <input
            type="search"
            className="nl-input"
            aria-label="Buscar modelo"
            placeholder="Buscá un modelo (ej. Colibrí)"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={searchKey}
          />
        </div>

        <div className="nl-options">
          <span className="nl-label">{searching ? "Resultados" : "Sugeridos"}</span>
          {chips.length > 0 ? (
            <div className="nl-chips">
              {chips.map((m) => (
                <button
                  key={m.slug}
                  type="button"
                  className="nl-chip"
                  aria-pressed={isPicked(m.slug)}
                  onClick={() => toggle(m.slug)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="nl-help">
              No encontramos ese modelo. Suscribite igual y contanos por WhatsApp cuál buscás.
            </p>
          )}
        </div>

        {/* The canonical control: one real checkbox per model. It submits with the form
            (closed or open) and works before hydration; the chips above and the tags
            below are shortcuts onto the same state. */}
        <details className="nl-browse">
          <summary>Ver los {BOAT_MODELS.length} modelos</summary>
          {MODEL_GROUPS.map((g) => (
            <div className="nl-browse-group" key={g.value}>
              <span className="nl-label">{g.label}</span>
              <ul className="nl-browse-list">
                {BOAT_MODELS.filter((m) => m.group === g.value).map((m) => (
                  <li key={m.slug}>
                    <label className="nl-check">
                      <input
                        type="checkbox"
                        name="models"
                        value={m.slug}
                        checked={isPicked(m.slug)}
                        onChange={() => toggle(m.slug)}
                      />
                      {m.label}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </details>

        <div className="nl-picked" aria-live="polite">
          {pickedModels.length === 0 ? (
            <p className="nl-picked-empty">Todavía no elegiste modelos.</p>
          ) : (
            <>
              <span className="nl-label">Tus alertas ({pickedModels.length})</span>
              <ul className="nl-tags">
                {pickedModels.map((m) => (
                  <li className="nl-tag" key={m.slug}>
                    <span className="nl-tag-name">{m.label}</span>
                    <button type="button" aria-label={`Quitar ${m.label}`} onClick={() => toggle(m.slug)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="nl-step" role="group" aria-labelledby="nl-step-email">
        <h2 className="nl-step-title" id="nl-step-email">
          <span className="nl-step-num" aria-hidden="true">2</span>
          ¿A dónde te avisamos?
        </h2>
        <div className="nl-email-row">
          <input
            type="email"
            name="email"
            className="nl-input"
            aria-label="Tu email"
            required
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? "Activando…" : "Activar alertas"}
          </button>
        </div>
        {state.status === "error" && (
          <div className="alert alert-error" role="alert">
            {state.message}
          </div>
        )}
        <p className="nl-legal">
          Solo te escribimos sobre embarcaciones de MG Náutica. Te das de baja desde cualquier
          email.
        </p>
      </div>

      {/* Honeypot: off-screen and skipped by keyboard and autofill; only a bot fills it. */}
      <div className="nl-trap" aria-hidden="true">
        <label>
          Sitio web
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
        </label>
      </div>
    </form>
  );
}
