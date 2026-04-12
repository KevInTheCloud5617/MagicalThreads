"use client";

import { useMemo, useState } from "react";

type GalleryImage = {
  url: string;
  alt?: string | null;
};

export default function ProductImageGallery({
  primaryImage,
  productName,
  additionalImages,
  fallbackEmoji,
}: {
  primaryImage?: string | null;
  productName: string;
  additionalImages?: GalleryImage[];
  fallbackEmoji: string;
}) {
  const gallery = useMemo(() => {
    const all = [
      primaryImage ? { url: primaryImage, alt: `${productName} main photo` } : null,
      ...(additionalImages ?? []).map((img, i) => ({ url: img.url, alt: img.alt || `${productName} photo ${i + 2}` })),
    ].filter((img): img is { url: string; alt?: string } => Boolean(img?.url));

    const seen = new Set<string>();
    return all.filter((img) => {
      if (seen.has(img.url)) return false;
      seen.add(img.url);
      return true;
    });
  }, [primaryImage, additionalImages, productName]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = gallery[selectedIndex] ?? null;

  return (
    <div>
      <div className="aspect-square bg-gradient-to-br from-blue-pale to-blue-light/20 rounded-2xl flex items-center justify-center relative overflow-hidden border border-gold/20">
        {selected ? (
          <img
            src={selected.url}
            alt={selected.alt || productName}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-8xl opacity-25">{fallbackEmoji}</span>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-2">
          {gallery.map((img, idx) => (
            <button
              key={`${img.url}-${idx}`}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                idx === selectedIndex ? "border-gold shadow-sm" : "border-blue-pale hover:border-navy/40"
              }`}
              aria-label={`View image ${idx + 1}`}
            >
              <img src={img.url} alt={img.alt || `${productName} thumbnail ${idx + 1}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
