import "server-only";
import type { AlertBoat, AlertDeps, AlertOutcome, Subscriber } from "./alerts";
import { modelLabel, type BoatModel } from "./boat-models";
import { ALL_MODELS_LABEL, CHANNEL_LABEL, WHATSAPP_OPT_OUT_LABEL } from "./newsletter";
import { alertMessage, sendWhatsApp } from "./whatsapp";
import { formatUsd, getAllBoats } from "./wix";
import { labelKey, wixAdmin } from "./wix-admin";

// The real dependencies of the alert run (lib/alerts.ts): the live catalog, the
// newsletter contacts in the Wix CRM, WhatsApp, and the alerts log — a Wix CMS
// collection the owner can open in the dashboard to see which boat was announced to
// how many people. Each boat's id is the item _id, which is what makes a claim atomic.
export const ALERTS_COLLECTION = "AlertasNewsletter";

const PAGE = 1000;

type WixError = { code?: string; details?: { applicationError?: { code?: string } } };
const errorCode = (err: unknown) => {
  const e = err as WixError | null;
  return e?.code ?? e?.details?.applicationError?.code;
};
const isDuplicate = (err: unknown) =>
  ["WD_ITEM_ALREADY_EXISTS", "WDE0074"].includes(errorCode(err) ?? "") ||
  String((err as Error | null)?.message).includes("WDE0074");
const isMissingCollection = (err: unknown) =>
  ["WD_SCHEMA_DOES_NOT_EXIST", "WDE0025", "NOT_FOUND"].includes(errorCode(err) ?? "") ||
  (err as { status?: number } | null)?.status === 404;

/** Create the log collection the first time; admin-only, it is never read by the site. */
async function ensureCollection() {
  const { collections } = wixAdmin();
  try {
    await collections.getDataCollection(ALERTS_COLLECTION);
  } catch (err) {
    if (!isMissingCollection(err)) throw err;
    await collections.createDataCollection({
      _id: ALERTS_COLLECTION,
      displayName: "Alertas del newsletter",
      fields: [
        { key: "nombre", displayName: "Embarcación", type: "TEXT" },
        { key: "modelos", displayName: "Modelos", type: "TEXT" },
        { key: "estado", displayName: "Estado", type: "TEXT" },
        { key: "whatsappEnviados", displayName: "WhatsApp enviados", type: "NUMBER" },
        { key: "whatsappFallidos", displayName: "WhatsApp fallidos", type: "TEXT" },
        { key: "emailPendientes", displayName: "Emails pendientes", type: "TEXT" },
        { key: "procesado", displayName: "Procesado", type: "DATETIME" },
      ],
      permissions: { insert: "ADMIN", update: "ADMIN", remove: "ADMIN", read: "ADMIN" },
    });
  }
}

const logItem = (boat: Pick<AlertBoat, "id" | "name">, fields: Record<string, unknown>) => ({
  _id: boat.id,
  nombre: boat.name,
  procesado: new Date(),
  ...fields,
});

async function listLogged(): Promise<Set<string>> {
  await ensureCollection();
  const ids = new Set<string>();
  let page = await wixAdmin().items.query(ALERTS_COLLECTION).limit(PAGE).find();
  for (;;) {
    for (const item of page.items) ids.add(item._id);
    if (!page.hasNext()) return ids;
    page = await page.next();
  }
}

async function logSeeded(boats: AlertBoat[]) {
  for (let i = 0; i < boats.length; i += PAGE) {
    // bulkInsert skips ids that already exist, so a retried seed is harmless.
    await wixAdmin().items.bulkInsert(
      ALERTS_COLLECTION,
      boats.slice(i, i + PAGE).map((b) => logItem(b, { estado: "ya publicado (sin aviso)" })),
    );
  }
}

async function claim(boat: AlertBoat, models: BoatModel[]): Promise<boolean> {
  try {
    await wixAdmin().items.insert(
      ALERTS_COLLECTION,
      logItem(boat, { modelos: models.map((m) => m.label).join(", "), estado: "enviando" }),
    );
    return true;
  } catch (err) {
    if (isDuplicate(err)) return false;
    throw err;
  }
}

async function finish(o: AlertOutcome) {
  await wixAdmin().items.update(
    ALERTS_COLLECTION,
    logItem(
      { id: o.boatId, name: o.boatName },
      {
        modelos: o.models.join(", "),
        estado: o.whatsappFailed.length ? "enviado con errores" : "enviado",
        whatsappEnviados: o.whatsappSent,
        whatsappFallidos: o.whatsappFailed.join("\n"),
        emailPendientes: o.emailPending.join(", "),
      },
    ),
  );
}

async function subscribersFor(models: BoatModel[]): Promise<Subscriber[]> {
  const [allKey, waKey, emailKey, optOutKey, ...modelKeys] = await Promise.all(
    [ALL_MODELS_LABEL, CHANNEL_LABEL.whatsapp, CHANNEL_LABEL.email, WHATSAPP_OPT_OUT_LABEL, ...models.map(modelLabel)].map(
      labelKey,
    ),
  );
  const slugByKey = new Map(modelKeys.map((key, i) => [key, models[i].slug]));

  const subscribers: Subscriber[] = [];
  let page = await wixAdmin()
    .contacts.queryContacts()
    .hasSome("info.labelKeys", [allKey, ...modelKeys])
    .limit(PAGE)
    .find();
  for (;;) {
    for (const c of page.items) {
      const keys = c.info?.labelKeys?.items ?? [];
      subscribers.push({
        contactId: c._id ?? "",
        whatsapp:
          keys.includes(waKey) && !keys.includes(optOutKey)
            ? (c.primaryPhone?.e164Phone ?? c.primaryInfo?.phone ?? null)
            : null,
        email:
          keys.includes(emailKey) && c.primaryEmail?.subscriptionStatus !== "UNSUBSCRIBED"
            ? (c.primaryInfo?.email ?? null)
            : null,
        follows: keys.includes(allKey)
          ? "all"
          : keys.map((k) => slugByKey.get(k)).filter((s): s is string => Boolean(s)),
      });
    }
    if (!page.hasNext()) return subscribers;
    page = await page.next();
  }
}

export const wixAlertDeps: AlertDeps = {
  listBoats: async () =>
    (await getAllBoats()).map((b) => ({ id: b.id, name: b.name, slug: b.slug, priceUsd: b.priceUsd })),
  listLogged,
  logSeeded,
  claim,
  finish,
  subscribersFor,
  sendWhatsApp: async (to, params) => {
    const sent = await sendWhatsApp(alertMessage(to, params));
    return sent.ok ? { ok: true } : sent;
  },
  formatPrice: formatUsd,
};
