import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sanitize } from "@/lib/sanitize";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
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

  // Sanitize string fields
  if (data.name !== undefined) data.name = sanitize(String(data.name));
  if (data.description !== undefined && data.description !== null) data.description = sanitize(data.description);
  if (data.category !== undefined && data.category !== null) data.category = sanitize(data.category);
  if (data.tag) data.tag = sanitize(data.tag);

  const product = await prisma.product.update({ where: { id }, data });
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
