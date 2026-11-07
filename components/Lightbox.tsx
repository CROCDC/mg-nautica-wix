"use client";

import { useEffect, useRef } from "react";
import { type BoatImage, wixImageUrl } from "@/lib/wix-image";
import { useLoadedSlides, useSnapTrack } from "@/components/useSnapTrack";

// Full-screen viewer shared by the boat Gallery and the landing PhotoGrid. The parent owns
// the index, so closing and reopening lands on whatever the page is showing, and a swipe in
// here moves the page's gallery along with it. Photos slide with the finger, like the
// gallery itself; arrows and the keyboard still work, and wrap at both ends.
export default function Lightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: BoatImage[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const count = images.length;
  const track = useSnapTrack(index, count, onIndexChange);
  const loaded = useLoadedSlides(index, count);
  const go = (dir: number) => onIndexChange((index + dir + count) % count);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % count);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + count) % count);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, count, onClose, onIndexChange]);

  // Focus moves into the viewer and back out on close. Left on the page's gallery strip,
  // an arrow key would also scroll that strip natively, behind the viewer.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus({ preventScroll: true });
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      opener?.focus({ preventScroll: true });
    };
  }, []);

  return (
    <div
      ref={dialogRef}
      className="lightbox open"
      role="dialog"
      aria-modal="true"
      aria-label="Visor de fotos"
      tabIndex={-1}
      onClick={onClose}
    >
      {/* A tap on the dark area around a photo closes, so the slides let clicks bubble. */}
      <div className="lb-track" {...track}>
        {images.map((img, i) => (
          <div key={i} className="lb-slide" aria-hidden={i !== index}>
            {loaded.has(i) && (
              // eslint-disable-next-line @next/next/no-img-element -- Wix-CDN-sized, off Vercel's transform quota
              <img
                className="lb-img"
                src={wixImageUrl(img, 1600, 1600, { mode: "fit", q: 85 })}
                alt={img.alt}
                draggable={false}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        ))}
      </div>
      <button className="lb-close" onClick={onClose} aria-label="Cerrar">
        ✕
      </button>
      {count > 1 && (
        <>
          <button
            className="lb-arrow prev"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            className="lb-arrow next"
            onClick={(e) => { e.stopPropagation(); go(1); }}
            aria-label="Siguiente"
          >
            ›
          </button>
        </>
      )}
      <div className="lb-counter">
        {index + 1} / {count}
      </div>
    </div>
  );
}
