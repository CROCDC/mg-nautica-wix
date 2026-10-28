/**
 * HTTP layer for the two machine-facing endpoints of the WhatsApp alerts:
 *
 *  - /api/alerts/run — called every 15 minutes by .github/workflows/alerts.yml. It can
 *    message every subscriber, so the specs here are about who may start it and that it
 *    refuses to start half-configured. The decisions inside a run are unit-tested
 *    (unit/alerts.spec.ts) against in-memory fakes.
 *  - /api/whatsapp/webhook — Meta's callback. A BAJA has to take the number off the
 *    alerts with nobody in the loop, and nothing unsigned may touch a contact.
 *
 * The mocked server runs with the secrets in TEST_SECRETS and WhatsApp unconfigured, so
 * nothing here can reach Meta; the CRM calls land in the mock and are read back.
 */

import { createHmac } from "node:crypto";
import { test, expect } from "./fixtures";
import { OPT_OUT_PHONE, TEST_SECRETS, readWixWrites } from "./helpers/wix-writes";
import { WHATSAPP_ENABLED } from "@/lib/newsletter-form";

// The opt-out specs read the shared CRM log from a starting point, so they run in order.
test.describe.configure({ mode: "serial" });

// ----- /api/alerts/run -----------------------------------------------------------------

test.describe("alert run", () => {
  const url = "/api/alerts/run";

  test("refuses a call without the cron secret", async ({ request }) => {
    expect((await request.post(url)).status()).toBe(401);
    expect((await request.get(url)).status()).toBe(401);
  });

  test("refuses a wrong secret", async ({ request }) => {
    const res = await request.post(url, { headers: { authorization: "Bearer not-the-secret" } });
    expect(res.status()).toBe(401);
  });

  test("does not start while WhatsApp is switched off or unconfigured", async ({ request }) => {
    // A boat is alerted at most once, so a run whose sends all fail would burn those
    // alerts for good. It must refuse before touching the catalog or the log.
    const before = readWixWrites().length;
    const res = await request.post(url, {
      headers: { authorization: `Bearer ${TEST_SECRETS.cron}` },
    });

    expect(res.status()).toBe(503);
    expect(await res.json()).toEqual({
      error: WHATSAPP_ENABLED ? "WhatsApp is not configured" : "WhatsApp alerts are switched off",
    });
    expect(readWixWrites().slice(before)).toEqual([]);
  });
});

// ----- /api/whatsapp/webhook ---------------------------------------------------------

const webhook = "/api/whatsapp/webhook";

const sign = (body: string) =>
  "sha256=" + createHmac("sha256", TEST_SECRETS.whatsappApp).update(body).digest("hex");

const incoming = (from: string, body: string) =>
  JSON.stringify({
    object: "whatsapp_business_account",
    entry: [
      {
        id: "1",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              messages: [{ from, id: "wamid.x", timestamp: "1", type: "text", text: { body } }],
            },
          },
        ],
      },
    ],
  });

test.describe("WhatsApp webhook", () => {
  test("answers Meta's subscription handshake with the challenge", async ({ request }) => {
    const res = await request.get(
      `${webhook}?hub.mode=subscribe&hub.verify_token=${TEST_SECRETS.whatsappVerify}&hub.challenge=1158201444`,
    );
    expect(res.status()).toBe(200);
    expect(await res.text()).toBe("1158201444");
  });

  test("refuses the handshake with a wrong verify token", async ({ request }) => {
    const res = await request.get(`${webhook}?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=1`);
    expect(res.status()).toBe(403);
  });

  test("refuses an unsigned or forged delivery and touches no contact", async ({ request }) => {
    const before = readWixWrites().length;
    const body = incoming("5491155550001", "BAJA");

    const unsigned = await request.post(webhook, { data: body, headers: { "content-type": "application/json" } });
    const forged = await request.post(webhook, {
      data: body,
      headers: { "content-type": "application/json", "x-hub-signature-256": "sha256=" + "0".repeat(64) },
    });

    expect(unsigned.status()).toBe(401);
    expect(forged.status()).toBe(401);
    expect(readWixWrites().slice(before)).toEqual([]);
  });

  test("an ordinary message is acknowledged and changes nothing", async ({ request }) => {
    const before = readWixWrites().length;
    const body = incoming("5491155550001", "Hola, ¿sigue disponible el Plenamar?");

    const res = await request.post(webhook, {
      data: body,
      headers: { "content-type": "application/json", "x-hub-signature-256": sign(body) },
    });

    expect(res.status()).toBe(200);
    expect(readWixWrites().slice(before)).toEqual([]);
  });

  for (const [from, label] of [
    ["5491155550001", "as WhatsApp sends it"],
    ["541155550001", "without the Argentine 9"],
  ] as const) {
    test(`BAJA takes the number off the alerts (${label})`, async ({ request }) => {
      const before = readWixWrites().length;
      const body = incoming(from, "BAJA");

      const res = await request.post(webhook, {
        data: body,
        headers: { "content-type": "application/json", "x-hub-signature-256": sign(body) },
      });
      expect(res.status()).toBe(200);

      const calls = readWixWrites().slice(before);
      // Looked up by the E.164 the form stored — the 9 restored if it was missing…
      const lookup = calls.find((w) => w.path.endsWith("/contacts/v4/contacts/query"));
      expect(JSON.stringify(lookup?.body)).toContain(OPT_OUT_PHONE);
      // …then marked as opted out, and taken off the channel the alerts are sent to.
      const contactId = (lookup?.response as { contacts: { id: string }[] }).contacts[0].id;
      const onContact = calls.filter((w) => w.path.endsWith(`/contacts/${contactId}/labels`));
      expect(onContact.map((w) => [w.method, w.body.labelKeys])).toEqual([
        ["POST", ["custom.baja-whatsapp"]],
        ["DELETE", ["custom.canal-whatsapp"]],
      ]);
    });
  }
});
