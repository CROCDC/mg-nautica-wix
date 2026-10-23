import "server-only";
import { createClient, ApiKeyStrategy } from "@wix/sdk";
import { contacts, labels } from "@wix/crm";
import { emailSubscriptions } from "@wix/email-subscriptions";
import { modelLabel } from "./boat-models";
import type { NewsletterInput } from "./newsletter-form";

// Subscribers live in the Wix CRM, next to everything else the owner manages: a contact
// per email, labelled "Newsletter" plus one "Modelo: …" label per followed model, which
// is what a Wix Email Marketing campaign gets segmented by.
//
// Writing contacts needs an app identity, so unlike lib/wix.ts (visitor tokens) this
// client runs on the server-only API key. It needs the "Manage Contacts" and
// "Email Subscriptions" permissions — see docs/NEWSLETTER-PLAN.md §5.
const apiKey = process.env.WIX_API_KEY;
const siteId = process.env.WIX_SITE_ID;

export const NEWSLETTER_LABEL = "Newsletter";

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

/** The SDK rejects a create for a known email with a 409 that names the existing contact. */
function duplicateContactId(err: unknown): string | null {
  const appError = (err as DuplicateContactError | null)?.details?.applicationError;
  return appError?.code === "DUPLICATE_CONTACT_EXISTS"
    ? (appError.data?.duplicateContactId ?? null)
    : null;
}

/**
 * Subscribe an email and record the models it follows. Re-subscribing adds models to
 * the ones already on the contact rather than replacing them — dropping one is done in
 * the Wix dashboard.
 */
export async function subscribe({ email, models }: NewsletterInput): Promise<void> {
  const client = wix();

  const names = [NEWSLETTER_LABEL, ...models.map(modelLabel)];
  const labelKeys = await Promise.all(
    names.map(async (name) => {
      const key = (await client.labels.findOrCreateLabel(name)).label?.key;
      if (!key) throw new Error(`Wix returned no key for label "${name}".`);
      return key;
    }),
  );

  try {
    await client.contacts.createContact({
      emails: { items: [{ email, tag: "MAIN" }] },
      labelKeys: { items: labelKeys },
    });
  } catch (err) {
    const existing = duplicateContactId(err);
    if (!existing) throw err;
    await client.contacts.labelContact(existing, labelKeys);
  }

  // Wix Email Marketing only mails contacts who opted in. Submitting this form is that
  // opt-in — including for someone who unsubscribed before and is signing up again.
  await client.emailSubscriptions.upsertEmailSubscription({
    subscription: { email, subscriptionStatus: "SUBSCRIBED" },
  });
}
