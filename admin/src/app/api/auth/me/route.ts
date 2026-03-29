import { NextResponse } from "next/server";
import { getUserFirstName, isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const firstName = await getUserFirstName();
  return NextResponse.json({ firstName });
}
