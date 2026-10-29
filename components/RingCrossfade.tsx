"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Photo = { src: string; alt: string; width: number; height: number };

const HOLD_MS = 5500;

// The hero's photographs, one at a time inside the ring. They crossfade slowly; the loop
// pauses while the tab is hidden and never starts for visitors who ask for reduced motion.
export default function RingCrossfade({ photos }: { photos: Photo[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: number | undefined;
    const start = () => {
      timer = window.setInterval(() => setCurrent((i) => (i + 1) % photos.length), HOLD_MS);
    };
    const onVisibility = () => {
      window.clearInterval(timer);
      if (!document.hidden) start();
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [photos.length]);

  return (
    <div className="ps-ring-photos">
      {photos.map((p, i) => (
        <Image
          key={p.src}
          src={p.src}
          alt={i === current ? p.alt : ""}
          aria-hidden={i !== current}
          width={p.width}
          height={p.height}
          sizes="(max-width: 1024px) 120vw, 60vw"
          priority={i === 0}
          className={i === current ? "is-current" : undefined}
        />
      ))}
    </div>
  );
}
