import { NextRequest, NextResponse } from "next/server";
import { getAdminCookieName, createAdminSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password === process.env.ADMIN_PASSWORD) {
    const token = createAdminSession();
    const res = NextResponse.json({ success: true });
    res.cookies.set(getAdminCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    return res;
  }
  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
