"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { type BoatImage, wixImageUrl } from "@/lib/wix-image";

export default function Gallery({ images }: { images: BoatImage[] }) {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const count = images.length;
  const go = useCallback((dir: number) => setIdx((i) => (i + dir + count) % count), [count]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, go]);

  if (!count) return null;
  const current = images[idx];

  return (
    <div className="gallery">
      <div className="gallery-main" onClick={() => setLightbox(true)}>
        <Image
          src={wixImageUrl(current, 1200, 800, { q: 82 })}
          alt={current.alt}
          fill
          priority
          unoptimized
          sizes="(max-width: 980px) 100vw, 760px"
          style={{ objectFit: "cover" }}
        />
        {count > 1 && (
          <>
            <button
              className="gallery-nav prev"
              onClick={(e) => { e.stopPropagation(); go(-1); }}
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              className="gallery-nav next"
              onClick={(e) => { e.stopPropagation(); go(1); }}
              aria-label="Siguiente"
            >
              ›
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="gallery-thumbs">
          {images.map((img, i) => (
            <div
              key={i}
              className={`gallery-thumb${i === idx ? " active" : ""}`}
              style={{ position: "relative" }}
              onClick={() => setIdx(i)}
            >
              <Image
                src={wixImageUrl(img, 180, 180, { q: 70 })}
                alt=""
                fill
                unoptimized
                sizes="90px"
                style={{ objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="lightbox open" onClick={() => setLightbox(false)}>
          <button className="lb-close" onClick={() => setLightbox(false)} aria-label="Cerrar">
            ✕
          </button>
          {count > 1 && (
            <button
              className="lb-arrow prev"
              onClick={(e) => { e.stopPropagation(); go(-1); }}
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
              onClick={(e) => { e.stopPropagation(); go(1); }}
              aria-label="Siguiente"
            >
              ›
            </button>
          )}
          <div className="lb-counter">
            {idx + 1} / {count}
          </div>
        </div>
      )}
    </div>
  );
}
