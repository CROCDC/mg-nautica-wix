"use client";

import { useEffect } from "react";
import { type BoatImage, wixImageUrl } from "@/lib/wix-image";

// Full-screen viewer shared by the boat Gallery and the landing PhotoGrid. The parent owns
// the index, so closing and reopening lands on whatever the page is showing.
export default function Lightbox({
  images,
  index,
  onNavigate,
  onClose,
}: {
  images: BoatImage[];
  index: number;
  onNavigate: (dir: number) => void;
  onClose: () => void;
}) {
  const count = images.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate(1);
      if (e.key === "ArrowLeft") onNavigate(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onNavigate]);

  const current = images[index];

  return (
    <div className="lightbox open" role="dialog" aria-modal="true" aria-label="Visor de fotos" onClick={onClose}>
      <button className="lb-close" onClick={onClose} aria-label="Cerrar">
        ✕
      </button>
      {count > 1 && (
        <button
          className="lb-arrow prev"
          onClick={(e) => { e.stopPropagation(); onNavigate(-1); }}
          aria-label="Anterior"
        >
          ‹
        </button>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- Wix-CDN-sized, off Vercel's transform quota */}
      <img
        className="lb-img"
        src={wixImageUrl(current, 1600, 1600, { mode: "fit", q: 85 })}
        alt={current.alt}
        onClick={(e) => e.stopPropagation()}
      />
      {count > 1 && (
        <button
          className="lb-arrow next"
          onClick={(e) => { e.stopPropagation(); onNavigate(1); }}
          aria-label="Siguiente"
        >
          ›
        </button>
      )}
      <div className="lb-counter">
        {index + 1} / {count}
      </div>
    </div>
  );
}
