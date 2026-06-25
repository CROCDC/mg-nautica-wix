import { createClient, OAuthStrategy } from "@wix/sdk";

// Public OAuth client id for visitor tokens (catalog/cart reads). Safe in the browser.
// The store modules (@wix/stores, @wix/ecom) get wired here once the POC confirms the
// exact API shape against the installed SDK version (plan Phase 0).
const clientId = process.env.NEXT_PUBLIC_WIX_CLIENT_ID;

export function getWixClient() {
  if (!clientId) {
    throw new Error(
      "NEXT_PUBLIC_WIX_CLIENT_ID is not set — add it to .env.local (see .env.example).",
    );
  }
  return createClient({
    auth: OAuthStrategy({ clientId }),
  });
}
