import { NextRequest, NextResponse } from "next/server";
import { BlobServiceClient } from "@azure/storage-blob";
import { randomUUID } from "crypto";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const containerName = process.env.AZURE_STORAGE_CONTAINER || "product-images";

const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xFF, 0xD8, 0xFF],
  "image/png": [0x89, 0x50, 0x4E, 0x47],
  "image/gif": [0x47, 0x49, 0x46],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const expected = MAGIC_BYTES[mimeType];
  if (!expected) return false;
  for (let i = 0; i < expected.length; i++) {
    if (buffer[i] !== expected[i]) return false;
  }
  if (mimeType === "image/webp") {
    const webpSig = buffer.slice(8, 12).toString("ascii");
    if (webpSig !== "WEBP") return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sku = formData.get("sku") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!sku) {
      return NextResponse.json({ error: "No SKU provided" }, { status: 400 });
    }

    // Validate file type
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." }, { status: 400 });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate magic bytes
    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json({ error: "File content does not match declared type" }, { status: 400 });
    }

    // Derive extension from MIME type, not filename
    const ext = MIME_TO_EXT[file.type] || "jpg";

    // Sanitize SKU for blob path
    const safeSku = (sku || "unknown").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 50);
    const blobName = `${safeSku}/${randomUUID()}.${ext}`;

    const blobService = BlobServiceClient.fromConnectionString(connectionString);
    const container = blobService.getContainerClient(containerName);
    const blockBlob = container.getBlockBlobClient(blobName);

    await blockBlob.upload(buffer, buffer.length, {
      blobHTTPHeaders: { blobContentType: file.type },
    });

    const url = blockBlob.url;

    return NextResponse.json({ url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("Upload error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
