import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

function isAzureConfigured(): boolean {
  return !!(process.env.AZURE_STORAGE_ACCOUNT || process.env.AZURE_STORAGE_CONNECTION_STRING);
}

async function uploadToAzure(buffer: Buffer, blobName: string, contentType: string): Promise<string> {
  // Dynamic import so Azure deps aren't required for local dev
  const { BlobServiceClient } = await import("@azure/storage-blob");
  const { ClientSecretCredential, DefaultAzureCredential } = await import("@azure/identity");

  const containerName = process.env.AZURE_STORAGE_CONTAINER || "product-images";
  const account = process.env.AZURE_STORAGE_ACCOUNT;

  let blobService: InstanceType<typeof BlobServiceClient>;
  if (account) {
    const credential = process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET
      ? new ClientSecretCredential(
          process.env.AZURE_TENANT_ID,
          process.env.AZURE_CLIENT_ID,
          process.env.AZURE_CLIENT_SECRET
        )
      : new DefaultAzureCredential({
          managedIdentityClientId: process.env.AZURE_MANAGED_IDENTITY_CLIENT_ID || undefined,
        });
    blobService = new BlobServiceClient(`https://${account}.blob.core.windows.net`, credential);
  } else {
    blobService = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!);
  }

  const container = blobService.getContainerClient(containerName);
  const blockBlob = container.getBlockBlobClient(blobName);

  await blockBlob.upload(buffer, buffer.length, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  const imageHost = process.env.IMAGE_HOST || `${account}.blob.core.windows.net`;
  const url = blockBlob.url.replace(
    `${account}.blob.core.windows.net`,
    imageHost
  );

  return url;
}

async function uploadLocally(buffer: Buffer, blobName: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const filePath = path.join(uploadDir, blobName);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
  return `/uploads/${blobName}`;
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

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json({ error: "File content does not match declared type" }, { status: 400 });
    }

    const ext = MIME_TO_EXT[file.type] || "jpg";
    const safeSku = (sku || "unknown").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 50);
    const blobName = `${safeSku}/${randomUUID()}.${ext}`;

    let url: string;
    if (isAzureConfigured()) {
      url = await uploadToAzure(buffer, blobName, file.type);
    } else {
      url = await uploadLocally(buffer, blobName);
      console.log("Azure not configured — saved image locally:", url);
    }

    return NextResponse.json({ url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("Upload error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
