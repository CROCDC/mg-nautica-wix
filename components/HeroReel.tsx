"use client";

import { useEffect, useRef, useState } from "react";

// Inline icons: the emoji equivalents render inconsistently (🔇 comes out red on macOS).
const ICONS = {
  play: <path d="M8 5.5v13l10.5-6.5z" />,
  pause: <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />,
  soundOff: <path d="M4 9h3.5L12 5v14l-4.5-4H4zM15.3 9.4l1.4-1.4 2.1 2.1 2.1-2.1 1.4 1.4-2.1 2.1 2.1 2.1-1.4 1.4-2.1-2.1-2.1 2.1-1.4-1.4 2.1-2.1z" />,
  soundOn: <path d="M4 9h3.5L12 5v14l-4.5-4H4zM15 8.5a5 5 0 0 1 0 7l-1.4-1.4a3 3 0 0 0 0-4.2zM17.8 5.7a9 9 0 0 1 0 12.6l-1.4-1.4a7 7 0 0 0 0-9.8z" />,
};

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

export type ReelVariant = { src: string; width: number };

// Smallest variant that covers the reel box in device pixels. The clip is 9:16 and
// cropped with object-fit: cover, so on a wide box it is the height that sets the width.
function pickVariant(variants: ReelVariant[], box: DOMRect): ReelVariant {
  const rendered = Math.max(box.width, (box.height * 9) / 16) * (window.devicePixelRatio || 1);
  const sorted = [...variants].sort((a, b) => a.width - b.width);
  return sorted.find((v) => v.width >= rendered) ?? sorted[sorted.length - 1];
}

// The owners' vertical reel. On desktop it sits as a card next to the hero copy; on
// portrait screens CSS turns it into the full-bleed hero background. It autoplays muted
// (the only autoplay browsers allow), except for visitors who ask for reduced motion, who
// get the poster and a play button instead.
export default function HeroReel({
  variants,
  poster,
  label,
}: {
  variants: ReelVariant[];
  poster: string;
  label: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const start = () => {
    const video = ref.current;
    if (!video) return;
    // The source is chosen on first play, once the box has its real size.
    if (!video.getAttribute("src")) {
      video.src = pickVariant(variants, video.getBoundingClientRect()).src;
    }
    // Rejected by low-power modes and some in-app browsers; the poster simply stays.
    video.play().catch(() => {});
  };

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // React does not reliably reflect `muted` onto the element.
    video.muted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autoplay once, on mount
  }, []);

  const togglePlay = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) start();
    else video.pause();
  };

  const toggleSound = () => {
    const video = ref.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    // Asking for sound means wanting to watch: start it if it was not running.
    if (!video.muted && video.paused) start();
  };

  return (
    <div className="bl-reel">
      <video
        ref={ref}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={label}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <div className="bl-reel-controls">
        <button
          type="button"
          className="bl-reel-btn"
          onClick={togglePlay}
          aria-label={playing ? "Pausar video" : "Reproducir video"}
        >
          <Icon name={playing ? "pause" : "play"} />
        </button>
        <button
          type="button"
          className="bl-reel-btn"
          onClick={toggleSound}
          aria-label={muted ? "Activar sonido" : "Silenciar"}
          aria-pressed={!muted}
        >
          <Icon name={muted ? "soundOff" : "soundOn"} />
        </button>
      </div>
    </div>
  );
}
