import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { saveArchivedOrder, type ArchivedOrder } from "@/lib/order-archive";

function buildShippingAddress(order: {
  shippingName: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingZip: string | null;
  shippingCountry: string | null;
}) {
  return [
    order.shippingName,
    order.shippingAddress,
    [order.shippingCity, order.shippingState, order.shippingZip].filter(Boolean).join(" "),
    order.shippingCountry,
  ]
    .filter(Boolean)
    .join(", ");
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing Stripe webhook signature/secret" }, { status: 400 });
  }

  const payload = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const sessionId = session.id;

      const existing = await prisma.order.findUnique({
        where: { stripeSessionId: sessionId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!existing) {
        return NextResponse.json({ received: true, ignored: true });
      }

      if (existing.status !== "confirmed") {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: existing.id },
            data: {
              status: "confirmed",
              customerName: session.customer_details?.name || existing.customerName,
              customerEmail: session.customer_details?.email || existing.customerEmail,
              stripePaymentId: typeof session.payment_intent === "string" ? session.payment_intent : existing.stripePaymentId,
              shippingName: session.customer_details?.name || null,
              shippingAddress:
                [session.customer_details?.address?.line1, session.customer_details?.address?.line2].filter(Boolean).join(", ") || null,
              shippingCity: session.customer_details?.address?.city || null,
              shippingState: session.customer_details?.address?.state || null,
              shippingZip: session.customer_details?.address?.postal_code || null,
              shippingCountry: session.customer_details?.address?.country || null,
              shippingCost: typeof session.shipping_cost?.amount_total === "number" ? session.shipping_cost.amount_total / 100 : null,
            },
          });

          for (const item of existing.items) {
            if (item.size && item.size !== "ONE_SIZE") {
              await tx.productSize.updateMany({
                where: {
                  productId: item.productId ?? "",
                  size: item.size,
                  stock: { gte: item.quantity },
                },
                data: { stock: { decrement: item.quantity } },
              });
            } else if (item.productId) {
              await tx.product.updateMany({
                where: {
                  id: item.productId,
                  stock: { gte: item.quantity },
                },
                data: { stock: { decrement: item.quantity } },
              });
            }
          }
        });
      }

      const confirmedOrder = await prisma.order.findUnique({
        where: { id: existing.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (confirmedOrder) {
        const subtotal = confirmedOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shippingCost = confirmedOrder.shippingCost ?? Math.max(0, confirmedOrder.total - subtotal);

        const archiveRecord: ArchivedOrder = {
          orderId: confirmedOrder.id,
          date: confirmedOrder.createdAt.toISOString(),
          customerName: confirmedOrder.customerName,
          customerEmail: confirmedOrder.customerEmail,
          shippingAddress: buildShippingAddress(confirmedOrder),
          items: confirmedOrder.items.map((item) => ({
            productId: item.productId,
            productName: item.product?.name || `Deleted product (${item.productId ?? "unknown"})`,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal,
          shippingCost,
          total: confirmedOrder.total,
          paymentStatus: confirmedOrder.status,
          stripeSessionId: confirmedOrder.stripeSessionId || "",
          trackingNumber: confirmedOrder.trackingNumber || "",
          shippingStatus:
            confirmedOrder.status === "delivered" ? "delivered" : confirmedOrder.status === "shipped" ? "shipped" : "pending",
        };

        await saveArchivedOrder(archiveRecord);
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      await prisma.order.updateMany({
        where: { stripeSessionId: session.id },
        data: { status: "cancelled" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handling failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
