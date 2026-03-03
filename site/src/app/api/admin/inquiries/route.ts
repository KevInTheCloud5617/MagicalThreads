import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(inquiries);
}

export async function POST(request: Request) {
  const data = await request.json();

  const inquiry = await prisma.inquiry.create({
    data: {
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    },
  });

  return NextResponse.json(inquiry, { status: 201 });
}

export async function PUT(request: Request) {
  const data = await request.json();
  const { id, ...updateData } = data;

  const inquiry = await prisma.inquiry.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(inquiry);
}
