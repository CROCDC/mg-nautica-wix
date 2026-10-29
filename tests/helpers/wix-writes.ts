/**
 * Read back the CRM writes the mocked server faked (see fakeCrmWrite in
 * mock/wix-http-mock.mjs) — what the newsletter actually sent to Wix.
 *
 * The log outlives a run and every spec shares it, so specs filter by an email or phone
 * unique to the test rather than counting lines.
 */

import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const WIX_WRITES_LOG = join(tmpdir(), "mg-nautica-wix-mock-writes.jsonl");

export type WixWrite = {
  method: string;
  path: string;
  body: Record<string, unknown>;
  /** What the mock answered — e.g. the duplicateContactId of a 409. */
  status: number;
  response: Record<string, unknown>;
};

export function readWixWrites(): WixWrite[] {
  let text = "";
  try {
    text = readFileSync(WIX_WRITES_LOG, "utf8");
  } catch {
    return [];
  }
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as WixWrite);
}

/** An address no other test (or earlier run) has used. `prefix` steers the mock. */
export function uniqueEmail(prefix = "test"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/**
 * A Buenos Aires mobile no other test is likely to have used, as a visitor would type
 * it (no 9, no 15) and as it must reach Wix (E.164, with the 9 restored).
 */
export function uniquePhone(): { typed: string; e164: string } {
  const digits = String(Math.floor(Math.random() * 1e7)).padStart(7, "0");
  return { typed: `11 2${digits.slice(0, 3)}-${digits.slice(3)}`, e164: `+549112${digits}` };
}

/** Secrets the mocked server is started with (playwright.config.ts), for the API specs. */
export const TEST_SECRETS = {
  cron: "test-cron-secret",
  whatsappVerify: "test-verify-token",
  whatsappApp: "test-app-secret",
};

/** The one phone the mock's contact lookup finds (OPT_OUT_PHONE in mock/wix-http-mock.mjs). */
export const OPT_OUT_PHONE = "+5491155550001";
