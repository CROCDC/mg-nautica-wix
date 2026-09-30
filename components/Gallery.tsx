"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { type BoatImage, wixImageUrl } from "@/lib/wix-image";
import Lightbox from "@/components/Lightbox";

export default function Gallery({ images }: { images: BoatImage[] }) {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const count = images.length;
  const go = useCallback((dir: number) => setIdx((i) => (i + dir + count) % count), [count]);

  const closeLightbox = useCallback(() => setLightbox(false), []);

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
        <Lightbox images={images} index={idx} onNavigate={go} onClose={closeLightbox} />
      )}
    </div>
  );
}
