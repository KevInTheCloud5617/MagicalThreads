import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { parseCustomizationOptions } from "@/lib/customization";
import { getPersonalizationPresets, resolveCustomizationOptions } from "@/lib/personalization-presets";

export async function GET() {
  const [products, presets] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: { sizes: true },
      orderBy: { createdAt: "desc" },
    }),
    getPersonalizationPresets(prisma),
  ]);

  const withHasSize = products.map((p) => ({
    ...p,
    hasSize: p.hasSize,
    customizationOptions: resolveCustomizationOptions(parseCustomizationOptions(p.customizationOptions), presets),
  }));

  return NextResponse.json(withHasSize);
}
