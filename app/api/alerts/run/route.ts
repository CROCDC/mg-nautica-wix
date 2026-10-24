import { NextResponse, type NextRequest } from "next/server";
import { runAlerts } from "@/lib/alerts";
import { wixAlertDeps } from "@/lib/alerts-wix";
import { safeEqual } from "@/lib/secrets";
import { whatsappConfigured } from "@/lib/whatsapp";

// The scheduled alert run (.github/workflows/alerts.yml calls it every 15 minutes; a
// Vercel Cron would too — it sends the same `Authorization: Bearer $CRON_SECRET`).
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && safeEqual(req.headers.get("authorization") ?? "", `Bearer ${secret}`);
}

async function run(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // Without WhatsApp every send would fail, and a boat is never alerted twice — so
  // running unconfigured would quietly burn those alerts. Better not to start.
  if (!whatsappConfigured()) {
    return NextResponse.json({ error: "WhatsApp is not configured" }, { status: 503 });
  }

  try {
    const result = await runAlerts(wixAlertDeps);
    console.info("[alerts] run:", JSON.stringify(result));
    // Counts only: the response may end up in a CI log, the numbers and emails may not.
    return NextResponse.json({
      seeded: result.seeded,
      warning: result.warning,
      alerts: result.alerts.map((a) => ({
        boat: a.boatName,
        models: a.models,
        whatsappSent: a.whatsappSent,
        whatsappFailed: a.whatsappFailed.length,
        emailPending: a.emailPending.length,
      })),
    });
  } catch (err) {
    console.error("[alerts] run failed:", err);
    return NextResponse.json({ error: "alert run failed" }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
