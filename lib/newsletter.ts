import "server-only";
import { createClient, ApiKeyStrategy } from "@wix/sdk";
import { contacts, labels } from "@wix/crm";
import { emailSubscriptions } from "@wix/email-subscriptions";
import { modelLabel } from "./boat-models";
import type { ContactChannel } from "./newsletter-form";
import type { NewsletterInput } from "./newsletter-input";

// Subscribers live in the Wix CRM, next to everything else the owner manages: a contact
// per email or WhatsApp number, labelled "Newsletter", the channel ("Canal: WhatsApp")
// and one "Modelo: …" label per followed model — what the owner filters by to send an
// alert, as a Wix Email Marketing campaign or a WhatsApp message.
//
// Writing contacts needs an app identity, so unlike lib/wix.ts (visitor tokens) this
// client runs on the server-only API key. It needs the "Manage Contacts" and
// "Email Subscriptions" permissions — see docs/NEWSLETTER-PLAN.md §5.
const apiKey = process.env.WIX_API_KEY;
const siteId = process.env.WIX_SITE_ID;

export const NEWSLETTER_LABEL = "Newsletter";

/** How each subscriber asked to be reached, as a label the contact list can filter on. */
export const CHANNEL_LABEL: Record<ContactChannel, string> = {
  whatsapp: "Canal: WhatsApp",
  email: "Canal: Email",
};

/** The site runs without the key; the form says the newsletter is not available yet. */
export class NewsletterUnavailableError extends Error {}

let _client: ReturnType<typeof makeClient> | null = null;
function makeClient() {
  if (!apiKey || !siteId) {
    throw new NewsletterUnavailableError("WIX_API_KEY / WIX_SITE_ID are not set (see .env.example).");
  }
  return createClient({
    modules: { contacts, labels, emailSubscriptions },
    auth: ApiKeyStrategy({ apiKey, siteId }),
  });
}
function wix() {
  return (_client ??= makeClient());
}

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
  const client = wix();

  const names = [NEWSLETTER_LABEL, CHANNEL_LABEL[contact.channel], ...models.map(modelLabel)];
  const labelKeys = await Promise.all(
    names.map(async (name) => {
      const key = (await client.labels.findOrCreateLabel(name)).label?.key;
      if (!key) throw new Error(`Wix returned no key for label "${name}".`);
      return key;
    }),
  );

  const reachVia =
    contact.channel === "email"
      ? { emails: { items: [{ email: contact.email, tag: "MAIN" as const }] } }
      : { phones: { items: [{ phone: contact.phone, countryCode: contact.country, tag: "MOBILE" as const }] } };

  try {
    await client.contacts.createContact({ ...reachVia, labelKeys: { items: labelKeys } });
  } catch (err) {
    const existing = duplicateContactId(err);
    if (!existing) throw err;
    await client.contacts.labelContact(existing, labelKeys);
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
