import "server-only";
import { modelLabel } from "./boat-models";
import type { ContactChannel } from "./newsletter-form";
import type { NewsletterInput } from "./newsletter-input";
import { labelKey, wixAdmin } from "./wix-admin";

// Subscribers live in the Wix CRM, next to everything else the owner manages: a contact
// per email or WhatsApp number, labelled "Newsletter", the channel ("Canal: WhatsApp")
// and one "Modelo: …" label per followed model — or "Modelo: Todos" for whoever picked
// none. Those labels are what lib/alerts.ts reads to decide who hears about a new boat.

export const NEWSLETTER_LABEL = "Newsletter";

/** How each subscriber asked to be reached, as a label the contact list can filter on. */
export const CHANNEL_LABEL: Record<ContactChannel, string> = {
  whatsapp: "Canal: WhatsApp",
  email: "Canal: Email",
};

/** A subscriber who picked no model hears about every new boat. */
export const ALL_MODELS_LABEL = "Modelo: Todos";

/** Replaces "Canal: WhatsApp" when someone answers BAJA (see lib/whatsapp-webhook.ts). */
export const WHATSAPP_OPT_OUT_LABEL = "Baja: WhatsApp";

type DuplicateContactError = {
  details?: { applicationError?: { code?: string; data?: { duplicateContactId?: string } } };
};

/**
 * The SDK rejects a create for a known email — or, with no email given, a known phone —
 * with a 409 that names the existing contact.
 */
function duplicateContactId(err: unknown): string | null {
  const appError = (err as DuplicateContactError | null)?.details?.applicationError;
  return appError?.code === "DUPLICATE_CONTACT_EXISTS"
    ? (appError.data?.duplicateContactId ?? null)
    : null;
}

/**
 * Subscribe an email or WhatsApp number and record the models it follows. Re-subscribing
 * adds models to the ones already on the contact rather than replacing them — dropping
 * one is done in the Wix dashboard.
 */
export async function subscribe({ contact, models }: NewsletterInput): Promise<void> {
  const client = wixAdmin();

  const names = [
    NEWSLETTER_LABEL,
    CHANNEL_LABEL[contact.channel],
    ...(models.length ? models.map(modelLabel) : [ALL_MODELS_LABEL]),
  ];
  const labelKeys = await Promise.all(names.map(labelKey));

  const reachVia =
    contact.channel === "email"
      ? { emails: { items: [{ email: contact.email, tag: "MAIN" as const, primary: true }] } }
      : {
          phones: {
            items: [
              { phone: contact.phone, countryCode: contact.country, tag: "MOBILE" as const, primary: true },
            ],
          },
        };

  try {
    await client.contacts.createContact({ ...reachVia, labelKeys: { items: labelKeys } });
  } catch (err) {
    const existing = duplicateContactId(err);
    if (!existing) throw err;
    await client.contacts.labelContact(existing, labelKeys);
    // Signing up again after answering BAJA is asking for the alerts back.
    if (contact.channel === "whatsapp") {
      await client.contacts.unlabelContact(existing, [await labelKey(WHATSAPP_OPT_OUT_LABEL)]);
    }
  }

  // Wix Email Marketing only mails contacts who opted in. Submitting this form is that
  // opt-in — including for someone who unsubscribed before and is signing up again.
  // WhatsApp has no such switch in Wix: the "Canal: WhatsApp" label is the opt-in record.
  if (contact.channel === "email") {
    await client.emailSubscriptions.upsertEmailSubscription({
      subscription: { email: contact.email, subscriptionStatus: "SUBSCRIBED" },
    });
  }
}
