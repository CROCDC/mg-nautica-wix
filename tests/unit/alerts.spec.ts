/**
 * Unit layer for the alert run — who gets messaged when a boat is published.
 *
 * The run talks to Wix and WhatsApp only through `deps`, so these specs drive it with
 * in-memory fakes and read back every message it tried to send. The rules worth
 * pinning are the ones whose failure is a stranger's phone buzzing: nothing on the first
 * run, never twice for the same boat, only to people who follow that model, and not to
 * someone who answered BAJA.
 */

import { test, expect } from "@playwright/test";
import {
  MAX_NEW_PER_RUN,
  SEND_BATCH,
  runAlerts,
  type AlertBoat,
  type AlertDeps,
  type AlertOutcome,
  type AlertParams,
  type Subscriber,
} from "@/lib/alerts";
import { type BoatModel } from "@/lib/boat-models";

const boat = (id: string, name: string, priceUsd: number | null = 25000): AlertBoat => ({
  id,
  name,
  slug: id,
  priceUsd,
});

const CATALOG = [boat("a", "VELERO LIMBO 21"), boat("b", "CRUCERO MAMBA 25")];

const sub = (contactId: string, follows: string[] | "all", whatsapp: string | null, email: string | null = null): Subscriber => ({
  contactId,
  follows,
  whatsapp,
  email,
});

/** In-memory deps: a catalog, a log, a contact list — and a record of what was sent. */
type FakeOptions = {
  boats?: AlertBoat[];
  logged?: string[];
  subscribers?: Subscriber[];
  failFor?: string[];
  /** False for a boat another run is taken to have claimed already. */
  claimable?: (boat: AlertBoat) => boolean;
};

function fakeDeps({
  boats = CATALOG,
  logged = ["a", "b"],
  subscribers = [],
  failFor = [],
  claimable = () => true,
}: FakeOptions = {}) {
  const log = new Set(logged);
  const sent: { to: string; params: AlertParams }[] = [];
  const finished: AlertOutcome[] = [];
  const seeded: string[] = [];
  const queriedFor: string[][] = [];

  const deps: AlertDeps = {
    listBoats: async () => boats,
    listLogged: async () => new Set(log),
    logSeeded: async (bs) => {
      for (const b of bs) {
        log.add(b.id);
        seeded.push(b.id);
      }
    },
    claim: async (b) => {
      if (log.has(b.id) || !claimable(b)) return false;
      log.add(b.id);
      return true;
    },
    finish: async (o) => void finished.push(o),
    // Like the real query: followers of any of the models, plus "Modelo: Todos".
    subscribersFor: async (models: BoatModel[]) => {
      queriedFor.push(models.map((m) => m.slug));
      return subscribers.filter(
        (s) => s.follows === "all" || s.follows.some((slug) => models.some((m) => m.slug === slug)),
      );
    },
    sendWhatsApp: async (to, params) => {
      sent.push({ to, params });
      return failFor.includes(to) ? { ok: false, error: "131026 undeliverable" } : { ok: true };
    },
    formatPrice: (n) => (n == null ? null : `US$ ${n.toLocaleString("en-US")}`),
  };
  return { deps, sent, finished, seeded, queriedFor, log };
}

// ----- When nobody is messaged -----------------------------------------------------

test("the first run logs the whole catalog and messages nobody", async () => {
  const { deps, sent, seeded } = fakeDeps({
    logged: [],
    subscribers: [sub("c1", "all", "+5491100000001")],
  });

  const result = await runAlerts(deps);

  expect(result).toEqual({ seeded: 2, alerts: [] });
  expect(seeded).toEqual(["a", "b"]);
  expect(sent).toEqual([]);
});

test("a run with nothing new does nothing", async () => {
  const { deps, sent, finished } = fakeDeps({ subscribers: [sub("c1", "all", "+5491100000001")] });

  expect(await runAlerts(deps)).toEqual({ seeded: 0, alerts: [] });
  expect(sent).toEqual([]);
  expect(finished).toEqual([]);
});

test("a burst of new boats is treated as a reset log, not as news", async () => {
  const burst = Array.from({ length: MAX_NEW_PER_RUN + 1 }, (_, i) => boat(`n${i}`, "VELERO LIMBO 23"));
  const { deps, sent, seeded } = fakeDeps({
    boats: [...CATALOG, ...burst],
    subscribers: [sub("c1", ["limbo"], "+5491100000001")],
  });

  const result = await runAlerts(deps);

  expect(result.seeded).toBe(burst.length);
  expect(result.warning).toContain("reset");
  expect(seeded).toHaveLength(burst.length);
  expect(sent).toEqual([]);
});

test("a boat another run already claimed is skipped", async () => {
  const { deps, sent } = fakeDeps({
    boats: [...CATALOG, boat("c", "VELERO LIMBO 23")],
    subscribers: [sub("c1", ["limbo"], "+5491100000001")],
    claimable: (b) => b.id !== "c",
  });

  expect((await runAlerts(deps)).alerts).toEqual([]);
  expect(sent).toEqual([]);
});

// ----- Who is messaged ---------------------------------------------------------------

