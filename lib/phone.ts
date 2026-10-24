import "server-only";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";

// WhatsApp numbers from the newsletter form, normalised to E.164 so the owner can open
// a chat straight from the Wix contact. Server-only: the full metadata (needed to tell
// a mobile from a landline) is ~145KB and has no business in the browser bundle.

/**
 * What a visitor typed → E.164, or null when it is not a real number. `defaultCountry`
 * is the form's prefix selector; a number typed with its own "+code" overrides it.
 *
 * Argentina needs one correction. Internationally its mobiles carry a 9 after +54
 * (+54 9 11 2694-9628), but people write their own number without it ("11 2694-9628"),
 * which parses as a landline — and WhatsApp on +54 11 … reaches nobody. Since a
 * WhatsApp number is a mobile, an Argentine landline parse is retried with the 9.
 * The other local habit, "011 15 2694-9628", already parses as a mobile.
 */
export function parseWhatsAppNumber(
  raw: string,
  defaultCountry: "AR" | "UY",
): { e164: string; country: string } | null {
  const parsed = parsePhoneNumberFromString(raw, defaultCountry);
  if (!parsed?.isValid()) return null;

  if (parsed.country === "AR" && parsed.getType() === "FIXED_LINE") {
    const mobile = parsePhoneNumberFromString(`+549${parsed.nationalNumber}`);
    if (mobile?.isValid() && mobile.getType() === "MOBILE") {
      return { e164: mobile.number, country: "AR" };
    }
  }
  return { e164: parsed.number, country: parsed.country ?? defaultCountry };
}
