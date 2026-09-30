"use client";

import { useEffect, useRef, useState } from "react";

// Background loop layered over the hero photo. The photo stays underneath as the LCP
// element and as the fallback: the video only fades in once it is actually playing, and
// it is never started for visitors who ask for reduced motion.
export default function HeroVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // React does not reliably reflect `muted` onto the element, and browsers only allow
    // autoplay for muted media.
    video.muted = true;
    // Rejected by low-power modes and some in-app browsers; the photo simply stays.
    video.play().catch(() => {});
  }, []);

  return (
    <video
      ref={ref}
      className={`bl-hero-video${playing ? " playing" : ""}`}
      src={src}
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