test("a new boat reaches its model's followers and the follow-everything list", async () => {
  const { deps, sent, finished } = fakeDeps({
    boats: [...CATALOG, boat("c", "VELERO PLENAMAR 23 | LISTO PARA NAVEGAR", 31000)],
    subscribers: [
      sub("follower", ["plenamar", "colibri"], "+5491100000001"),
      sub("everything", "all", "+5491100000002"),
      sub("other-model", ["limbo"], "+5491100000003"),
    ],
  });

  const result = await runAlerts(deps);

  expect(sent).toEqual([
    {
      to: "+5491100000001",
      params: {
        model: "Plenamar",
        boatName: "VELERO PLENAMAR 23 | LISTO PARA NAVEGAR",
        price: "US$ 31,000",
        path: "product-page/c",
      },
    },
    {
      to: "+5491100000002",
      // Someone following everything gets the generic wording.
      params: expect.objectContaining({ model: "barco nuevo" }),
    },
  ]);
  expect(result.alerts).toEqual([
    {
      boatId: "c",
      boatName: "VELERO PLENAMAR 23 | LISTO PARA NAVEGAR",
      models: ["Plenamar"],
      whatsappSent: 2,
      whatsappFailed: [],
      emailPending: [],
    },
  ]);
  expect(finished).toEqual(result.alerts);
});

test("a boat whose name matches no model goes only to the follow-everything list", async () => {
  const { deps, sent, queriedFor } = fakeDeps({
    boats: [...CATALOG, boat("c", "VELERO CLÁSICO DOBLE PROA")],
    subscribers: [sub("follower", ["limbo"], "+5491100000001"), sub("everything", "all", "+5491100000002")],
  });

  const result = await runAlerts(deps);

  expect(queriedFor).toEqual([[]]);
  expect(sent.map((s) => s.to)).toEqual(["+5491100000002"]);
  expect(result.alerts[0].models).toEqual([]);
});

test("an opted-out or email-only subscriber gets no WhatsApp; email ones are listed", async () => {
  // whatsapp: null is how the Wix side hands over someone who answered BAJA.
  const { deps, sent } = fakeDeps({
    boats: [...CATALOG, boat("c", "VELERO LIMBO 23")],
    subscribers: [
      sub("opted-out", ["limbo"], null),
      sub("by-email", ["limbo"], null, "nombre@ejemplo.com"),
    ],
  });

  const result = await runAlerts(deps);

  expect(sent).toEqual([]);
  expect(result.alerts[0].emailPending).toEqual(["nombre@ejemplo.com"]);
});

test("one number on two contacts is messaged once", async () => {
  const { deps, sent } = fakeDeps({
    boats: [...CATALOG, boat("c", "VELERO LIMBO 23")],
    subscribers: [sub("c1", ["limbo"], "+5491100000001"), sub("c2", "all", "+5491100000001")],
  });

  await runAlerts(deps);

  expect(sent).toHaveLength(1);
});

test("a failed send is recorded and the rest still go out", async () => {
  const { deps, sent } = fakeDeps({
    boats: [...CATALOG, boat("c", "VELERO LIMBO 23")],
    subscribers: [sub("c1", ["limbo"], "+5491100000001"), sub("c2", ["limbo"], "+5491100000002")],
    failFor: ["+5491100000001"],
  });

  const result = await runAlerts(deps);

  expect(sent).toHaveLength(2);
  expect(result.alerts[0]).toMatchObject({
    whatsappSent: 1,
    whatsappFailed: ["+5491100000001: 131026 undeliverable"],
  });
});

test("a boat is never alerted twice across runs", async () => {
  const { deps, sent } = fakeDeps({
    boats: [...CATALOG, boat("c", "VELERO LIMBO 23")],
    subscribers: [sub("c1", ["limbo"], "+5491100000001")],
  });

  await runAlerts(deps);
  await runAlerts(deps);

  expect(sent).toHaveLength(1);
});

// ----- The message -------------------------------------------------------------------

test("an unpriced boat says so instead of an empty price", async () => {
  const { deps, sent } = fakeDeps({
    boats: [...CATALOG, boat("c", "VELERO LIMBO 23", null)],
    subscribers: [sub("c1", ["limbo"], "+5491100000001")],
  });

  await runAlerts(deps);

  expect(sent[0].params.price).toBe("Precio a consultar");
});

test("a boat with its own landing links to the landing", async () => {
  const thalia = { id: "t", name: "MOTOVELERO CLÁSICO THALIA", slug: "motovelero-clásico-thalia-único", priceUsd: 1 };
  const { deps, sent } = fakeDeps({
    boats: [...CATALOG, thalia],
    subscribers: [sub("c1", "all", "+5491100000001")],
  });

  await runAlerts(deps);

  expect(sent[0].params.path).toBe("thalia");
});

test("a long list goes out a batch at a time, every number once", async () => {
  const many = Array.from({ length: 25 }, (_, i) =>
    sub(`c${i}`, ["limbo"], `+54911000000${String(i).padStart(2, "0")}`),
  );
  const { deps } = fakeDeps({ boats: [...CATALOG, boat("c", "VELERO LIMBO 23")], subscribers: many });
  let inFlight = 0;
  let peak = 0;
  const to: string[] = [];
  deps.sendWhatsApp = async (number) => {
    inFlight++;
    peak = Math.max(peak, inFlight);
    await new Promise((r) => setTimeout(r, 5));
    inFlight--;
    to.push(number);
    return { ok: true };
  };

  const result = await runAlerts(deps);

  expect(result.alerts[0].whatsappSent).toBe(25);
  expect(new Set(to).size).toBe(25);
  expect(peak).toBeLessThanOrEqual(SEND_BATCH);
});
