"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { type BoatImage, wixImageUrl } from "@/lib/wix-image";
import Lightbox from "@/components/Lightbox";

// Tiles are square crops: the phone-shot portraits are over twice as tall as wide, and a
// masonry of them left ragged columns. The lightbox shows each photo uncropped. The first
// photo is featured at double size.
export default function PhotoGrid({ images }: { images: BoatImage[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const count = images.length;
  const go = useCallback(
    (dir: number) => setOpen((i) => (i == null ? i : (i + dir + count) % count)),
    [count],
  );
  const close = useCallback(() => setOpen(null), []);

  return (
    <>
      <div className="bl-photo-grid">
        {images.map((img, i) => {
          const size = i === 0 ? 1000 : 600;
          return (
            <button
              key={img.url}
              type="button"
              className={`bl-photo${i === 0 ? " bl-photo-featured" : ""}`}
              onClick={() => setOpen(i)}
              aria-label={`Ampliar foto ${i + 1} de ${count}: ${img.alt}`}
            >
              <Image
                src={wixImageUrl(img, size, size, { q: 78 })}
                alt={img.alt}
                width={size}
                height={size}
                unoptimized
                sizes={i === 0 ? "(max-width: 1024px) 100vw, 600px" : "(max-width: 600px) 50vw, 300px"}
              />
            </button>
          );
        })}
      </div>
      {open != null && <Lightbox images={images} index={open} onNavigate={go} onClose={close} />}
    </>
  );
}
