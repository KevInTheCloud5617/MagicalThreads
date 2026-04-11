import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/db";

class CheckoutBusinessError extends Error {
  status: number;

  constructor(message: string, status = 409) {
    super(message);
    this.name = "CheckoutBusinessError";
    this.status = status;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();

    if (!items?.length || !Array.isArray(items)) {
      return NextResponse.json({ error: "No items", code: "NO_ITEMS" }, { status: 400 });
    }

    const totalQty = items.reduce((sum: number, item: { quantity: number }) => sum + (item.quantity || 0), 0);
    if (totalQty > 5) {
      return NextResponse.json({ error: "Maximum 5 items per order. For bulk orders, please email meg@magicalthreadswithmeg.com", code: "MAX_ITEMS_EXCEEDED" }, { status: 400 });
    }

    for (const item of items) {
      if (!item.id || typeof item.id !== "string") {
        return NextResponse.json({ error: "Invalid item id", code: "INVALID_ITEM_ID" }, { status: 400 });
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        return NextResponse.json({ error: "Invalid quantity (must be 1-100)", code: "INVALID_QUANTITY" }, { status: 400 });
      }
    }

    const reservation = await prisma.$transaction(async (tx) => {
      const reserved: Array<{ id: string; quantity: number; name: string; price: number }> = [];

      for (const item of items as Array<{ id: string; quantity: number }>) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.id,
            active: true,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (updated.count !== 1) {
          throw new CheckoutBusinessError("Insufficient stock or product unavailable", 409);
        }

        const product = await tx.product.findUnique({
          where: { id: item.id },
          select: { id: true, name: true, price: true },
        });

        if (!product) {
          throw new CheckoutBusinessError("Product unavailable", 409);
        }

        reserved.push({ id: product.id, quantity: item.quantity, name: product.name, price: product.price });
      }

      return reserved;
    });

    try {
      const line_items = reservation.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));

      const origin = req.headers.get("origin") || "http://localhost:3000";
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items,
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout/cancel`,
      });

      return NextResponse.json({ url: session.url });
    } catch (stripeErr) {
      await prisma.$transaction(
        reservation.map((item) =>
          prisma.product.update({
            where: { id: item.id },
            data: { stock: { increment: item.quantity } },
          })
        )
      );
      throw stripeErr;
    }
  } catch (err: unknown) {
    if (err instanceof CheckoutBusinessError) {
      return NextResponse.json({ error: err.message, code: "INSUFFICIENT_STOCK" }, { status: err.status });
    }

    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message, code: "CHECKOUT_FAILED" }, { status: 500 });
  }
}
