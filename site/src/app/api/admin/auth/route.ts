import { NextRequest, NextResponse } from "next/server";
import { getAdminCookieName, createAdminSession } from "@/lib/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
  }

  const { password } = await req.json();
  if (password === process.env.ADMIN_PASSWORD) {
    const token = createAdminSession();
    const res = NextResponse.json({ success: true });
    res.cookies.set(getAdminCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24h
      path: "/",
    });
    return res;
  }
  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
