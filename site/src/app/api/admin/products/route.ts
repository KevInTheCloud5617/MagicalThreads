import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
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

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    include: { sizes: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0 || data.name.length > 200) {
    return NextResponse.json({ error: "Invalid product name" }, { status: 400 });
  }
  if (typeof data.price !== "number" || data.price < 0 || data.price > 99999) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }
  if (data.description && data.description.length > 5000) {
    return NextResponse.json({ error: "Description too long" }, { status: 400 });
  }
  const stock = typeof data.stock === "string" ? Number.parseInt(data.stock, 10) : data.stock;
  if (!Number.isInteger(stock) || stock < 0) {
    return NextResponse.json({ error: "Stock quantity is required and must be a non-negative integer" }, { status: 400 });
  }

  const sizes = normalizeSizes(data.sizes);

  const name = sanitize(data.name);
  const description = data.description ? sanitize(data.description) : data.description;
  const category = data.category ? sanitize(data.category) : data.category;
  const tag = data.tag ? sanitize(data.tag) : null;

  const slug = data.slug || name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const product = await prisma.product.create({
    data: {
      sku: data.sku || `MT-${randomUUID().slice(0, 8).toUpperCase()}`,
      name,
      slug,
      price: data.price,
      category,
      description,
      tag,
      image: data.image || null,
      active: data.active ?? true,
      stock,
      hasSize: Boolean(data.hasSize),
      sizes: {
        create: ALLOWED_SIZES.map((size) => ({ size, stock: Boolean(data.hasSize) ? sizes[size] : 0 })),
      },
    },
    include: { sizes: true },
  });

  return NextResponse.json(product, { status: 201 });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();
  const { id, ...updateData } = data;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  if (updateData.name !== undefined) {
    if (typeof updateData.name !== "string" || updateData.name.trim().length === 0 || updateData.name.length > 200) {
      return NextResponse.json({ error: "Invalid product name" }, { status: 400 });
    }
    updateData.name = sanitize(updateData.name);
  }
  if (updateData.price !== undefined) {
    if (typeof updateData.price !== "number" || updateData.price < 0 || updateData.price > 99999) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }
  }
  if (updateData.stock !== undefined) {
    if (!Number.isInteger(updateData.stock) || updateData.stock < 0) {
      return NextResponse.json({ error: "Stock quantity must be a non-negative integer" }, { status: 400 });
    }
  }
  if (updateData.hasSize !== undefined) {
    updateData.hasSize = Boolean(updateData.hasSize);
  }
  if (updateData.description !== undefined && updateData.description !== null) {
    if (updateData.description.length > 5000) {
      return NextResponse.json({ error: "Description too long" }, { status: 400 });
    }
    updateData.description = sanitize(updateData.description);
  }
  if (updateData.category !== undefined && updateData.category !== null) {
    updateData.category = sanitize(updateData.category);
  }
  if (updateData.tag === "") updateData.tag = null;
  if (updateData.tag) updateData.tag = sanitize(updateData.tag);

  const sizes = normalizeSizes(updateData.sizes);
  const hasSize = updateData.hasSize === undefined ? undefined : Boolean(updateData.hasSize);
  delete updateData.sizes;

  const product = await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id },
      data: updateData,
    });

    await Promise.all(
      ALLOWED_SIZES.map((size) =>
        tx.productSize.upsert({
          where: { productId_size: { productId: id, size } },
          update: { stock: hasSize === false ? 0 : sizes[size] },
          create: { productId: id, size, stock: hasSize === false ? 0 : sizes[size] },
        })
      )
    );

    return tx.product.findUnique({ where: { id: updated.id }, include: { sizes: true } });
  });

  return NextResponse.json(product);
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.productSize.deleteMany({ where: { productId: id } });
    await tx.orderItem.deleteMany({ where: { productId: id } });
    await tx.product.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}
