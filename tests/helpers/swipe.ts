/**
 * A one-finger horizontal swipe, sent through Chromium's touch input pipeline (CDP) rather
 * than as synthetic DOM events. The browser's own touch scrolling and scroll-snap handle it,
 * so the test takes the same path a phone does: if the gallery only listened for clicks, or
 * blocked touch scrolling, this would not move it.
 *
 * Needs a context with `hasTouch: true`.
 */

import type { Locator, Page } from "@playwright/test";

export async function swipe(page: Page, target: Locator, direction: "left" | "right"): Promise<void> {
  // Touches outside the viewport go nowhere; on a phone the gallery sits below the price box.
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error("swipe target is not visible");

  // "left" = the finger moves right-to-left, i.e. on to the next photo.
  const y = box.y + box.height / 2;
  const from = box.x + box.width * (direction === "left" ? 0.8 : 0.2);
  const to = box.x + box.width * (direction === "left" ? 0.2 : 0.8);

  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from, y }] });
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: from + ((to - from) * i) / steps, y }],
      });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } finally {
    await cdp.detach();
  }
}
