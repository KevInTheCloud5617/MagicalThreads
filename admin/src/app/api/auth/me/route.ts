import { NextResponse } from "next/server";
import { getUserFirstName } from "@/lib/auth";

export async function GET() {
  const firstName = await getUserFirstName();
  return NextResponse.json({ firstName });
}
