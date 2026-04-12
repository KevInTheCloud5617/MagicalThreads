import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { syncAllProductsToStripe, syncProductToStripe } from "@/lib/stripe-product-sync";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const productId = typeof body?.productId === "string" ? body.productId : undefined;

    if (productId) {
      const result = await syncProductToStripe(productId);
      return NextResponse.json(result);
    }

    const results = await syncAllProductsToStripe();
    return NextResponse.json({ synced: results.filter((r) => r.synced).length, results });
  } catch (error) {
    console.error("Failed to sync products to Stripe", error);
    return NextResponse.json({ error: "Failed to sync products to Stripe" }, { status: 500 });
  }
}
