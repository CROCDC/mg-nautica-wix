"use server";

import { subscribe, NewsletterUnavailableError } from "@/lib/newsletter";
import { parseNewsletterForm, type NewsletterState } from "@/lib/newsletter-form";

export async function subscribeToNewsletter(
  _prev: NewsletterState,
  form: FormData,
): Promise<NewsletterState> {
  const parsed = parseNewsletterForm(form);
  // A bot gets the same answer a person does, so it learns nothing worth retrying.
  if (parsed.kind === "bot") return { status: "ok", models: [] };
  if (parsed.kind === "invalid") return { status: "error", message: parsed.message };

  try {
    await subscribe(parsed.input);
  } catch (err) {
    console.error("[newsletter] subscribe failed:", err);
    return {
      status: "error",
      message:
        err instanceof NewsletterUnavailableError
          ? "El newsletter todavía no está disponible. Escribinos por WhatsApp y te avisamos."
          : "No pudimos completar la suscripción. Probá de nuevo en unos minutos.",
    };
  }
  return { status: "ok", models: parsed.input.models.map((m) => m.label) };
}
