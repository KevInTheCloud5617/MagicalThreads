"use client";

import { useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import { useFeature } from "@/lib/useFeature";
import type { Customization, CustomizationOptions, CustomizationColor } from "@/lib/customization";

type ProductSize = { size: string; stock: number };
type ProductColor = { name: string; hex: string; sortOrder: number };
type ProductInput = {
  id: string;
  name: string;
  price: number;
  stock?: number;
  hasSize?: boolean;
  hasColor?: boolean;
  category?: string;
  image?: string;
  sizes?: ProductSize[];
  colors?: ProductColor[];
  customizationOptions?: CustomizationOptions | null;
};

export default function ProductPurchasePanel({ product }: { product: ProductInput }) {
  const embroideryOn = useFeature("embroidery");
  const opts = product.customizationOptions;
  const variantColors = product.colors ?? [];
  const hasVariantColors = Boolean(product.hasColor) && variantColors.length > 0;
  const [variantColor, setVariantColor] = useState<string>(hasVariantColors ? variantColors[0].name : "");

  const showPersonalize = embroideryOn && opts?.enabled && opts.colors.length > 0 && opts.fonts.length > 0 && opts.placements.length > 0;

  const [text, setText] = useState("");
  const [color, setColor] = useState<CustomizationColor | null>(opts?.colors?.[0] ?? null);
  const [font, setFont] = useState<string>(opts?.fonts?.[0] ?? "");
  const [placement, setPlacement] = useState<string>(opts?.placements?.[0] ?? "");

  const validText = text.trim().length > 0 && text.length <= (opts?.maxChars ?? 50);
  const customization: Customization | null = showPersonalize && validText && color && font && placement
    ? { text: text.trim(), color, font, placement, upcharge: opts!.upcharge }
    : null;

  return (
    <div className="space-y-4">
      {hasVariantColors && (
        <div>
          <label className="block text-xs uppercase tracking-wider text-text-muted mb-2">Color</label>
          <select
            value={variantColor}
            onChange={(e) => setVariantColor(e.target.value)}
            className="w-full px-3 py-3 rounded-full border border-blue-pale bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
          >
            {variantColors.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          {(() => {
            const swatch = variantColors.find((c) => c.name === variantColor);
            if (!swatch) return null;
            return (
              <div className="flex items-center gap-2 mt-2 text-[11px] text-text-muted">
                <span className="inline-block w-4 h-4 rounded-full border border-blue-pale" style={{ backgroundColor: swatch.hex }} />
                Selected: {swatch.name}
              </div>
            );
          })()}
        </div>
      )}

      {showPersonalize && (
        <div className="border border-blue-pale rounded-2xl p-4 bg-white space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="font-semibold text-navy text-sm uppercase tracking-wider">Personalize this item</h3>
            {opts!.upcharge > 0 && (
              <span className="text-xs text-gold font-semibold">+ ${opts!.upcharge.toFixed(2)} personalization</span>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted mb-1">Text</label>
            <input
              type="text"
              value={text}
              maxLength={opts!.maxChars}
              onChange={(e) => setText(e.target.value)}
              placeholder="Your text"
              className="w-full px-3 py-2 rounded-full border border-blue-pale bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
            <div className="text-[11px] text-text-muted mt-1 text-right">{text.length}/{opts!.maxChars}</div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted mb-2">Thread Color</label>
            <div className="flex flex-wrap gap-2">
              {opts!.colors.map((c) => {
                const selected = color?.name === c.name;
                return (
                  <button
                    type="button"
                    key={c.name}
                    onClick={() => setColor(c)}
                    title={c.name}
                    className={`w-8 h-8 rounded-full border ${selected ? "ring-2 ring-navy ring-offset-2" : "border-blue-pale"}`}
                    style={{ backgroundColor: c.hex }}
                  />
                );
              })}
            </div>
            {color && <div className="text-[11px] text-text-muted mt-1">Selected: {color.name}</div>}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted mb-1">Font</label>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value)}
              className="w-full px-3 py-2 rounded-full border border-blue-pale bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
            >
              {opts!.fonts.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted mb-2">Placement</label>
            <div className="flex flex-wrap gap-2">
              {opts!.placements.map((p) => (
                <label key={p} className={`px-3 py-1.5 rounded-full text-xs cursor-pointer border ${placement === p ? "bg-navy text-white border-navy" : "bg-white text-navy border-blue-pale"}`}>
                  <input
                    type="radio"
                    name="placement"
                    className="hidden"
                    checked={placement === p}
                    onChange={() => setPlacement(p)}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>

          {(() => {
            const fontFamily = ({
              Script: 'var(--font-script), "Brush Script MT", cursive',
              Block: 'var(--font-block), "Arial Black", Impact, sans-serif',
              Varsity: 'var(--font-varsity), Impact, "Arial Black", sans-serif',
              Cursive: 'var(--font-cursive), "Snell Roundhand", cursive',
              Serif: 'var(--font-playfair), Georgia, "Times New Roman", serif',
            } as Record<string, string>)[font] || 'inherit';
            const previewText = text.trim() || "Preview";
            return (
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-muted mb-2">Preview</label>
                <div className="rounded-xl border border-blue-pale bg-white px-4 py-6 flex items-center justify-center min-h-[80px]">
                  <span
                    style={{ fontFamily, color: color?.hex ?? "#0f172a" }}
                    className={`text-3xl leading-tight break-words text-center ${text.trim() ? "" : "opacity-30"}`}
                  >
                    {previewText}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <AddToCartButton
        product={product}
        customization={customization}
        customizationRequired={Boolean(showPersonalize)}
        variantColor={hasVariantColors ? variantColor : undefined}
        variantColorRequired={hasVariantColors}
      />
    </div>
  );
}
