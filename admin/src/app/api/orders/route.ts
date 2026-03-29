import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sanitize } from "@/lib/sanitize";
import { isAdminAuthenticated } from "@/lib/auth";

const VALID_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
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

  // Validate status if provided
  if (updateData.status !== undefined) {
    if (!VALID_STATUSES.includes(updateData.status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }
  }

  // Validate tracking number if provided
  if (updateData.trackingNumber !== undefined && updateData.trackingNumber !== null && updateData.trackingNumber !== "") {
    if (typeof updateData.trackingNumber !== "string" || !/^[a-zA-Z0-9_-]+$/.test(updateData.trackingNumber) || updateData.trackingNumber.length > 100) {
      return NextResponse.json({ error: "Invalid tracking number (alphanumeric only)" }, { status: 400 });
    }
    updateData.trackingNumber = sanitize(updateData.trackingNumber);
  }

  // Sanitize notes if present
  if (updateData.notes) updateData.notes = sanitize(updateData.notes);

  const order = await prisma.order.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(order);
}
