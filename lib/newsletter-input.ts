import "server-only";
// Newsletter form parsing — pure, so the rules are unit-tested without a server.
// The Server Action (app/newsletter/actions.ts) runs this before anything reaches Wix.
import { parseModels, type BoatModel } from "./boat-models";
import { HONEYPOT_FIELD, type PhoneCountry } from "./newsletter-form";
import { parseWhatsAppNumber } from "./phone";

/** Where the alerts go: one channel per subscription, as picked in the form. */
export type NewsletterContact =
  | { channel: "email"; email: string }
  | { channel: "whatsapp"; phone: string; country: string };

export type NewsletterInput = { contact: NewsletterContact; models: BoatModel[] };

export type ParsedNewsletterForm =
  | { kind: "ok"; input: NewsletterInput }
  | { kind: "bot" }
  | { kind: "invalid"; message: string };

// RFC 5321 caps an address at 254 characters.
const MAX_EMAIL = 254;
// Stricter than <input type="email">, which accepts "a@b": a newsletter to a domain
// without a dot can only bounce, so the server asks for one.
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
// The longest E.164 number is 15 digits; typed with spaces, dashes and a prefix it
// stays well under this. Anything longer is not a phone number.
const MAX_PHONE = 32;

const text = (form: FormData, name: string) => {
  const v = form.get(name);
  return typeof v === "string" ? v.trim() : "";
};

function parseContact(form: FormData): NewsletterContact | string {
  if (form.get("channel") === "email") {
    const email = text(form, "email").toLowerCase();
    if (!email) return "Ingresá tu email.";
    if (email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
      return "Ese email no parece válido. Revisalo y probá de nuevo.";
    }
    return { channel: "email", email };
  }

  // WhatsApp is the default channel, so a submit without one lands here too.
  const raw = text(form, "phone");
  if (!raw) return "Ingresá tu número de WhatsApp.";
  const country: PhoneCountry = form.get("country") === "UY" ? "UY" : "AR";
  const phone = raw.length <= MAX_PHONE ? parseWhatsAppNumber(raw, country) : null;
  if (!phone) {
    return "Ese número no parece válido. Escribilo con código de área, ej. 11 2345-6789.";
  }
  return { channel: "whatsapp", phone: phone.e164, country: phone.country };
}

export function parseNewsletterForm(form: FormData): ParsedNewsletterForm {
  const honeypot = form.get(HONEYPOT_FIELD);
  if (typeof honeypot === "string" && honeypot.trim() !== "") return { kind: "bot" };

  const contact = parseContact(form);
  if (typeof contact === "string") return { kind: "invalid", message: contact };

  const slugs = form.getAll("models").filter((v): v is string => typeof v === "string");
  return { kind: "ok", input: { contact, models: parseModels(slugs) } };
}
