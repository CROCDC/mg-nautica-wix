/**
 * Unit layer for the WhatsApp side: the alert template payload and the opt-out webhook.
 *
 * Meta rejects a template send whose parameters do not line up with the approved
 * template, and does so per message — a broken payload means every alert of a run
 * fails. So the payload is pinned field by field here, against the template text in
 * docs/NEWSLETTER-PLAN.md §6.
 */

import { test, expect } from "@playwright/test";
import { createHmac } from "node:crypto";
import { alertMessage, templateText, textMessage } from "@/lib/whatsapp";
import { optOutSenders, validSignature } from "@/lib/whatsapp-webhook";

// ----- The alert template ------------------------------------------------------------

test("the alert is the approved template with its three parameters and the link", () => {
  const message = alertMessage("+5491126949628", {
    model: "Plenamar",
    boatName: "VELERO PLENAMAR 23 | LISTO PARA NAVEGAR",
    price: "US$ 31,000",
    path: "product-page/velero-plenamar-23",
  });

  expect(message).toEqual({
    messaging_product: "whatsapp",
    to: "5491126949628", // the Cloud API takes the number without "+"
    type: "template",
    template: {
      name: "alerta_modelo",
      language: { code: "es_AR" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: "Plenamar" },
            { type: "text", text: "VELERO PLENAMAR 23 | LISTO PARA NAVEGAR" },
            { type: "text", text: "US$ 31,000" },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: "product-page/velero-plenamar-23" }],
        },
      ],
    },
  });
});

test("an accented slug reaches the link button encoded", () => {
  const message = alertMessage("+5491126949628", {
    model: "barco nuevo",
    boatName: "x",
    price: "y",
    path: "product-page/velero-clásico-sosiego-33",
  }) as { template: { components: { parameters: { text: string }[] }[] } };

  expect(message.template.components[1].parameters[0].text).toBe(
    "product-page/velero-cl%C3%A1sico-sosiego-33",
  );
});

test("template parameters lose the whitespace Meta rejects", () => {
  expect(templateText("VELERO  PLENAMAR\n23\t| OK")).toBe("VELERO PLENAMAR 23 | OK");
  expect(templateText("   ")).toBe("-");
});

test("a long listing name is cut with an ellipsis", () => {
  const cut = templateText("A".repeat(100));
  expect(cut).toHaveLength(60);
  expect(cut.endsWith("…")).toBe(true);
});

test("a reply is plain text", () => {
  expect(textMessage("+5491126949628", "Listo")).toEqual({
    messaging_product: "whatsapp",
    to: "5491126949628",
    type: "text",
    text: { body: "Listo" },
  });
});

// ----- The webhook signature ---------------------------------------------------------

const SECRET = "app-secret";
const sign = (body: string, secret = SECRET) =>
  "sha256=" + createHmac("sha256", secret).update(body).digest("hex");

test("a delivery signed with the app secret is accepted", () => {
  const body = '{"entry":[]}';
  expect(validSignature(body, sign(body), SECRET)).toBe(true);
});

test("a forged, missing or tampered signature is refused", () => {
  const body = '{"entry":[]}';
  expect(validSignature(body, sign(body, "other-secret"), SECRET)).toBe(false);
  expect(validSignature(body, null, SECRET)).toBe(false);
  expect(validSignature(body, "sha1=abc", SECRET)).toBe(false);
  expect(validSignature('{"entry":[1]}', sign(body), SECRET)).toBe(false);
});

// ----- Reading BAJA ---------------------------------------------------------------------

const delivery = (...messages: object[]) => ({
  object: "whatsapp_business_account",
  entry: [{ id: "1", changes: [{ field: "messages", value: { messaging_product: "whatsapp", messages } }] }],
});
const text = (from: string, body: string) => ({ from, id: "wamid.x", type: "text", text: { body } });

for (const reply of ["BAJA", "baja", " Baja. ", "STOP", "stop!", "Cancelar", "desuscribirme"]) {
  test(`"${reply}" is an opt-out`, () => {
    expect(optOutSenders(delivery(text("5491126949628", reply)))).toEqual(["5491126949628"]);
  });
}

for (const reply of ["¿Se dio de baja el precio?", "bajá el precio", "hola", "Quiero verlo"]) {
  test(`"${reply}" is not an opt-out`, () => {
    expect(optOutSenders(delivery(text("5491126949628", reply)))).toEqual([]);
  });
}

test("a quick-reply button labelled BAJA counts too", () => {
  const button = { from: "5491126949628", type: "button", button: { text: "BAJA", payload: "BAJA" } };
  expect(optOutSenders(delivery(button))).toEqual(["5491126949628"]);
});

test("delivery statuses and other fields are ignored", () => {
  const statuses = {
    entry: [{ changes: [{ field: "messages", value: { statuses: [{ status: "delivered" }] } }] }],
  };
  const otherField = { entry: [{ changes: [{ field: "account_update", value: {} }] }] };
  expect(optOutSenders(statuses)).toEqual([]);
  expect(optOutSenders(otherField)).toEqual([]);
  expect(optOutSenders(null)).toEqual([]);
});

test("one sender writing BAJA twice is one opt-out", () => {
  expect(
    optOutSenders(delivery(text("5491126949628", "BAJA"), text("5491126949628", "baja"))),
  ).toEqual(["5491126949628"]);
});
