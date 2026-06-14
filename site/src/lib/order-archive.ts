import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

const ORDER_ARCHIVE_CONTAINER = "order-archives";
const ORDER_PREFIX = "orders";

export type ArchivedOrderItem = {
  productId: string | null;
  productName: string;
  size: string | null;
  color: string | null;
  quantity: number;
  price: number;
};

export type ArchivedOrder = {
  orderId: string;
  date: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: ArchivedOrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentStatus: string;
  stripeSessionId: string;
  trackingNumber: string;
  shippingStatus: "pending" | "shipped" | "delivered";
};

function escapeCsv(value: string | number) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function archivedOrdersToCsv(orders: ArchivedOrder[]) {
  const header = [
    "orderId",
    "date",
    "customerName",
    "customerEmail",
    "shippingAddress",
    "items",
    "subtotal",
    "shippingCost",
    "total",
    "paymentStatus",
    "stripeSessionId",
    "trackingNumber",
    "shippingStatus",
  ];

  const lines = orders.map((order) => {
    const itemsText = order.items
      .map((item) => `${item.productName}${item.color ? ` [${item.color}]` : ""} (${item.size || "ONE_SIZE"}) x${item.quantity} @ $${item.price.toFixed(2)}`)
      .join("; ");

    return [
      escapeCsv(order.orderId),
      escapeCsv(order.date),
      escapeCsv(order.customerName),
      escapeCsv(order.customerEmail),
      escapeCsv(order.shippingAddress),
      escapeCsv(itemsText),
      escapeCsv(order.subtotal.toFixed(2)),
      escapeCsv(order.shippingCost.toFixed(2)),
      escapeCsv(order.total.toFixed(2)),
      escapeCsv(order.paymentStatus),
      escapeCsv(order.stripeSessionId),
      escapeCsv(order.trackingNumber),
      escapeCsv(order.shippingStatus),
    ].join(",");
  });

  return [header.join(","), ...lines].join("\n");
}

function getBlobServiceClient() {
  const account = process.env.AZURE_STORAGE_ACCOUNT;
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (connectionString) {
    return BlobServiceClient.fromConnectionString(connectionString);
  }

  if (!account) {
    throw new Error("Missing Azure blob configuration. Set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT.");
  }

  return new BlobServiceClient(`https://${account}.blob.core.windows.net`, new DefaultAzureCredential());
}

async function getContainerClient() {
  const blobService = getBlobServiceClient();
  const container = blobService.getContainerClient(ORDER_ARCHIVE_CONTAINER);
  await container.createIfNotExists();
  return container;
}

function blobPathForOrder(orderId: string) {
  return `${ORDER_PREFIX}/${orderId}.json`;
}

export async function saveArchivedOrder(order: ArchivedOrder) {
  const container = await getContainerClient();
  const blobClient = container.getBlockBlobClient(blobPathForOrder(order.orderId));
  await blobClient.upload(JSON.stringify(order, null, 2), Buffer.byteLength(JSON.stringify(order, null, 2)), {
    blobHTTPHeaders: { blobContentType: "application/json" },
  });
}

export async function updateArchivedOrder(orderId: string, updates: Partial<Pick<ArchivedOrder, "shippingStatus" | "trackingNumber" | "paymentStatus">>) {
  const existing = await getArchivedOrder(orderId);
  if (!existing) return null;

  const merged: ArchivedOrder = {
    ...existing,
    ...updates,
    trackingNumber: updates.trackingNumber ?? existing.trackingNumber ?? "",
  };

  await saveArchivedOrder(merged);
  return merged;
}

export async function getArchivedOrder(orderId: string): Promise<ArchivedOrder | null> {
  const container = await getContainerClient();
  const blobClient = container.getBlockBlobClient(blobPathForOrder(orderId));

  if (!(await blobClient.exists())) {
    return null;
  }

  const download = await blobClient.download();
  const content = await streamToString(download.readableStreamBody);
  return JSON.parse(content) as ArchivedOrder;
}

export async function listArchivedOrders(): Promise<ArchivedOrder[]> {
  const container = await getContainerClient();
  const results: ArchivedOrder[] = [];

  for await (const blob of container.listBlobsFlat({ prefix: `${ORDER_PREFIX}/` })) {
    if (!blob.name.endsWith(".json")) continue;
    const download = await container.getBlockBlobClient(blob.name).download();
    const content = await streamToString(download.readableStreamBody);
    results.push(JSON.parse(content) as ArchivedOrder);
  }

  results.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return results;
}

async function streamToString(stream: NodeJS.ReadableStream | undefined): Promise<string> {
  if (!stream) return "";
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}
