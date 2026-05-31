import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { parsePersonalizationPresets, DEFAULT_PRESETS } from "@/lib/customization";
import { getPersonalizationPresets, savePersonalizationPresets } from "@/lib/personalization-presets";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const presets = await getPersonalizationPresets(prisma);
  return NextResponse.json(presets);
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const parsed = parsePersonalizationPresets(body) ?? DEFAULT_PRESETS;
    await savePersonalizationPresets(prisma, parsed);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Failed to save personalization presets:", err);
    return NextResponse.json({ error: "Failed to save presets" }, { status: 500 });
  }
}
