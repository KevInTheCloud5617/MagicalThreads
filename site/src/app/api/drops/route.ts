import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const drops = await prisma.drop.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(drops);
}
