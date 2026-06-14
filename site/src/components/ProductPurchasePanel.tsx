"use client";

import { useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import { useFeature } from "@/lib/useFeature";
import { sectionOn, type Customization, type CustomizationOptions, type CustomizationColor } from "@/lib/customization";

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

  // Resolved section visibility: a section renders only if its flag is on AND
  // (for collection-based sections) there are items to choose from.
  const textOn = Boolean(opts?.enabled) && sectionOn(opts?.showText);
  const colorsOn = Boolean(opts?.enabled) && sectionOn(opts?.showColors) && (opts?.colors?.length ?? 0) > 0;
  const fontsOn = Boolean(opts?.enabled) && sectionOn(opts?.showFonts) && (opts?.fonts?.length ?? 0) > 0;
  const placementsOn = Boolean(opts?.enabled) && sectionOn(opts?.showPlacements) && (opts?.placements?.length ?? 0) > 0;
  const anySection = textOn || colorsOn || fontsOn || placementsOn;
  const showPersonalize = Boolean(embroideryOn && opts?.enabled && anySection);

  const [text, setText] = useState("");
  const [color, setColor] = useState<CustomizationColor | null>(opts?.colors?.[0] ?? null);
  const [font, setFont] = useState<string>(opts?.fonts?.[0] ?? "");
  const [placement, setPlacement] = useState<string>(opts?.placements?.[0] ?? "");

  const textValid = !textOn || (text.trim().length > 0 && text.length <= (opts?.maxChars ?? 50));
  const colorValid = !colorsOn || Boolean(color);
  const fontValid = !fontsOn || Boolean(font);
  const placementValid = !placementsOn || Boolean(placement);

  const customization: Customization | null = showPersonalize && textValid && colorValid && fontValid && placementValid
    ? {
        ...(textOn ? { text: text.trim() } : {}),
        ...(colorsOn && color ? { color } : {}),
        ...(fontsOn && font ? { font } : {}),
        ...(placementsOn && placement ? { placement } : {}),
        upcharge: opts!.upcharge,
      }
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

          {textOn && (
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
          )}

          {colorsOn && (
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
          )}

          {fontsOn && (
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
          )}

          {placementsOn && (
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
          )}
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
