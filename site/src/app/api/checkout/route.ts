import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { stripe } from "@/lib/stripe";

class CheckoutBusinessError extends Error {
  status: number;

  constructor(message: string, status = 409) {
    super(message);
    this.name = "CheckoutBusinessError";
    this.status = status;
  }
}

type CheckoutInputItem = {
  id: string;
  quantity: number;
  size?: string;
};

type ValidatedItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string | null;
  hasSize: boolean;
};

type ReservedItem = ValidatedItem;

async function validateItems(items: CheckoutInputItem[]): Promise<ValidatedItem[]> {
  return prisma.$transaction(async (tx) => {
    const validated: ValidatedItem[] = [];

    for (const item of items) {
      const product = await tx.product.findFirst({
        where: { id: item.id, active: true },
      });

      if (!product) {
        throw new CheckoutBusinessError("Product unavailable", 409);
      }

      if (product.hasSize) {
        if (!item.size || typeof item.size !== "string" || item.size === "ONE_SIZE") {
          throw new CheckoutBusinessError(`Size is required for ${product.name}`, 400);
        }

        const sizeRow = await tx.productSize.findUnique({
          where: { productId_size: { productId: item.id, size: item.size } },
        });

        if (!sizeRow || sizeRow.stock < item.quantity) {
          throw new CheckoutBusinessError(`Insufficient stock for size ${item.size}`, 409);
        }

        validated.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          size: item.size,
          hasSize: true,
        });
        continue;
      }

      if (product.stock < item.quantity) {
        throw new CheckoutBusinessError(`Insufficient stock for ${product.name}`, 409);
      }

      validated.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        size: null,
        hasSize: false,
      });
    }

    return validated;
  });
}

async function reserveItemsForMock(items: CheckoutInputItem[]): Promise<ReservedItem[]> {
  return prisma.$transaction(async (tx) => {
    const reserved: ReservedItem[] = [];

    for (const item of items) {
      const product = await tx.product.findFirst({
        where: { id: item.id, active: true },
      });

      if (!product) {
        throw new CheckoutBusinessError("Product unavailable", 409);
      }

      if (product.hasSize) {
        if (!item.size || typeof item.size !== "string" || item.size === "ONE_SIZE") {
          throw new CheckoutBusinessError(`Size is required for ${product.name}`, 400);
        }

        const updated = await tx.productSize.updateMany({
          where: {
            productId: item.id,
            size: item.size,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (updated.count !== 1) {
          throw new CheckoutBusinessError(`Insufficient stock for size ${item.size}`, 409);
        }

        reserved.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          size: item.size,
          hasSize: true,
        });
        continue;
      }

      const updated = await tx.product.updateMany({
        where: { id: item.id, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });

      if (updated.count !== 1) {
        throw new CheckoutBusinessError(`Insufficient stock for ${product.name}`, 409);
      }

      reserved.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        size: null,
        hasSize: false,
      });
    }

    return reserved;
  });
}

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();
    const stripeMode = (process.env.STRIPE_MODE || "mock").toLowerCase();

    if (!items?.length || !Array.isArray(items)) {
      return NextResponse.json({ error: "No items", code: "NO_ITEMS" }, { status: 400 });
    }

    const parsedItems = items as CheckoutInputItem[];

    const totalQty = parsedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    if (totalQty > 5) {
      return NextResponse.json(
        {
          error: "Maximum 5 items per order. For bulk orders, please email meg@magicalthreadswithmeg.com",
          code: "MAX_ITEMS_EXCEEDED",
        },
        { status: 400 }
      );
    }

    for (const item of parsedItems) {
      if (!item.id || typeof item.id !== "string") {
        return NextResponse.json({ error: "Invalid item id", code: "INVALID_ITEM_ID" }, { status: 400 });
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        return NextResponse.json({ error: "Invalid quantity (must be 1-100)", code: "INVALID_QUANTITY" }, { status: 400 });
      }
    }

    if (stripeMode === "mock") {
      const reservation = await reserveItemsForMock(parsedItems);
      const total = reservation.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const order = await prisma.order.create({
        data: {
          id: randomUUID(),
          stripeSessionId: `mock_${randomUUID()}`,
          customerName: "Mock Customer",
          customerEmail: "mock@magicalthreads.local",
          total,
          status: "confirmed",
          notes: "Mock checkout",
          items: {
            create: reservation.map((item) => ({
              id: randomUUID(),
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
              size: item.size,
            })),
          },
        },
      });

      return NextResponse.json({ success: true, mock: true, orderId: order.id, message: "Mock checkout completed" });
    }

    if (stripeMode !== "test" && stripeMode !== "live") {
      return NextResponse.json({ error: `Unsupported STRIPE_MODE: ${stripeMode}` }, { status: 400 });
    }

    const validatedItems = await validateItems(parsedItems);
    const total = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: validatedItems.map((item) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
              metadata: {
                productId: item.id,
                size: item.size || "ONE_SIZE",
              },
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        })),
        shipping_address_collection: {
          allowed_countries: ["US"],
        },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 599, currency: "usd" },
              display_name: "Standard Shipping",
              delivery_estimate: {
                minimum: { unit: "business_day", value: 3 },
                maximum: { unit: "business_day", value: 7 },
              },
            },
          },
        ],
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/shop`,
      });

      await prisma.order.create({
        data: {
          id: randomUUID(),
          stripeSessionId: session.id,
          customerName: "Stripe Checkout Customer",
          customerEmail: "pending@magicalthreads.local",
          total,
          status: "pending",
          notes: "Awaiting Stripe payment",
          items: {
            create: validatedItems.map((item) => ({
              id: randomUUID(),
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
              size: item.size,
            })),
          },
        },
      });

      return NextResponse.json({ url: session.url, sessionId: session.id });
    } catch (stripeErr) {
      throw stripeErr;
    }
  } catch (err: unknown) {
    if (err instanceof CheckoutBusinessError) {
      return NextResponse.json({ error: err.message, code: "CHECKOUT_VALIDATION_FAILED" }, { status: err.status });
    }

    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message, code: "CHECKOUT_FAILED" }, { status: 500 });
  }
}
