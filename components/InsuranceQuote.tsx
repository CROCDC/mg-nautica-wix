"use client";

import Image from "next/image";
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

type Key = "boat" | "car" | "home";

const PANELS: { key: Key; name: string; lead: string }[] = [
  {
    key: "boat",
    name: "Embarcación",
    lead: "Contanos qué embarcación tenés y te asesoramos con la cobertura que le corresponde.",
  },
  {
    key: "car",
    name: "Auto",
    lead: `${CAR_DISCOUNT}% de descuento en el seguro de autos de hasta ${CAR_MAX_AGE_YEARS} años de antigüedad.`,
  },
  {
    key: "home",
    name: "Hogar",
    lead: `${HOME_DISCOUNT}% de descuento en el seguro de tu casa.`,
  },
];

// The quote as a row of panels, one per thing to insure. Each panel adds its item to the
// WhatsApp message composed underneath. Without JavaScript the first panel stays open and
// the send link carries the default message.
export default function InsuranceQuote({ initialBoat = "" }: { initialBoat?: string }) {
  const [quote, setQuote] = useState<QuoteRequest>({ ...DEFAULT_QUOTE, boatName: initialBoat });
  const [open, setOpen] = useState<Key>("boat");
  // Only consulted once a year is typed, so server and client agree on the first render.
  const currentYear = new Date().getFullYear();
  const carStatus = carDiscountApplies(quote.carYear, currentYear);
  const message = quoteMessage(quote, currentYear);
  const nothingPicked = !quote.boat && !quote.car && !quote.home;

  const update = (patch: Partial<QuoteRequest>) => setQuote((q) => ({ ...q, ...patch }));

  return (
    <div className="ps-quote">
      <div className="ps-acc">
        {PANELS.map((p) => {
          const isOpen = open === p.key;
          const included = quote[p.key];
          return (
            <div key={p.key} className={`ps-panel ps-panel-${p.key}${isOpen ? " is-open" : ""}`}>
              <h3 className="ps-panel-head">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`ps-panel-${p.key}`}
                  onClick={() => setOpen(p.key)}
                >
                  {p.name}
                  {included && (
                    <>
                      <span className="ps-dot" aria-hidden="true" />
                      <span className="ps-sr"> (en tu consulta)</span>
                    </>
                  )}
                </button>
              </h3>
              <div id={`ps-panel-${p.key}`} className="ps-panel-body" hidden={!isOpen}>
                <div className="ps-panel-text">
                  <p className="ps-panel-lead">{p.lead}</p>
                  <button
                    type="button"
                    className={`ps-toggle${included ? " is-on" : ""}`}
                    aria-pressed={included}
                    onClick={() => update({ [p.key]: !included })}
                  >
                    {included ? "En tu consulta" : "Sumar a la consulta"}
                  </button>
                  {p.key === "boat" && included && (
                    <label className="ps-field">
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
                  {p.key === "car" && included && (
                    <div className="ps-field">
                      <label htmlFor="ps-car-year">Año del auto</label>
                      <input
                        id="ps-car-year"
                        type="text"
                        name="anio"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={4}
                        placeholder={`Ej.: ${currentYear - 2}…`}
                        value={quote.carYear}
                        aria-describedby="ps-car-status"
                        onChange={(e) => update({ carYear: e.target.value.replace(/\D/g, "") })}
                      />
                      <p id="ps-car-status" className="ps-status" aria-live="polite">
                        {carStatus === true && `Entra en el descuento del ${CAR_DISCOUNT}%.`}
                        {carStatus === false &&
                          `Tiene más de ${CAR_MAX_AGE_YEARS} años: el descuento no aplica, pero igual te cotizamos.`}
                        {carStatus === null && `El ${CAR_DISCOUNT}% es para autos de hasta ${CAR_MAX_AGE_YEARS} años.`}
                      </p>
                    </div>
                  )}
                </div>
                <div className="ps-panel-figure" aria-hidden="true">
                  {p.key === "boat" ? (
                    <Image
                      src="/site/brazil-course-bow.jpg"
                      alt=""
                      width={520}
                      height={978}
                      sizes="280px"
                      className="ps-disc-photo"
                    />
                  ) : (
                    <span className="ps-disc ps-disc-figure">
                      {p.key === "car" ? CAR_DISCOUNT : HOME_DISCOUNT}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ps-send">
        <p className="ps-bubble">{message}</p>
        <div className="ps-send-action">
          <a className="ps-btn" href={whatsappHref(message)} target="_blank" rel="noopener">
            Enviar por WhatsApp
          </a>
          <p className="ps-note" aria-live="polite">
            {nothingPicked
              ? "Sumá al menos una opción, o escribinos igual y te asesoramos."
              : "Se abre WhatsApp con este mensaje, listo para mandar."}
          </p>
        </div>
      </div>
    </div>
  );
}
