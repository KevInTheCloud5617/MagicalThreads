import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sanitize } from "@/lib/sanitize";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const ALLOWED_SIZES = ["S", "M", "L", "XL", "2XL", "3XL"] as const;
type AllowedSize = (typeof ALLOWED_SIZES)[number];

function normalizeSizes(input: unknown): Record<AllowedSize, number> {
  const map = Object.fromEntries(ALLOWED_SIZES.map((size) => [size, 0])) as Record<AllowedSize, number>;
  if (!input || typeof input !== "object") return map;

  for (const size of ALLOWED_SIZES) {
    const raw = (input as Record<string, unknown>)[size];
    const value = typeof raw === "string" ? Number.parseInt(raw, 10) : Number(raw ?? 0);
    map[size] = Number.isInteger(value) && value >= 0 ? value : 0;
  }

  return map;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { sizes: true } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const data = await req.json();
  if (data.tag === "") data.tag = null;

  if (data.name !== undefined) data.name = sanitize(String(data.name));
  if (data.description !== undefined && data.description !== null) data.description = sanitize(data.description);
  if (data.category !== undefined && data.category !== null) data.category = sanitize(data.category);
  if (data.tag) data.tag = sanitize(data.tag);

  const sizes = normalizeSizes(data.sizes);
  delete data.sizes;

  const product = await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data });

    await Promise.all(
      ALLOWED_SIZES.map((size) =>
        tx.productSize.upsert({
          where: { productId_size: { productId: id, size } },
          update: { stock: sizes[size] },
          create: { productId: id, size, stock: sizes[size] },
        })
      )
    );

    return tx.product.findUnique({ where: { id }, include: { sizes: true } });
  });

  return NextResponse.json(product);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
