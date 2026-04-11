import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (err: any) {
    const msg = String(err?.message || err);
    const missingStock = err?.code === "P2022" || msg.includes("stock") || msg.includes("no such column");
    if (!missingStock) throw err;

    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT id, sku, name, slug, price, category, description, tag, image, active, isExample, createdAt, updatedAt, 0 as stock
       FROM Product
       WHERE id = ?
       LIMIT 1`,
      id
    );

    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  }
}
