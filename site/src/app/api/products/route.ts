import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { parseCustomizationOptions } from "@/lib/customization";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { sizes: true },
    orderBy: { createdAt: "desc" },
  });

  const withHasSize = products.map((p) => ({
    ...p,
    hasSize: p.hasSize,
    customizationOptions: parseCustomizationOptions(p.customizationOptions),
  }));

  return NextResponse.json(withHasSize);
}
