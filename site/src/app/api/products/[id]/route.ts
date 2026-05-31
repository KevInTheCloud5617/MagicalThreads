import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { parseCustomizationOptions } from "@/lib/customization";
import { getPersonalizationPresets, resolveCustomizationOptions } from "@/lib/personalization-presets";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, presets] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        sizes: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    }),
    getPersonalizationPresets(prisma),
  ]);

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...product,
    customizationOptions: resolveCustomizationOptions(parseCustomizationOptions(product.customizationOptions), presets),
  });
}
