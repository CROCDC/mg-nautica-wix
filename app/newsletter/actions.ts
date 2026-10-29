"use server";

import { subscribe } from "@/lib/newsletter";
import { WixAdminUnavailableError } from "@/lib/wix-admin";
import { WHATSAPP_ENABLED, type NewsletterState } from "@/lib/newsletter-form";
import { parseNewsletterForm } from "@/lib/newsletter-input";

export async function subscribeToNewsletter(
  _prev: NewsletterState,
  form: FormData,
): Promise<NewsletterState> {
  const parsed = parseNewsletterForm(form);
  // A bot gets the same answer a person does, so it learns nothing worth retrying.
  if (parsed.kind === "bot") {
    const channel = WHATSAPP_ENABLED && form.get("channel") !== "email" ? "whatsapp" : "email";
    return { status: "ok", channel, models: [] };
  }
  if (parsed.kind === "invalid") return { status: "error", message: parsed.message };

  try {
    await subscribe(parsed.input);
  } catch (err) {
    console.error("[newsletter] subscribe failed:", err);
    return {
      status: "error",
      message:
        err instanceof WixAdminUnavailableError
          ? "El newsletter todavía no está disponible. Escribinos por WhatsApp y te avisamos."
          : "No pudimos completar la suscripción. Probá de nuevo en unos minutos.",
    };
  }
  return {
    status: "ok",
    channel: parsed.input.contact.channel,
    models: parsed.input.models.map((m) => m.label),
  };
}
