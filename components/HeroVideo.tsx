"use client";

import { useEffect, useRef, useState } from "react";

export type VideoVariant = { src: string; width: number };

// Phones get at most this width: the hero is behind a dark overlay, so the jump to the
// largest file would cost mobile data without a visible gain.
const PHONE_MAX_WIDTH = 1920;

// Smallest variant that covers the hero in device pixels. The video is 16:9 and cropped
// with object-fit: cover, so on a portrait screen it is the height that sets the width.
function pickVariant(variants: VideoVariant[], box: DOMRect): VideoVariant {
  const dpr = window.devicePixelRatio || 1;
  const rendered = Math.max(box.width, (box.height * 16) / 9) * dpr;
  const cap = window.innerWidth < 768 ? PHONE_MAX_WIDTH : Infinity;
  const sorted = [...variants].sort((a, b) => a.width - b.width);
  const usable = sorted.filter((v) => v.width <= cap);
  return usable.find((v) => v.width >= rendered) ?? usable[usable.length - 1] ?? sorted[0];
}

// Background loop layered over the hero photo. The photo stays underneath as the LCP
// element and as the fallback: the video only fades in once it is actually playing, and
// it is never started for visitors who ask for reduced motion.
export default function HeroVideo({ variants }: { variants: VideoVariant[] }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video || !variants.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.src = pickVariant(variants, video.getBoundingClientRect()).src;
    // React does not reliably reflect `muted` onto the element, and browsers only allow
    // autoplay for muted media.
    video.muted = true;
    // Rejected by low-power modes and some in-app browsers; the photo simply stays.
    video.play().catch(() => {});
  }, [variants]);

  return (
    <video
      ref={ref}
      className={`bl-hero-video${playing ? " playing" : ""}`}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setPlaying(true)}
    />
  );
}
