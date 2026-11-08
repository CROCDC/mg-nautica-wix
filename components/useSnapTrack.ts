"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A horizontal scroll-snap strip of full-width slides whose current slide is owned by the
 * parent. The finger drives the browser's own scrolling (it follows the finger, carries
 * momentum and snaps to a photo, with no JS physics); this hook only keeps the two in step:
 *
 * - the visitor swipes → `onIndexChange(slide now in view)`
 * - the parent changes `index` (arrow, thumbnail, key, the lightbox) → the strip scrolls there
 *
 * A one-photo step glides; a longer jump (a thumbnail, wrapping from the last photo to the
 * first) cuts straight there instead of streaking past every photo in between.
 */
export function useSnapTrack(index: number, count: number, onIndexChange: (i: number) => void) {
  const trackRef = useRef<HTMLDivElement>(null);
  // The slide the strip is on, as last reported by a swipe or last requested by the parent.
  // Telling the two apart is what stops the parent echoing a swipe back as a scroll command.
  const shown = useRef(index);
  // While a programmatic glide is in flight, the positions it passes through are not the
  // visitor's choice, so they are not reported back as the index.
  const gliding = useRef<number | null>(null);
  const glideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mounted = useRef(false);

  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const first = !mounted.current;
    mounted.current = true;
    if (!first && index === shown.current) return; // the echo of the visitor's own swipe

    const from = shown.current;
    shown.current = index;
    const left = index * el.clientWidth;
    if (Math.abs(el.scrollLeft - left) < 1) return;

    const glide = !first && Math.abs(index - from) === 1 && !prefersReducedMotion();
    clearTimeout(glideTimer.current);
    gliding.current = glide ? index : null;
    // Safety net: never leave swipes unreported if a glide is cut short without arriving.
    if (glide) glideTimer.current = setTimeout(() => (gliding.current = null), 1000);
    el.scrollTo({ left, behavior: glide ? "smooth" : "auto" });
  }, [index]);

  useEffect(() => () => clearTimeout(glideTimer.current), []);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    if (gliding.current != null) {
      if (Math.abs(el.scrollLeft - gliding.current * el.clientWidth) < 2) {
        gliding.current = null;
        clearTimeout(glideTimer.current);
      }
      return;
    }
    const i = Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth)));
    if (i !== shown.current) {
      shown.current = i;
      onIndexChange(i);
    }
  }, [count, onIndexChange]);

  // The visitor grabbed the strip mid-glide: from here on, where it lands is their call.
  const release = useCallback(() => {
    gliding.current = null;
  }, []);

  return {
    ref: trackRef,
    onScroll,
    onPointerDown: release,
    onTouchStart: release,
    onWheel: release,
  };
}

/**
 * The slides that get their photo: the current one and its neighbours, so the next swipe
 * lands on a photo that is already there, plus every one already seen, so swiping back never
 * blanks a photo. The rest stay empty until the visitor gets near them — a boat can have
 * thirty photos, and a phone should not download all of them to show the first.
 */
export function useLoadedSlides(index: number, count: number): ReadonlySet<number> {
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(() => new Set(around(index, count)));
  const missing = around(index, count).filter((i) => !loaded.has(i));
  if (!missing.length) return loaded;
  // Adjusting state during render (React's pattern for state derived from a changed prop):
  // the photos are in this very render, not one effect later.
  const next = new Set([...loaded, ...missing]);
  setLoaded(next);
  return next;
}

function around(index: number, count: number): number[] {
  return [index - 1, index, index + 1].filter((i) => i >= 0 && i < count);
}
