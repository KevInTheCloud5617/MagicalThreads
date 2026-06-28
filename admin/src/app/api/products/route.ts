import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/db";
import { sanitize } from "@/lib/sanitize";
import { isAdminAuthenticated } from "@/lib/auth";
import { syncProductToStripe } from "@/lib/stripe-product-sync";
import { parseCustomizationOptions, serializeCustomizationOptions } from "@/lib/customization";

const ALLOWED_SIZES = ["S", "M", "L", "XL", "2XL", "3XL"] as const;
type AllowedSize = (typeof ALLOWED_SIZES)[number];

const COLOR_HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

type AdditionalImageInput = {
  url: string;
  alt?: string;
  sortOrder?: number;
};

type ColorInput = {
  name: string;
  hex: string;
  sortOrder?: number;
};

const PRODUCT_INCLUDE = {
  sizes: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  colors: { orderBy: { sortOrder: "asc" as const } },
} as const;

function normalizeSizes(input: unknown): Record<AllowedSize, number> {
  const map = Object.fromEntries(ALLOWED_SIZES.map((size) => [size, 0])) as Record<AllowedSize, number>;
  if (!input || typeof input !== "object") return map;
  for (const size of ALLOWED_SIZES) {
    const raw = (input as Record<string, unknown>)[size];
    const value = typeof raw === "string" ? Number.parseInt(raw, 10) : Number(raw ?? 0);
    map[size] = Number.isInteger(value) && value >= 0 ? value : 0;
  }
  return map;
}

function normalizeAdditionalImages(input: unknown): Array<{ url: string; alt: string | null; sortOrder: number }> {
  if (!Array.isArray(input)) return [];

  return input
    .map((img, index) => {
      if (!img || typeof img !== "object") return null;
      const maybe = img as AdditionalImageInput;
      const url = typeof maybe.url === "string" ? maybe.url.trim() : "";
      if (!url) return null;
      const sortOrder = Number.isInteger(maybe.sortOrder) ? Number(maybe.sortOrder) : index;
      const alt = typeof maybe.alt === "string" && maybe.alt.trim() ? sanitize(maybe.alt.trim()) : null;
      return { url, alt, sortOrder: sortOrder >= 0 ? sortOrder : index };
    })
    .filter((img): img is { url: string; alt: string | null; sortOrder: number } => Boolean(img))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img, index) => ({ ...img, sortOrder: index }));
}

