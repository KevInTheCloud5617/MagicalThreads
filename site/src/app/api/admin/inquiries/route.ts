import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sanitize, validateEmail } from "@/lib/sanitize";

export async function GET() {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(inquiries);
}

export async function POST(request: Request) {
  const data = await request.json();

  // Validation
  if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0 || data.name.length > 200) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  if (!data.email || typeof data.email !== "string" || !validateEmail(data.email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!data.subject || typeof data.subject !== "string" || data.subject.trim().length === 0 || data.subject.length > 300) {
    return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
  }
  if (!data.message || typeof data.message !== "string" || data.message.trim().length === 0 || data.message.length > 5000) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const inquiry = await prisma.inquiry.create({
    data: {
      name: sanitize(data.name),
      email: data.email.trim().toLowerCase(),
      subject: sanitize(data.subject),
      message: sanitize(data.message),
    },
  });

  return NextResponse.json(inquiry, { status: 201 });
}

export async function PUT(request: Request) {
  const data = await request.json();
  const { id, ...updateData } = data;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // Sanitize any string fields being updated
  if (updateData.name) updateData.name = sanitize(updateData.name);
  if (updateData.subject) updateData.subject = sanitize(updateData.subject);
  if (updateData.message) updateData.message = sanitize(updateData.message);

  const inquiry = await prisma.inquiry.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(inquiry);
}
