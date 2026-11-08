"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { type BoatImage, wixImageUrl } from "@/lib/wix-image";
import Lightbox from "@/components/Lightbox";
import { useLoadedSlides, useSnapTrack } from "@/components/useSnapTrack";

// The main photo is a swipeable strip: on a phone the visitor slides photos with the finger
// instead of aiming at the arrows. Arrows, thumbnails and the lightbox all drive the same
// index, so whichever was used last, the others follow.
export default function Gallery({ images }: { images: BoatImage[] }) {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const count = images.length;
  const go = useCallback((dir: number) => setIdx((i) => (i + dir + count) % count), [count]);
  const track = useSnapTrack(idx, count, setIdx);
  const loaded = useLoadedSlides(idx, count);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const closeLightbox = useCallback(() => setLightbox(false), []);

  // Keep the active thumbnail in view: swiping to photo 15 on a phone should not leave the
  // thumbnail strip parked on photos 1–5.
  useEffect(() => {
    const strip = thumbsRef.current;
    const thumb = strip?.children[idx] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    const s = strip.getBoundingClientRect();
    const t = thumb.getBoundingClientRect();
    if (t.left >= s.left && t.right <= s.right) return;
    strip.scrollBy({ left: t.left + t.width / 2 - (s.left + s.width / 2) });
  }, [idx]);

  if (!count) return null;

  return (
    <div className="gallery">
      <div className="gallery-main" onClick={() => setLightbox(true)}>
        <div
          className="gallery-track"
          {...track}
          tabIndex={0}
          role="group"
          aria-roledescription="carrusel"
          aria-label="Fotos de la embarcación"
        >
          {images.map((img, i) => (
            <div
              key={i}
              className="gallery-slide"
              role="group"
              aria-hidden={i !== idx}
              aria-roledescription="foto"
              aria-label={`${i + 1} de ${count}`}
            >
              {loaded.has(i) && (
                <Image
                  src={wixImageUrl(img, 1200, 800, { q: 82 })}
                  alt={img.alt}
                  fill
                  priority={i === 0}
                  loading={i === 0 ? undefined : "eager"}
                  unoptimized
                  sizes="(max-width: 980px) 100vw, 760px"
                  style={{ objectFit: "cover" }}
                  draggable={false}
                />
              )}
            </div>
          ))}
        </div>
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
            <div className="gallery-counter" aria-hidden="true">
              {idx + 1} / {count}
            </div>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="gallery-thumbs" ref={thumbsRef}>
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
        <Lightbox images={images} index={idx} onIndexChange={setIdx} onClose={closeLightbox} />
      )}
    </div>
  );
}
