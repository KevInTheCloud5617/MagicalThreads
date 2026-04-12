import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sanitize } from "@/lib/sanitize";
import { isAdminAuthenticated } from "@/lib/auth";
import { getArchivedOrder, listArchivedOrders, updateArchivedOrder } from "@/lib/order-archive";

const VALID_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

function mapStatusToShippingStatus(status: string): "pending" | "shipped" | "delivered" {
  if (status === "shipped") return "shipped";
  if (status === "delivered") return "delivered";
  return "pending";
}

function dbOrderToApi(order: any) {
  const shippingAddress = [
    order.shippingName,
    order.shippingAddress,
    [order.shippingCity, order.shippingState, order.shippingZip].filter(Boolean).join(" "),
    order.shippingCountry,
  ]
    .filter(Boolean)
    .join(", ");

  const subtotal = order.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

  return {
    id: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    total: order.total,
    subtotal,
    shippingCost: order.shippingCost ?? Math.max(0, order.total - subtotal),
    status: order.status,
    paymentStatus: order.status,
    shippingStatus: mapStatusToShippingStatus(order.status),
    trackingNumber: order.trackingNumber || "",
    notes: order.notes,
    stripeSessionId: order.stripeSessionId || "",
    shippingAddress,
    archived: false,
    items: order.items.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      size: item.size,
      product: { name: item.product?.name || `Deleted product (${item.productId ?? "unknown"})` },
    })),
    createdAt: order.createdAt,
  };
}

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

  const merged = new Map<string, any>();

  for (const archived of archivedOrders) {
    merged.set(archived.orderId, {
      id: archived.orderId,
      customerName: archived.customerName,
      customerEmail: archived.customerEmail,
      total: archived.total,
      subtotal: archived.subtotal,
      shippingCost: archived.shippingCost,
      status: archived.paymentStatus,
      paymentStatus: archived.paymentStatus,
      shippingStatus: archived.shippingStatus,
      trackingNumber: archived.trackingNumber,
      notes: "",
      stripeSessionId: archived.stripeSessionId,
      shippingAddress: archived.shippingAddress,
      archived: true,
      items: archived.items.map((item, index) => ({
        id: `${archived.orderId}-${index}`,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        product: { name: item.productName },
      })),
      createdAt: archived.date,
    });
  }

  for (const dbOrder of dbOrders) {
    merged.set(dbOrder.id, dbOrderToApi(dbOrder));
  }

  const allOrders = [...merged.values()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return NextResponse.json(allOrders);
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();
  const { id, ...updateData } = data;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  if (updateData.status !== undefined) {
    if (!VALID_STATUSES.includes(updateData.status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }
  }

  if (updateData.trackingNumber !== undefined && updateData.trackingNumber !== null && updateData.trackingNumber !== "") {
    if (
      typeof updateData.trackingNumber !== "string" ||
      !/^[a-zA-Z0-9_-]+$/.test(updateData.trackingNumber) ||
      updateData.trackingNumber.length > 100
    ) {
      return NextResponse.json({ error: "Invalid tracking number (alphanumeric only)" }, { status: 400 });
    }
    updateData.trackingNumber = sanitize(updateData.trackingNumber);
  }

  if (updateData.notes) updateData.notes = sanitize(updateData.notes);

  const updatedDb = await prisma.order.updateMany({
    where: { id },
    data: updateData,
  });

  const archived = await updateArchivedOrder(id, {
    shippingStatus: updateData.status ? mapStatusToShippingStatus(updateData.status) : undefined,
    trackingNumber:
      updateData.trackingNumber === undefined || updateData.trackingNumber === null ? undefined : String(updateData.trackingNumber),
    paymentStatus: updateData.status,
  });

  if (updatedDb.count === 0 && !archived) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const dbOrder = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (dbOrder) {
    return NextResponse.json(dbOrderToApi(dbOrder));
  }

  const archiveOnly = await getArchivedOrder(id);
  if (archiveOnly) {
    return NextResponse.json({
      id: archiveOnly.orderId,
      customerName: archiveOnly.customerName,
      customerEmail: archiveOnly.customerEmail,
      total: archiveOnly.total,
      subtotal: archiveOnly.subtotal,
      shippingCost: archiveOnly.shippingCost,
      status: archiveOnly.paymentStatus,
      paymentStatus: archiveOnly.paymentStatus,
      shippingStatus: archiveOnly.shippingStatus,
      trackingNumber: archiveOnly.trackingNumber,
      notes: "",
      stripeSessionId: archiveOnly.stripeSessionId,
      shippingAddress: archiveOnly.shippingAddress,
      archived: true,
      items: archiveOnly.items,
      createdAt: archiveOnly.date,
    });
  }

  return NextResponse.json({ success: true });
}
