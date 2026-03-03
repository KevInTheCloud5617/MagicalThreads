import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
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
  const data = await request.json();
  const { id, ...updateData } = data;

  const order = await prisma.order.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(order);
}
