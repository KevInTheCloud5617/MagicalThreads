import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();

    if (!items?.length || !Array.isArray(items)) {
      return NextResponse.json({ error: "No items" }, { status: 400 });
    }

    // Validate each item
    for (const item of items) {
      if (!item.id || typeof item.id !== "string") {
        return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        return NextResponse.json({ error: "Invalid quantity (must be 1-100)" }, { status: 400 });
      }
    }

    // Look up real prices from DB — never trust client-sent prices
    const productIds = items.map((item: { id: string }) => item.id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const line_items = items.map((item: { id: string; quantity: number }) => {
      const product = productMap.get(item.id);
      if (!product) {
        throw new Error(`Product not found or inactive: ${item.id}`);
      }
      return {
        price_data: {
          currency: "usd",
          product_data: { name: product.name },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.quantity,
      };
    });

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
