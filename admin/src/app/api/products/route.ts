import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

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
  
  const slug = data.slug || data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const product = await prisma.product.create({
    data: {
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
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await request.json();
  const { id, ...updateData } = data;

  if (updateData.tag === "") updateData.tag = null;

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

  await prisma.product.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
