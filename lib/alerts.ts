// The alert run: find the boats published since the last run and tell the newsletter
// subscribers who follow their model. Everything that talks to Wix or WhatsApp comes in
// as `deps` (lib/alerts-wix.ts wires the real ones), so this decision logic is
// unit-tested without a network.
import { modelsInListing, type BoatModel } from "./boat-models";
import { boatHref } from "./landings";

export type AlertBoat = { id: string; name: string; slug: string; priceUsd: number | null };

/** A newsletter contact as an alert needs it. */
export type Subscriber = {
  contactId: string;
  /** E.164 — set when the contact chose WhatsApp and has not answered BAJA. */
  whatsapp: string | null;
  /** Set when the contact chose email and is still subscribed to it. */
  email: string | null;
  /** Slugs of the models followed, or "all" for "Modelo: Todos". */
  follows: string[] | "all";
};

/** The template parameters of one alert (see alertMessage in lib/whatsapp.ts). */
export type AlertParams = { model: string; boatName: string; price: string; path: string };

/** What one boat's alert did — logged in the Wix collection and returned by the run. */
export type AlertOutcome = {
  boatId: string;
  boatName: string;
  models: string[];
  whatsappSent: number;
  whatsappFailed: string[];
  /** Email subscribers who match: automatic email is not wired yet, so they are listed. */
  emailPending: string[];
};

export type AlertDeps = {
  listBoats(): Promise<AlertBoat[]>;
  /** Ids of the boats already in the alerts log. */
  listLogged(): Promise<Set<string>>;
  /** Log boats as seen without alerting anyone. */
  logSeeded(boats: AlertBoat[]): Promise<void>;
  /** Log a boat as being alerted; false when it already is (another run got there). */
  claim(boat: AlertBoat, models: BoatModel[]): Promise<boolean>;
  finish(outcome: AlertOutcome): Promise<void>;
  /** Contacts following any of `models`, plus everyone on "Modelo: Todos". */
  subscribersFor(models: BoatModel[]): Promise<Subscriber[]>;
  sendWhatsApp(to: string, params: AlertParams): Promise<{ ok: true } | { ok: false; error: string }>;
  formatPrice(priceUsd: number | null): string | null;
};

export type AlertRunResult = {
  /** Boats logged without an alert: the first run, or a burst that looks like a reset. */
  seeded: number;
  alerts: AlertOutcome[];
  warning?: string;
};

/**
 * More new boats than this in one run is not the owner publishing — the owner lists a
 * boat or two at a time. It is the log having been emptied or recreated, and alerting
 * then would message every subscriber about boats that were listed long ago.
 */
export const MAX_NEW_PER_RUN = 15;

/** WhatsApp sends in flight at once — well inside the Cloud API's per-second limits. */
export const SEND_BATCH = 10;

export function alertParams(
  boat: AlertBoat,
  followed: BoatModel | null,
  formatPrice: AlertDeps["formatPrice"],
): AlertParams {
  return {
    // Reads after "Entró al catálogo de MG Náutica un …".
    model: followed?.label ?? "barco nuevo",
    boatName: boat.name,
    price: formatPrice(boat.priceUsd) ?? "Precio a consultar",
    path: boatHref(boat.slug).replace(/^\//, ""),
  };
}

export async function runAlerts(deps: AlertDeps): Promise<AlertRunResult> {
  const boats = await deps.listBoats();
  const logged = await deps.listLogged();

  // An empty log is the very first run: every boat in the catalog was listed before
  // the alerts existed, so they are recorded and nobody is messaged.
  if (logged.size === 0) {
    await deps.logSeeded(boats);
    return { seeded: boats.length, alerts: [] };
  }

  const fresh = boats.filter((b) => !logged.has(b.id));
  if (fresh.length > MAX_NEW_PER_RUN) {
    await deps.logSeeded(fresh);
    return {
      seeded: fresh.length,
      alerts: [],
      warning: `${fresh.length} new boats in one run looks like a reset log — logged without alerting.`,
    };
  }

  const alerts: AlertOutcome[] = [];
  for (const boat of fresh) {
    const models = modelsInListing(boat.name);
    // Claim before sending: two overlapping runs must never message anyone twice. A
    // run that dies mid-send leaves the boat claimed — a missed alert, never a repeat.
    if (!(await deps.claim(boat, models))) continue;

    const outcome: AlertOutcome = {
      boatId: boat.id,
      boatName: boat.name,
      models: models.map((m) => m.label),
      whatsappSent: 0,
      whatsappFailed: [],
      emailPending: [],
    };
    // One message per number, even if it sits on two contacts.
    const recipients = new Map<string, AlertParams>();
    for (const sub of await deps.subscribersFor(models)) {
      const followed =
        sub.follows === "all" ? null : (models.find((m) => sub.follows.includes(m.slug)) ?? null);
      // The query is by label; this guards against a contact that matched on neither.
      if (sub.follows !== "all" && !followed) continue;
      if (sub.whatsapp && !recipients.has(sub.whatsapp)) {
        recipients.set(sub.whatsapp, alertParams(boat, followed, deps.formatPrice));
      }
      if (sub.email) outcome.emailPending.push(sub.email);
    }

    // A few at a time: one by one, a long list would outlast the function's time limit
    // halfway through — and a claimed boat is never retried.
    const queue = [...recipients];
    for (let i = 0; i < queue.length; i += SEND_BATCH) {
      const batch = queue.slice(i, i + SEND_BATCH);
      const results = await Promise.all(batch.map(([to, params]) => deps.sendWhatsApp(to, params)));
      results.forEach((sent, j) => {
        if (sent.ok) outcome.whatsappSent++;
        else outcome.whatsappFailed.push(`${batch[j][0]}: ${sent.error}`);
      });
    }

    await deps.finish(outcome);
    alerts.push(outcome);
  }
  return { seeded: 0, alerts };
}
