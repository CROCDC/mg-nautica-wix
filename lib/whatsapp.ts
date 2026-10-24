import "server-only";
import type { AlertParams } from "./alerts";

// WhatsApp Cloud API (Meta): the alerts go out as the pre-approved template below, the
// only kind of message a business may start a chat with. Configured from the
// environment — see docs/NEWSLETTER-PLAN.md §6 for the Meta-side setup and the exact
// template text, which must match these parameters one for one.
const token = process.env.WHATSAPP_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const apiVersion = process.env.WHATSAPP_API_VERSION ?? "v24.0";
const template = process.env.WHATSAPP_TEMPLATE ?? "alerta_modelo";
const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANG ?? "es_AR";

export function whatsappConfigured(): boolean {
  return Boolean(token && phoneNumberId);
}

/**
 * Meta rejects a template parameter that is empty or holds a newline, a tab or four
 * spaces in a row — listing names come from the Wix dashboard, so they are cleaned.
 */
export function templateText(value: string, max = 60): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return "-";
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + "…" : clean;
}

/** The Cloud API takes the number without its "+". */
const recipient = (e164: string) => e164.replace(/^\+/, "");

export type WhatsAppMessage = Record<string, unknown>;

/**
 * The "alerta_modelo" template: body {{1}} model, {{2}} listing name, {{3}} price, and
 * a URL button whose dynamic suffix {{1}} is the path to the boat on the site.
 */
export function alertMessage(to: string, p: AlertParams): WhatsAppMessage {
  return {
    messaging_product: "whatsapp",
    to: recipient(to),
    type: "template",
    template: {
      name: template,
      language: { code: templateLanguage },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: templateText(p.model) },
            { type: "text", text: templateText(p.boatName) },
            { type: "text", text: templateText(p.price) },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          // Slugs carry accents ("motovelero-clásico-…"): the suffix must arrive encoded.
          parameters: [{ type: "text", text: encodeURI(p.path) }],
        },
      ],
    },
  };
}

/** Free text — only allowed as a reply within 24 h of the person writing to us. */
export function textMessage(to: string, body: string): WhatsAppMessage {
  return { messaging_product: "whatsapp", to: recipient(to), type: "text", text: { body } };
}

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

export async function sendWhatsApp(message: WhatsAppMessage): Promise<SendResult> {
  if (!token || !phoneNumberId) return { ok: false, error: "WhatsApp is not configured" };
  try {
    const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(message),
    });
    const data = (await res.json().catch(() => ({}))) as {
      messages?: { id?: string }[];
      error?: { message?: string; code?: number };
    };
    if (res.ok && data.messages?.[0]?.id) return { ok: true, id: data.messages[0].id };
    return {
      ok: false,
      error: `${res.status} ${data.error?.code ?? ""} ${data.error?.message ?? "unknown error"}`.trim(),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
