import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const data = await request.json();
  
  const slug = data.slug || data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const product = await prisma.product.create({
    data: {
      sku: data.sku,
      name: data.name,
      slug,
      price: data.price,
      category: data.category,
      description: data.description,
      tag: data.tag || null,
      image: data.image || null,
      active: data.active ?? true,
    },
  });

  return NextResponse.json(product, { status: 201 });
}

export async function PUT(request: Request) {
  const data = await request.json();
  const { id, ...updateData } = data;

  // Clean up tag field
  if (updateData.tag === "") updateData.tag = null;

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(product);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();

  await prisma.product.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
