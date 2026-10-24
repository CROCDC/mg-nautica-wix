// What the NewsletterForm client component and the Server Action share. It is in the
// browser bundle, so nothing heavy or server-only belongs here — the parsing (and the
// phone metadata it needs) lives in lib/newsletter-input.ts.

/** How the subscriber wants to hear about a boat. */
export type ContactChannel = "whatsapp" | "email";

export const CONTACT_CHANNELS: { value: ContactChannel; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
];

/** The WhatsApp prefix selector; anything else is typed with its own "+code". */
export type PhoneCountry = "AR" | "UY";

export const PHONE_COUNTRIES: { value: PhoneCountry; label: string; example: string }[] = [
  { value: "AR", label: "🇦🇷 +54", example: "11 2345-6789" },
  { value: "UY", label: "🇺🇾 +598", example: "99 123 456" },
];

/**
 * What NewsletterForm renders after a submit. `models` are the labels that went through,
 * for the confirmation. On error the form keeps its own field state, so nothing is echoed.
 */
export type NewsletterState =
  | { status: "idle" }
  | { status: "ok"; channel: ContactChannel; models: string[] }
  | { status: "error"; message: string };

export const NEWSLETTER_IDLE: NewsletterState = { status: "idle" };

/** Hidden field a person never sees; a bot filling every input does. */
export const HONEYPOT_FIELD = "website";
