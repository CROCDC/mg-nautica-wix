/**
 * Read back the CRM writes the mocked server faked (see fakeCrmWrite in
 * mock/wix-http-mock.mjs) — what the newsletter actually sent to Wix.
 *
 * The log outlives a run and every spec shares it, so specs filter by an email unique
 * to the test rather than counting lines.
 */

import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const WIX_WRITES_LOG = join(tmpdir(), "mg-nautica-wix-mock-writes.jsonl");

export type WixWrite = {
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
