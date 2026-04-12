"use client";

import { useEffect, useRef, useState } from "react";

type LightboxImage = {
  url: string;
  alt?: string;
};

export default function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: LightboxImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [isVisible, setIsVisible] = useState(false);
  const startX = useRef<number | null>(null);

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 180);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowLeft") {
        prev();
      } else if (e.key === "ArrowRight") {
        next();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

    setIsVisible(false);
    setTimeout(onClose, 180);
  };

  const current = images[index];

  return (
    <div
      className={`fixed inset-0 z-[1000] transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Product image lightbox"
    >
      <button
        type="button"
        aria-label="Close lightbox"
        className="absolute inset-0 bg-black/85"
        onClick={handleClose}
      />

      <button
        type="button"
        aria-label="Close"
        onClick={handleClose}
        className="absolute right-4 top-4 z-20 text-white text-3xl leading-none hover:text-gold transition-colors"
      >
        ×
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={prev}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full border border-gold/70 bg-navy/90 text-gold text-2xl hover:bg-navy transition-colors"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={next}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full border border-gold/70 bg-navy/90 text-gold text-2xl hover:bg-navy transition-colors"
          >
            ›
          </button>
        </>
      )}

      <div
        className="absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-8"
        onTouchStart={(e) => {
          startX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (startX.current == null || images.length < 2) return;
          const endX = e.changedTouches[0]?.clientX ?? startX.current;
          const delta = endX - startX.current;
          if (Math.abs(delta) > 35) {
            if (delta > 0) prev();
            else next();
          } else {
            next();
          }
          startX.current = null;
        }}
      >
        <img
          src={current.url}
          alt={current.alt || "Product image"}
          className="max-h-full max-w-full object-contain border-2 border-white rounded-md shadow-2xl"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
