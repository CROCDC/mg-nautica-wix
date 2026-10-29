// Insurance alliance with Parrado Seguros. Offers and pillars are the ones published in the
// joint campaign (flyer + Instagram reel), so the site never promises more than it does.

export const WHATSAPP = "5491126949628";

export const PARRADO_SINCE = 1967;

export const CAR_DISCOUNT = 30;
export const HOME_DISCOUNT = 20;
export const CAR_MAX_AGE_YEARS = 5;

export const PARRADO_LOGO = {
  color: { src: "/site/parrado/logo-color.png", width: 640, height: 255 },
  light: { src: "/site/parrado/logo-light.png", width: 640, height: 255 },
  alt: "Parrado & Asociados, consultores en seguros",
};

/** The circular sail mark on its own, cropped from the logo; sharp up to ~120px. */
export const PARRADO_MARK = { src: "/site/parrado/mark.png", width: 246, height: 246 };

export const PILLARS = [
  {
    title: "Coberturas integrales",
    body: "Para tu embarcación, tu auto y tu hogar, con una sola consulta.",
  },
  {
    title: "Asesoramiento personalizado",
    body: "Te ayudamos a elegir la cobertura que corresponde a tu caso.",
  },
  {
    title: "Solidez y trayectoria",
    body: `Parrado asesora en seguros desde ${PARRADO_SINCE}.`,
  },
  {
    title: "Gestión ágil y simple",
    body: "Consultás por WhatsApp y te acompañamos en todo el trámite.",
  },
];

export type QuoteRequest = {
  boat: boolean;
  boatName: string;
  car: boolean;
  carYear: string;
  home: boolean;
};

export const DEFAULT_QUOTE: QuoteRequest = {
  boat: true,
  boatName: "",
  car: false,
  carYear: "",
  home: false,
};

/** null while the year is empty or not a plausible car year. */
export function carDiscountApplies(carYear: string, currentYear: number): boolean | null {
  const year = Number(carYear);
  if (!/^\d{4}$/.test(carYear.trim()) || year < 1900 || year > currentYear + 1) return null;
  return currentYear - year <= CAR_MAX_AGE_YEARS;
}

export function quoteMessage(q: QuoteRequest, currentYear: number): string {
  const lines = ["Hola! Quiero cotizar un seguro con Parrado Seguros."];
  if (q.boat) {
    const name = q.boatName.trim();
    lines.push(name ? `• Embarcación: ${name}` : "• Mi embarcación");
  }
  if (q.car) {
    const applies = carDiscountApplies(q.carYear, currentYear);
    const year = applies === null ? "" : `, año ${q.carYear.trim()}`;
    // An older car still gets a quote, just without promising the discount.
    lines.push(`• Auto${year}${applies === false ? "" : ` (descuento del ${CAR_DISCOUNT}%)`}`);
  }
  if (q.home) lines.push(`• Hogar (descuento del ${HOME_DISCOUNT}%)`);
  return lines.join("\n");
}

export function whatsappHref(text: string): string {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
}

/** Link into the quote builder with the boat already filled in. */
export function insuranceHref(boatName?: string): string {
  return boatName ? `/insurance?embarcacion=${encodeURIComponent(boatName)}#consulta` : "/insurance#consulta";
}
