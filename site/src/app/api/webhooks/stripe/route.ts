import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { saveArchivedOrder, type ArchivedOrder } from "@/lib/order-archive";
import { notifyNewOrder } from "@/lib/notify";

type ReservationMetadataItem = {
  productId: string;
  quantity: number;
  size?: string;
};

function parseReservationItems(metadataItems: string | undefined): ReservationMetadataItem[] {
  if (!metadataItems) return [];

  try {
    const parsed = JSON.parse(metadataItems);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item) => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as ReservationMetadataItem;
      return (
        typeof candidate.productId === "string" &&
        candidate.productId.length > 0 &&
        Number.isInteger(candidate.quantity) &&
        candidate.quantity > 0
      );
    });
  } catch {
    return [];
  }
}

async function handleSessionRelease(session: { id: string; metadata?: { [key: string]: string } | null }, status: string) {
  const existing = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
  });

  if (!existing) {
    return;
  }

  if (existing.status === "confirmed" || existing.status === status) {
    return;
  }

  const reservationItems = parseReservationItems(session.metadata?.items);

  await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { id: existing.id } });
    if (!current || current.status === "confirmed" || current.status === status) {
      return;
    }

    if (reservationItems.length) {
      for (const item of reservationItems) {
        if (item.size && item.size !== "ONE_SIZE") {
          await tx.productSize.updateMany({
            where: {
              productId: item.productId,
              size: item.size,
            },
            data: { stock: { increment: item.quantity } },
          });
        } else {
          await tx.product.updateMany({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    }

    await tx.order.update({
      where: { id: existing.id },
      data: { status },
    });
  });
}

function buildShippingAddress(order: {
  shippingName: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingZip: string | null;
  shippingCountry: string | null;
}) {
  return [
    order.shippingName,
    order.shippingLine1,
    order.shippingLine2,
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
        await prisma.order.update({
          where: { id: existing.id },
          data: {
            status: "confirmed",
            customerName: session.customer_details?.name || existing.customerName,
            customerEmail: session.customer_details?.email || existing.customerEmail,
            stripePaymentId: typeof session.payment_intent === "string" ? session.payment_intent : existing.stripePaymentId,
            shippingCost: typeof session.shipping_cost?.amount_total === "number" ? session.shipping_cost.amount_total / 100 : null,
          },
        });
      }

      const shipping = (session as any).shipping_details;

      await prisma.order.update({
        where: { stripeSessionId: session.id },
        data: {
          shippingName: shipping?.name,
          shippingLine1: shipping?.address?.line1,
          shippingLine2: shipping?.address?.line2,
          shippingCity: shipping?.address?.city,
          shippingState: shipping?.address?.state,
          shippingZip: shipping?.address?.postal_code,
          shippingCountry: shipping?.address?.country,
          shippingPhone: session.customer_details?.phone,
          shippingAddress: [shipping?.address?.line1, shipping?.address?.line2].filter(Boolean).join(", ") || null,
        },
      });

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

        await notifyNewOrder({
          id: confirmedOrder.id,
          customerEmail: confirmedOrder.customerEmail,
          total: confirmedOrder.total,
          items: confirmedOrder.items.map((item) => ({
            name: item.product?.name || `Deleted product (${item.productId ?? "unknown"})`,
            quantity: item.quantity,
            size: item.size ?? undefined,
            price: item.price,
          })),
          shippingName: confirmedOrder.shippingName ?? undefined,
          shippingAddress: buildShippingAddress(confirmedOrder),
        });
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      await handleSessionRelease(session, "cancelled");
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object;
      await handleSessionRelease(session, "payment-failed");
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handling failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
