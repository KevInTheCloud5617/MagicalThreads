import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { archivedOrdersToCsv, listArchivedOrders, type ArchivedOrder } from "@/lib/order-archive";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [dbOrders, archivedOrders] = await Promise.all([
    prisma.order.findMany({
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    listArchivedOrders(),
  ]);

  const merged = new Map<string, ArchivedOrder>();

  for (const archived of archivedOrders) {
    merged.set(archived.orderId, archived);
  }

  for (const dbOrder of dbOrders) {
    const subtotal = dbOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingAddress = [
      dbOrder.shippingName,
      dbOrder.shippingAddress,
      [dbOrder.shippingCity, dbOrder.shippingState, dbOrder.shippingZip].filter(Boolean).join(" "),
      dbOrder.shippingCountry,
    ]
      .filter(Boolean)
      .join(", ");

    merged.set(dbOrder.id, {
      orderId: dbOrder.id,
      date: dbOrder.createdAt.toISOString(),
      customerName: dbOrder.customerName,
      customerEmail: dbOrder.customerEmail,
      shippingAddress,
      items: dbOrder.items.map((item) => ({
        productId: item.productId,
        productName: item.product?.name || `Deleted product (${item.productId ?? "unknown"})`,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal,
      shippingCost: dbOrder.shippingCost ?? Math.max(0, dbOrder.total - subtotal),
      total: dbOrder.total,
      paymentStatus: dbOrder.status,
      stripeSessionId: dbOrder.stripeSessionId || "",
      trackingNumber: dbOrder.trackingNumber || "",
      shippingStatus: dbOrder.status === "delivered" ? "delivered" : dbOrder.status === "shipped" ? "shipped" : "pending",
    });
  }

  const csv = archivedOrdersToCsv([...merged.values()].sort((a, b) => +new Date(b.date) - +new Date(a.date)));

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
