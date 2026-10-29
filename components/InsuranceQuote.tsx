"use client";

import { useState } from "react";
import {
  CAR_DISCOUNT,
  CAR_MAX_AGE_YEARS,
  DEFAULT_QUOTE,
  HOME_DISCOUNT,
  carDiscountApplies,
  quoteMessage,
  whatsappHref,
  type QuoteRequest,
} from "@/lib/parrado";

const OPTIONS = [
  { key: "boat", label: "Embarcación", benefit: "Siempre protegida" },
  { key: "car", label: "Auto", benefit: `−${CAR_DISCOUNT}%` },
  { key: "home", label: "Hogar", benefit: `−${HOME_DISCOUNT}%` },
] as const;

// Builds the WhatsApp message as the visitor picks what to insure. Without JavaScript the
// server-rendered link still opens WhatsApp with the default message.
export default function InsuranceQuote({ initialBoat = "" }: { initialBoat?: string }) {
  const [quote, setQuote] = useState<QuoteRequest>({ ...DEFAULT_QUOTE, boatName: initialBoat });
  // Only consulted once a year is typed, so server and client agree on the first render.
  const currentYear = new Date().getFullYear();
  const carStatus = carDiscountApplies(quote.carYear, currentYear);
  const message = quoteMessage(quote, currentYear);
  const nothingPicked = !quote.boat && !quote.car && !quote.home;

  const update = (patch: Partial<QuoteRequest>) => setQuote((q) => ({ ...q, ...patch }));

  return (
    <div className="pq">
      <form className="pq-form" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="pq-options">
          <legend>¿Qué querés asegurar?</legend>
          {OPTIONS.map((o) => (
            <label key={o.key} className="pq-option">
              <input
                type="checkbox"
                name={o.key}
                checked={quote[o.key]}
                onChange={(e) => update({ [o.key]: e.target.checked })}
              />
              <span className="pq-option-name">{o.label}</span>
              <span className="pq-option-benefit">{o.benefit}</span>
            </label>
          ))}
        </fieldset>

        {quote.boat && (
          <label className="pq-field">
            <span>¿Qué embarcación?</span>
            <input
              type="text"
              name="embarcacion"
              autoComplete="off"
              placeholder="Ej.: velero Grumete 24…"
              value={quote.boatName}
              onChange={(e) => update({ boatName: e.target.value })}
            />
          </label>
        )}

        {quote.car && (
          <div className="pq-field">
            <label htmlFor="pq-car-year">Año del auto</label>
            <input
              id="pq-car-year"
              type="text"
              name="anio"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              placeholder={`Ej.: ${currentYear - 2}…`}
              value={quote.carYear}
              aria-describedby="pq-car-status"
              onChange={(e) => update({ carYear: e.target.value.replace(/\D/g, "") })}
            />
            <p id="pq-car-status" className="pq-status" aria-live="polite">
              {carStatus === true && `Entra en el descuento del ${CAR_DISCOUNT}%.`}
              {carStatus === false &&
                `Tiene más de ${CAR_MAX_AGE_YEARS} años: el descuento no aplica, pero igual te cotizamos.`}
              {carStatus === null && `El ${CAR_DISCOUNT}% es para autos de hasta ${CAR_MAX_AGE_YEARS} años.`}
            </p>
          </div>
        )}
      </form>

      <div className="pq-preview">
        <h3>Tu mensaje</h3>
        <p className="pq-bubble">{message}</p>
        <a className="btn btn-primary btn-lg" href={whatsappHref(message)} target="_blank" rel="noopener">
          Enviar por WhatsApp
        </a>
        <p className="pq-note" aria-live="polite">
          {nothingPicked
            ? "Elegí al menos una opción, o escribinos igual y te asesoramos."
            : "Se abre WhatsApp con el mensaje listo para mandar al +54 9 11 2694-9628."}
        </p>
      </div>
    </div>
  );
}
