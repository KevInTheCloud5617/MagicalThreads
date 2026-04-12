import { NextRequest, NextResponse } from "next/server";
import { BlobServiceClient } from "@azure/storage-blob";
import { ClientSecretCredential, DefaultAzureCredential } from "@azure/identity";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { isAdminAuthenticated } from "@/lib/auth";

export const config = {
  api: { bodyParser: false },
};

// Next.js App Router: increase body size limit
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const containerName = process.env.AZURE_STORAGE_CONTAINER || "product-images";

const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/gif": [0x47, 0x49, 0x46],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
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

async function optimizeImage(input: Buffer, mimeType: string): Promise<{ buffer: Buffer; mimeType: string; ext: string }> {
  const image = sharp(input, { animated: true, failOn: "none" });
  const metadata = await image.metadata();

  const resized = image.resize({
    width: 1600,
    height: 1600,
    fit: "inside",
    withoutEnlargement: true,
  });

  if (mimeType === "image/png" && metadata.hasAlpha) {
    return {
      buffer: await resized.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer(),
      mimeType: "image/png",
      ext: "png",
    };
  }

  return {
    buffer: await resized.jpeg({ quality: 85, mozjpeg: true }).toBuffer(),
    mimeType: "image/jpeg",
    ext: "jpg",
  };
}

function getBlobServiceClient(): BlobServiceClient {
  const account = process.env.AZURE_STORAGE_ACCOUNT;
  if (account) {
    const credential =
      process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET
        ? new ClientSecretCredential(
            process.env.AZURE_TENANT_ID,
            process.env.AZURE_CLIENT_ID,
            process.env.AZURE_CLIENT_SECRET
          )
        : new DefaultAzureCredential({
            managedIdentityClientId: process.env.AZURE_MANAGED_IDENTITY_CLIENT_ID || undefined,
          });

    return new BlobServiceClient(`https://${account}.blob.core.windows.net`, credential);
  }

  return BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!);
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

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 20MB." }, { status: 400 });
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());

    // Validate magic bytes
    if (!validateMagicBytes(originalBuffer, file.type)) {
      return NextResponse.json({ error: "File content does not match declared type" }, { status: 400 });
    }

    const optimized = await optimizeImage(originalBuffer, file.type);

    // Sanitize SKU for blob path
    const safeSku = (sku || "unknown").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 50);
    const blobName = `${safeSku}/${randomUUID()}.${optimized.ext}`;

    const blobService = getBlobServiceClient();
    const container = blobService.getContainerClient(containerName);
    const blockBlob = container.getBlockBlobClient(blobName);

    await blockBlob.upload(optimized.buffer, optimized.buffer.length, {
      blobHTTPHeaders: { blobContentType: optimized.mimeType },
    });

    const imageHost = process.env.IMAGE_HOST || `${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`;
    const url = blockBlob.url.replace(`${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`, imageHost);

    return NextResponse.json({ url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("Upload error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
