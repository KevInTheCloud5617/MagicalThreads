import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sanitize } from "@/lib/sanitize";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  // Validation
  if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0 || data.name.length > 200) {
    return NextResponse.json({ error: "Invalid product name" }, { status: 400 });
  }
  if (typeof data.price !== "number" || data.price < 0 || data.price > 99999) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }
  if (data.description && data.description.length > 5000) {
    return NextResponse.json({ error: "Description too long" }, { status: 400 });
  }
  if (data.category && (typeof data.category !== "string" || data.category.length > 100)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (data.tag && (typeof data.tag !== "string" || data.tag.length > 100)) {
    return NextResponse.json({ error: "Invalid tag" }, { status: 400 });
  }

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
      sku: data.sku,
      name,
      slug,
      price: data.price,
      category,
      description,
      tag,
      image: data.image || null,
      active: data.active ?? true,
    },
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

  // Validate fields if present
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

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
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

  await prisma.product.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
