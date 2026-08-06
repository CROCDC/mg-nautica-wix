/**
 * Guard test: protects the validity of the responsive layer. Run it first.
 *
 * The responsive tests assert `document.documentElement.scrollWidth <= viewport
 * width`. But if any page sets `overflow-x: hidden` on <html> or <body>, scrollWidth
 * is CLAMPED to the viewport width regardless of how broken the layout is — so a
 * broken page would still report "no overflow" and every responsive test would pass
 * silently. You'd have no idea.
 *
 * This test fails fast if that footgun is present on any public page. Until it
 * passes, the responsive screenshots and overflow assertions mean nothing.
 *
 * This is the reusable pattern worth internalizing: a guard test that protects the
 * validity of another test layer. Replicate it anywhere a clever assertion has a
 * silent-pass failure mode.
 */

import { test, expect, newBlockedContext } from "./fixtures";
import { PUBLIC_PAGES } from "./pages";

test("no overflow-x hidden on html or body", async ({ browser }) => {
  const context = await newBlockedContext(browser, { width: 375, height: 667 });
  const page = await context.newPage();
  const failures: string[] = [];

  try {
    for (const path of PUBLIC_PAGES) {
      await page.goto(path, { waitUntil: "networkidle" });
      const result = await page.evaluate(() => ({
        html: getComputedStyle(document.documentElement).overflowX,
        body: getComputedStyle(document.body).overflowX,
      }));
      if (result.html === "hidden" || result.body === "hidden") {
        failures.push(`${path} (html: ${result.html}, body: ${result.body})`);
      }
    }
  } finally {
    await context.close();
  }

  expect(
    failures,
    "overflow-x:hidden on html/body hides real horizontal overflow and " +
      `invalidates the responsive layer: ${failures.join(", ")}`,
  ).toEqual([]);
});
