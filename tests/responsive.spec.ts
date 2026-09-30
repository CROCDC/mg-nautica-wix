/**
 * Responsive / visual-regression layer: every public page x every viewport.
 *
 * Two assertions per cell:
 *   1. No horizontal overflow — scrollWidth must not exceed the viewport width
 *      (+1px tolerance for sub-pixel rounding).
 *   2. A full-page screenshot is written to tests/screenshots/, COMMITTED as the
 *      visual baseline; diffs surface during code review.
 *
 * The overflow assertion is only trustworthy if overflow-detection.spec.ts passes
 * first (no overflow-x:hidden on html/body) — see that file.
 */

import path from "node:path";
import { test, expect, newBlockedContext, type Page } from "./fixtures";
import { PUBLIC_PAGES, VIEWPORTS, pageSlug } from "./pages";

const SCREENSHOT_DIR = path.join(__dirname, "screenshots");

/**
 * The hero stat counters animate up from 0 on mount, so a screenshot taken mid-count
 * would bake a different number into the baseline on every run. Reduced motion does not
 * stop them (they are driven by requestAnimationFrame, not CSS), so wait for the text to
 * stop changing — pages without counters settle immediately.
 */
async function waitForCountersToSettle(page: Page): Promise<void> {
  const counters = page.locator(".hero-stat-num");
  if ((await counters.count()) === 0) return;

  let previous: string[] | null = null;
  await expect
    .poll(
      async () => {
        const current = await counters.allTextContents();
        const settled = previous !== null && JSON.stringify(current) === JSON.stringify(previous);
        previous = current;
        return settled;
      },
      { intervals: [100, 150, 250, 400, 600], timeout: 10_000 },
    )
    .toBe(true);
}

/**
 * A full-page screenshot does not scroll, so `loading="lazy"` images below the fold are
 * never requested and bake blank boxes into the baseline. Switching them to eager makes
 * the browser fetch them right away; then wait until every image has settled.
 */
async function loadLazyImages(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((img) => {
      img.loading = "eager";
    });
  });
  await expect
    .poll(() => page.evaluate(() => [...document.images].every((img) => img.complete)), {
      timeout: 20_000,
    })
    .toBe(true);
  await page.waitForLoadState("networkidle");
}

for (const viewport of VIEWPORTS) {
  for (const pagePath of PUBLIC_PAGES) {
    const name = pageSlug(pagePath);

    test(`${name} @ ${viewport.name} has no horizontal overflow`, async ({ browser }) => {
      const context = await newBlockedContext(browser, {
        width: viewport.width,
        height: viewport.height,
      });
      const page = await context.newPage();

      try {
        await page.goto(pagePath, { waitUntil: "networkidle" });

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(
          scrollWidth,
          `Horizontal overflow on ${pagePath} @ ${viewport.name}: ` +
            `${scrollWidth}px > ${viewport.width}px`,
        ).toBeLessThanOrEqual(viewport.width + 1);

        await loadLazyImages(page);
        await waitForCountersToSettle(page);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `${name}-${viewport.name}.png`),
          fullPage: true,
        });
      } finally {
        await context.close();
      }
    });
  }
}
