import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

function csvEscape(value: unknown): string {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function itemSummary(items: Array<{ quantity: number; size: string | null; product: { name: string } | null }>) {
  return items
    .map((item) => {
      const name = item.product?.name || "Unknown product";
      const size = item.size ? ` (${item.size})` : "";
      return `${name} x${item.quantity}${size}`;
    })
    .join("; ");
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: ["pending", "confirmed"],
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Order ID",
    "Customer Name",
    "Address Line 1",
    "Address Line 2",
    "City",
    "State",
    "Zip Code",
    "Country",
    "Email",
    "Phone",
    "Weight",
    "Items",
  ];

  const rows = orders.map((order) => {
    return [
      order.id,
      order.shippingName ?? order.customerName ?? "",
      order.shippingLine1 ?? "",
      order.shippingLine2 ?? "",
      order.shippingCity ?? "",
      order.shippingState ?? "",
      order.shippingZip ?? "",
      order.shippingCountry ?? "",
      order.customerEmail ?? "",
      order.shippingPhone ?? "",
      "",
      itemSummary(order.items),
    ];
  });

  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="shipping-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
