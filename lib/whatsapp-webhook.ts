import "server-only";
import { createHmac } from "node:crypto";
import { CHANNEL_LABEL, WHATSAPP_OPT_OUT_LABEL } from "./newsletter";
import { parseWhatsAppNumber } from "./phone";
import { safeEqual } from "./secrets";
import { sendWhatsApp, textMessage } from "./whatsapp";
import { labelKey, wixAdmin } from "./wix-admin";

// Incoming WhatsApp messages (Meta webhook → app/api/whatsapp/webhook). The only thing
// acted on is an opt-out: answering BAJA to an alert takes the number off the alerts,
// with no one in the loop — the footer of every alert says so.

/** Meta signs every delivery with the app secret: `X-Hub-Signature-256: sha256=<hex>`. */
export function validSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  return safeEqual(header, expected);
}

// The whole message, give or take punctuation: "baja", "BAJA.", "Stop!". A sentence
// that merely contains the word ("¿se dio de baja el precio?") is a question, not this.
const OPT_OUT = /^\s*(baja|stop|cancelar|desuscribir(me)?)\s*[.!¡]*\s*$/i;

type Incoming = {
  from?: unknown;
  type?: string;
  text?: { body?: unknown };
  button?: { text?: unknown };
};
type WebhookPayload = {
  entry?: { changes?: { field?: string; value?: { messages?: Incoming[] } }[] }[];
};

/** The senders (WhatsApp ids: digits, no "+") who answered BAJA in this delivery. */
export function optOutSenders(payload: unknown): string[] {
  const senders = new Set<string>();
  for (const entry of (payload as WebhookPayload | null)?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;
      for (const msg of change.value?.messages ?? []) {
        const text = msg.type === "button" ? msg.button?.text : msg.text?.body;
        if (typeof msg.from === "string" && typeof text === "string" && OPT_OUT.test(text)) {
          senders.add(msg.from);
        }
      }
    }
  }
  return [...senders];
}

export const OPT_OUT_REPLY =
  "Listo, no te vamos a mandar más avisos por WhatsApp. Si cambiás de idea, volvé a " +
  "suscribirte en mgnauticabroker.com/newsletter";

/**
 * Take a number off the WhatsApp alerts: "Canal: WhatsApp" comes off its contact (that
 * label is what the alert run sends to) and "Baja: WhatsApp" goes on, as the record.
 * Returns how many contacts carried the number.
 */
export async function optOutWhatsApp(waId: string): Promise<number> {
  // The id is the number without "+"; parsing restores the Argentine 9 if it is missing,
  // so it matches the E.164 the form stored.
  const e164 = parseWhatsAppNumber(`+${waId}`, "AR")?.e164 ?? `+${waId}`;
  const [channelKey, optOutKey] = await Promise.all([
    labelKey(CHANNEL_LABEL.whatsapp),
    labelKey(WHATSAPP_OPT_OUT_LABEL),
  ]);
  const { contacts } = wixAdmin();
  const { items } = await contacts.queryContacts().eq("primaryInfo.phone", e164).limit(50).find();
  for (const contact of items) {
    if (!contact._id) continue;
    await contacts.labelContact(contact._id, [optOutKey]);
    await contacts.unlabelContact(contact._id, [channelKey]);
  }
  // They just wrote to us, so a free-text reply is allowed (24 h window).
  await sendWhatsApp(textMessage(e164, OPT_OUT_REPLY));
  return items.length;
}
