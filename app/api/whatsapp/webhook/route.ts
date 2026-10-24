import { NextResponse, type NextRequest } from "next/server";
import { safeEqual } from "@/lib/secrets";
import { optOutSenders, optOutWhatsApp, validSignature } from "@/lib/whatsapp-webhook";

// Meta's WhatsApp webhook. GET is the one-time subscription handshake; POST delivers
// incoming messages and delivery statuses, of which only BAJA is acted on.
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (
    token &&
    params.get("hub.mode") === "subscribe" &&
    safeEqual(params.get("hub.verify_token") ?? "", token)
  ) {
    return new NextResponse(params.get("hub.challenge") ?? "", {
      headers: { "content-type": "text/plain" },
    });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  // The signature covers the exact bytes, so the body is read raw before parsing.
  const raw = await req.text();
  if (!secret || !validSignature(raw, req.headers.get("x-hub-signature-256"), secret)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  try {
    for (const waId of optOutSenders(payload)) await optOutWhatsApp(waId);
  } catch (err) {
    // A non-2xx makes Meta redeliver, which is what an unprocessed BAJA should get.
    console.error("[whatsapp] opt-out failed:", err);
    return new NextResponse("Error", { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
