// Newsletter form parsing — pure, so the rules are unit-tested without a server.
// The Server Action (app/newsletter/actions.ts) runs this before anything reaches Wix.
import { parseModels, type BoatModel } from "./boat-models";

/**
 * What NewsletterForm renders after a submit. `models` are the labels that went through,
 * for the confirmation. On error the form keeps its own field state, so nothing is echoed.
 */
export type NewsletterState =
  | { status: "idle" }
  | { status: "ok"; models: string[] }
  | { status: "error"; message: string };

export const NEWSLETTER_IDLE: NewsletterState = { status: "idle" };

/** Hidden field a person never sees; a bot filling every input does. */
export const HONEYPOT_FIELD = "website";

export type NewsletterInput = { email: string; models: BoatModel[] };

export type ParsedNewsletterForm =
  | { kind: "ok"; input: NewsletterInput }
  | { kind: "bot" }
  | { kind: "invalid"; message: string };

// RFC 5321 caps an address at 254 characters.
const MAX_EMAIL = 254;
// Stricter than <input type="email">, which accepts "a@b": a newsletter to a domain
// without a dot can only bounce, so the server asks for one.
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function parseNewsletterForm(form: FormData): ParsedNewsletterForm {
  const honeypot = form.get(HONEYPOT_FIELD);
  if (typeof honeypot === "string" && honeypot.trim() !== "") return { kind: "bot" };

  const raw = form.get("email");
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!email) return { kind: "invalid", message: "Ingresá tu email." };
  if (email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
    return { kind: "invalid", message: "Ese email no parece válido. Revisalo y probá de nuevo." };
  }

  const slugs = form.getAll("models").filter((v): v is string => typeof v === "string");
  return { kind: "ok", input: { email, models: parseModels(slugs) } };
}
