import "server-only";
import { createClient, ApiKeyStrategy } from "@wix/sdk";
import { contacts, labels } from "@wix/crm";
import { emailSubscriptions } from "@wix/email-subscriptions";
import { collections, items } from "@wix/data";

// The Wix client on the server-only API key, for everything a visitor token (lib/wix.ts)
// cannot do: writing newsletter contacts, reading them back to send an alert, and keeping
// the alerts log in a Wix CMS collection. The key needs the "Manage Contacts", "Email
// Subscriptions" and "Wix Data" permissions — see docs/NEWSLETTER-PLAN.md §5.
const apiKey = process.env.WIX_API_KEY;
const siteId = process.env.WIX_SITE_ID;

/** The site runs without the key; the newsletter says it is not available yet. */
export class WixAdminUnavailableError extends Error {}

let _client: ReturnType<typeof makeClient> | null = null;
function makeClient() {
  if (!apiKey || !siteId) {
    throw new WixAdminUnavailableError("WIX_API_KEY / WIX_SITE_ID are not set (see .env.example).");
  }
  return createClient({
    modules: { contacts, labels, emailSubscriptions, items, collections },
    auth: ApiKeyStrategy({ apiKey, siteId }),
  });
}
export function wixAdmin() {
  return (_client ??= makeClient());
}

/** A contact label's key from its display name, creating the label the first time. */
export async function labelKey(name: string): Promise<string> {
  const key = (await wixAdmin().labels.findOrCreateLabel(name)).label?.key;
  if (!key) throw new Error(`Wix returned no key for label "${name}".`);
  return key;
}
