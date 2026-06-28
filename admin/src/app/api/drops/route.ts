import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sanitize } from "@/lib/sanitize";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const drops = await prisma.drop.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(drops);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();
    if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const name = sanitize(data.name.trim()).slice(0, 100);
    const slug = data.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    
    const existing = await prisma.drop.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A drop with this slug already exists" }, { status: 400 });
    }

    const maxOrder = await prisma.drop.aggregate({ _max: { sortOrder: true } });
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const drop = await prisma.drop.create({
      data: {
        slug,
        name,
        tagline: data.tagline ? sanitize(data.tagline.trim()).slice(0, 200) : null,
        emoji: data.emoji?.slice(0, 10) || null,
        colorFrom: data.colorFrom || null,
        colorTo: data.colorTo || null,
        sortOrder,
        active: data.active ?? true,
      },
    });

    return NextResponse.json(drop, { status: 201 });
  } catch (err) {
    console.error("Failed to create drop:", err);
    return NextResponse.json({ error: "Failed to create drop" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    if (updateData.name !== undefined) {
      updateData.name = sanitize(String(updateData.name).trim()).slice(0, 100);
    }
    if (updateData.tagline !== undefined) {
      updateData.tagline = updateData.tagline ? sanitize(String(updateData.tagline).trim()).slice(0, 200) : null;
    }
    if (updateData.emoji !== undefined) {
      updateData.emoji = updateData.emoji?.slice(0, 10) || null;
    }
    if (updateData.slug !== undefined) {
      updateData.slug = updateData.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
      const existing = await prisma.drop.findFirst({ where: { slug: updateData.slug, NOT: { id } } });
      if (existing) {
        return NextResponse.json({ error: "A drop with this slug already exists" }, { status: 400 });
      }
    }

    const drop = await prisma.drop.update({ where: { id }, data: updateData });
    return NextResponse.json(drop);
  } catch (err) {
    console.error("Failed to update drop:", err);
    return NextResponse.json({ error: "Failed to update drop" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await request.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // Clear the drop field from any products using this drop
    const drop = await prisma.drop.findUnique({ where: { id } });
    if (drop) {
      await prisma.product.updateMany({ where: { drop: drop.slug }, data: { drop: null } });
    }

    await prisma.drop.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete drop:", err);
    return NextResponse.json({ error: "Failed to delete drop" }, { status: 500 });
  }
}
