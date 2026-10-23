"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useId, useRef, useState } from "react";
import { subscribeToNewsletter } from "@/app/newsletter/actions";
import { parseModels, suggestModels } from "@/lib/boat-models";
import { HONEYPOT_FIELD, NEWSLETTER_IDLE } from "@/lib/newsletter-form";

/** "Colibrí", "Colibrí o Bries", "Colibrí, Bries o Limbo". */
function orList(items: string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} o ${items.at(-1)}`;
}

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Bold the typed part. Labels are precomposed, so folding keeps every index in place. */
function Highlight({ label, query }: { label: string; query: string }) {
  const q = fold(query.trim());
  const at = fold(label).indexOf(q);
  if (!q || at < 0) return <>{label}</>;
  return (
    <>
      {label.slice(0, at)}
      <mark>{label.slice(at, at + q.length)}</mark>
      {label.slice(at + q.length)}
    </>
  );
}

/**
 * The confirmation replaces the form, so on a phone it can land above the viewport.
 * Focusing it scrolls it into view and moves screen readers along with it.
 */
function Done({ models }: { models: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="nl-card nl-done" role="status" tabIndex={-1} ref={ref}>
      <span className="nl-done-icon" aria-hidden="true">✓</span>
      <div>
        <h2>¡Listo! Tus alertas están activas</h2>
        <p>
          {models.length > 0
            ? `Te escribimos apenas ingrese un ${orList(models)}.`
            : "Te vamos a escribir con las novedades del catálogo."}
        </p>
      </div>
      <Link className="btn btn-navy btn-sm" href="/category/all-products">
        Ver el catálogo
      </Link>
    </div>
  );
}

export default function NewsletterForm({ initialModels = [] }: { initialModels?: string[] }) {
  const [state, action, pending] = useActionState(subscribeToNewsletter, NEWSLETTER_IDLE);
  const [email, setEmail] = useState("");
  const [picked, setPicked] = useState<string[]>(initialModels);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();

  if (state.status === "ok") return <Done models={state.models} />;

  const pickedModels = parseModels(picked);
  const options = suggestModels(query, picked);
  const listOpen = open && query.trim() !== "";
  const current = options.length ? Math.min(active, options.length - 1) : -1;
  const optionId = (slug: string) => `${id}-opt-${slug}`;

  function add(slug: string) {
    setPicked((cur) => (cur.includes(slug) ? cur : [...cur, slug]));
    setQuery("");
    setActive(0);
    input.current?.focus();
  }
  function remove(slug: string) {
    setPicked((cur) => cur.filter((s) => s !== slug));
    input.current?.focus();
  }

  // A combobox: ↑/↓ move through the suggestions, Enter adds the highlighted one,
  // Escape closes them, Backspace on an empty field drops the last boat. Enter never
  // submits from here — the email field's button does that.
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!options.length) return;
      e.preventDefault();
      setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((current + step + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (listOpen && current >= 0) add(options[current].slug);
    } else if (e.key === "Escape") {
      if (listOpen) {
        e.preventDefault();
        setOpen(false);
      }
    } else if (e.key === "Backspace" && query === "" && picked.length) {
      remove(picked[picked.length - 1]);
    }
  }

  // React resets a form after its `action` runs, which would drop every boat on an
  // error answer. Once hydrated, dispatching from onSubmit skips that reset; before
  // hydration (or without JS) the browser still posts to the Server Action via `action`.
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  }

  return (
    <form className="nl-card" action={action} onSubmit={submit}>
      <div className="nl-field">
        <label className="nl-field-label" htmlFor={`${id}-boats`}>
          Embarcaciones que buscás
        </label>
        <div className="nl-combo-wrap">
          {/* Clicking anywhere in the box (between tags too) lands in the text field. */}
          <div className="nl-combo" onClick={() => input.current?.focus()}>
            {pickedModels.map((m) => (
              <span className="nl-tag" key={m.slug}>
                <span className="nl-tag-name">{m.label}</span>
                <button
                  type="button"
                  aria-label={`Quitar ${m.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(m.slug);
                  }}
                >
                  ×
                </button>
                <input type="hidden" name="models" value={m.slug} />
              </span>
            ))}
            <input
              ref={input}
              id={`${id}-boats`}
              type="text"
              role="combobox"
              aria-expanded={listOpen}
              aria-controls={`${id}-list`}
              aria-autocomplete="list"
              aria-activedescendant={listOpen && current >= 0 ? optionId(options[current].slug) : undefined}
              autoComplete="off"
              placeholder={picked.length ? "Agregar otra…" : "Escribí un modelo, ej. Colibrí"}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
                setActive(0);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onKeyDown={onKeyDown}
            />
          </div>
          {listOpen && (
            <ul className="nl-suggest" id={`${id}-list`} role="listbox" aria-label="Sugerencias">
              {options.length > 0 ? (
                options.map((m, i) => (
                  <li
                    key={m.slug}
                    id={optionId(m.slug)}
                    role="option"
                    aria-selected={i === current}
                    className={i === current ? "is-active" : undefined}
                    // Keep focus in the field, so the list does not close before the click.
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => add(m.slug)}
                  >
                    <Highlight label={m.label} query={query} />
                  </li>
                ))
              ) : (
                <li className="nl-suggest-empty" role="option" aria-selected={false} aria-disabled="true">
                  No está en la lista
                </li>
              )}
            </ul>
          )}
        </div>
        <p className="nl-hint">
          Agregá todas las que quieras. Sin ninguna, te llegan todas las novedades.
        </p>
      </div>

      <div className="nl-field">
        <label className="nl-field-label" htmlFor={`${id}-email`}>
          Tu email
        </label>
        <div className="nl-email-row">
          <input
            id={`${id}-email`}
            type="email"
            name="email"
            className="nl-input"
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
      </div>

      {state.status === "error" && (
        <div className="alert alert-error" role="alert">
          {state.message}
        </div>
      )}

      <p className="nl-legal">
        Solo te escribimos sobre embarcaciones de MG Náutica. Te das de baja desde cualquier email.
      </p>

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