function normalizeColors(input: unknown): Array<{ name: string; hex: string; sortOrder: number }> {
  if (!Array.isArray(input)) return [];

  const seenNames = new Set<string>();
  return input
    .map((c, index) => {
      if (!c || typeof c !== "object") return null;
      const maybe = c as ColorInput;
      const name = typeof maybe.name === "string" ? sanitize(maybe.name.trim()).slice(0, 40) : "";
      const hex = typeof maybe.hex === "string" ? maybe.hex.trim() : "";
      if (!name || !COLOR_HEX_RE.test(hex)) return null;
      const lowered = name.toLowerCase();
      if (seenNames.has(lowered)) return null;
      seenNames.add(lowered);
      const sortOrder = Number.isInteger(maybe.sortOrder) ? Number(maybe.sortOrder) : index;
      return { name, hex, sortOrder: sortOrder >= 0 ? sortOrder : index };
    })
    .filter((c): c is { name: string; hex: string; sortOrder: number } => Boolean(c))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c, index) => ({ ...c, sortOrder: index }));
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const products = await prisma.product.findMany({ include: PRODUCT_INCLUDE, orderBy: { createdAt: "desc" } });
  const decorated = products.map((p) => ({ ...p, customizationOptions: parseCustomizationOptions(p.customizationOptions) }));
  return NextResponse.json(decorated);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();
    if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0 || data.name.length > 200) return NextResponse.json({ error: "Invalid product name" }, { status: 400 });
    if (data.description && data.description.length > 5000) return NextResponse.json({ error: "Description too long" }, { status: 400 });

    const stock = parseInt(String(data.stock), 10);
    if (isNaN(stock) || stock < 0) return NextResponse.json({ error: "Stock quantity is required and must be a non-negative integer" }, { status: 400 });

    const price = Number(data.price);
    if (isNaN(price) || price < 0 || price > 99999) return NextResponse.json({ error: "Invalid price" }, { status: 400 });

    const sizes = normalizeSizes(data.sizes);
    const additionalImages = normalizeAdditionalImages(data.additionalImages);
    const hasColor = Boolean(data.hasColor);
    const colors = hasColor ? normalizeColors(data.colors) : [];
    if (hasColor && colors.length === 0) {
      return NextResponse.json({ error: "At least one color is required when colors are enabled" }, { status: 400 });
    }
    const name = sanitize(data.name);
    const slug = data.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const sku = data.sku || `MT-${randomUUID().slice(0, 8).toUpperCase()}`;
    const customizationOptions = serializeCustomizationOptions(parseCustomizationOptions(data.customizationOptions));

    const createdProduct = await prisma.product.create({
      data: {
        sku,
        name,
        slug,
        price,
        category: data.category ? sanitize(data.category) : data.category,
        drop: data.drop ? sanitize(data.drop) : null,
        description: data.description ? sanitize(data.description) : data.description,
        tag: data.tag ? sanitize(data.tag) : null,
        image: data.image || null,
        active: Boolean(data.active ?? true),
        stock,
        hasSize: Boolean(data.hasSize),
        hasColor,
        customizationOptions,
        sizes: { create: ALLOWED_SIZES.map((size) => ({ size, stock: Boolean(data.hasSize) ? sizes[size] : 0 })) },
        images: additionalImages.length
          ? { create: additionalImages.map((img) => ({ url: img.url, alt: img.alt, sortOrder: img.sortOrder })) }
          : undefined,
        colors: colors.length
          ? { create: colors.map((c) => ({ name: c.name, hex: c.hex, sortOrder: c.sortOrder })) }
          : undefined,
      },
      include: PRODUCT_INCLUDE,
    });

    let stripeSyncError: string | undefined;
    try {
      await syncProductToStripe(createdProduct.id);
    } catch (syncError) {
      stripeSyncError = syncError instanceof Error ? syncError.message : "Stripe sync failed";
      console.error("Stripe sync failed after product create:", syncError);
    }

    const product = await prisma.product.findUnique({ where: { id: createdProduct.id }, include: PRODUCT_INCLUDE });
    return NextResponse.json({ ...product, stripeSyncError }, { status: 201 });
  } catch (err: unknown) {
    console.error("Failed to create product:", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await request.json();
  const { id, ...updateData } = data;

  if (!id || typeof id !== "string") return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  if (updateData.tag === "") updateData.tag = null;
  if (updateData.drop === "") updateData.drop = null;
  if (updateData.drop !== undefined && updateData.drop !== null) updateData.drop = sanitize(updateData.drop);
  if (updateData.name !== undefined) updateData.name = sanitize(String(updateData.name));
  if (updateData.description !== undefined && updateData.description !== null) updateData.description = sanitize(updateData.description);
  if (updateData.category !== undefined && updateData.category !== null) updateData.category = sanitize(updateData.category);
  if (updateData.tag) updateData.tag = sanitize(updateData.tag);

  const sizes = normalizeSizes(updateData.sizes);
  const hasSize = updateData.hasSize === undefined ? undefined : Boolean(updateData.hasSize);
  const additionalImages = normalizeAdditionalImages(updateData.additionalImages);
  const hasColorProvided = Object.prototype.hasOwnProperty.call(updateData, "hasColor");
  const hasColor = hasColorProvided ? Boolean(updateData.hasColor) : undefined;
  const colorsProvided = Object.prototype.hasOwnProperty.call(updateData, "colors");
  const colors = colorsProvided ? normalizeColors(updateData.colors) : null;
  if (hasColor === true && colors !== null && colors.length === 0) {
    return NextResponse.json({ error: "At least one color is required when colors are enabled" }, { status: 400 });
  }
  delete updateData.sizes;
  delete updateData.additionalImages;
  delete updateData.colors;
  // Strip Prisma relation fields that may come back via spread of a fetched product
  delete updateData.images;
  delete updateData.productSizes;
  delete updateData.orderItems;
  delete updateData.createdAt;
  delete updateData.updatedAt;
  if (Object.prototype.hasOwnProperty.call(updateData, "customizationOptions")) {
    updateData.customizationOptions = serializeCustomizationOptions(parseCustomizationOptions(updateData.customizationOptions));
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data: updateData });
    await Promise.all(
      ALLOWED_SIZES.map((size) =>
        tx.productSize.upsert({
          where: { productId_size: { productId: id, size } },
          update: { stock: hasSize === false ? 0 : sizes[size] },
          create: { productId: id, size, stock: hasSize === false ? 0 : sizes[size] },
        }),
      ),
    );

    await tx.productImage.deleteMany({ where: { productId: id } });
    if (additionalImages.length) {
      await tx.productImage.createMany({
        data: additionalImages.map((img) => ({ productId: id, url: img.url, alt: img.alt, sortOrder: img.sortOrder })),
      });
    }

    // Colors: only touch if caller sent the field. If hasColor is being
    // turned off, also clear out the rows so a future toggle-back starts clean.
    if (hasColor === false) {
      await tx.productColor.deleteMany({ where: { productId: id } });
    } else if (colors !== null) {
      await tx.productColor.deleteMany({ where: { productId: id } });
      if (colors.length) {
        await tx.productColor.createMany({
          data: colors.map((c) => ({ productId: id, name: c.name, hex: c.hex, sortOrder: c.sortOrder })),
        });
      }
    }

    return tx.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
  });

  let stripeSyncError: string | undefined;
  try {
    await syncProductToStripe(id);
  } catch (syncError) {
    stripeSyncError = syncError instanceof Error ? syncError.message : "Stripe sync failed";
    console.error("Stripe sync failed after product update:", syncError);
  }

  const product = await prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
  return NextResponse.json({ ...product, stripeSyncError });
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await request.json();
  if (!id || typeof id !== "string") return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  await prisma.$transaction(async (tx) => {
    await tx.productImage.deleteMany({ where: { productId: id } });
    await tx.productSize.deleteMany({ where: { productId: id } });
    await tx.productColor.deleteMany({ where: { productId: id } });
    await tx.orderItem.deleteMany({ where: { productId: id } });
    await tx.product.delete({ where: { id } });
  });
  return NextResponse.json({ success: true });
}
