import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { sizes: true },
    orderBy: { createdAt: "desc" },
  });

  // explicit include for API contract
  const withHasSize = products.map((p) => ({ ...p, hasSize: p.hasSize }));

  return NextResponse.json(withHasSize);
}
