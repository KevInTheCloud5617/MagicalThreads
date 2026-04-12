import prisma from "@/lib/db";
import { getStripe } from "@/lib/stripe";

function normalizeImageUrl(image?: string | null): string[] | undefined {
  if (!image || typeof image !== "string") return undefined;
  const trimmed = image.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return [trimmed];
  return [`https://${trimmed.replace(/^\/+/, "")}`];
}

export async function syncProductToStripe(productId: string): Promise<{ synced: boolean; reason?: string; product?: Awaited<ReturnType<typeof prisma.product.update>> }> {
  const secretKey = (process.env.STRIPE_SECRET_KEY ?? "").trim();
  if (!secretKey) {
    return { synced: false, reason: "Stripe not configured" };
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  const stripe = getStripe();
  const images = normalizeImageUrl(product.image);

  let stripeProductId = product.stripeProductId;

  if (stripeProductId) {
    await stripe.products.update(stripeProductId, {
      name: product.name,
      description: product.description || undefined,
      images,
      metadata: {
        productId: product.id,
        sku: product.sku,
        slug: product.slug,
      },
      active: product.active,
    });
  } else {
    const createdProduct = await stripe.products.create({
      name: product.name,
      description: product.description || undefined,
      images,
      metadata: {
        productId: product.id,
        sku: product.sku,
        slug: product.slug,
      },
      active: product.active,
    });
    stripeProductId = createdProduct.id;
  }

  const unitAmount = Math.round(product.price * 100);
  let stripePriceId = product.stripePriceId;
  let needsNewPrice = true;

  if (stripePriceId) {
    try {
      const existingPrice = await stripe.prices.retrieve(stripePriceId);
      const isDeleted = "deleted" in existingPrice && existingPrice.deleted;
      needsNewPrice =
        isDeleted ||
        existingPrice.unit_amount !== unitAmount ||
        existingPrice.currency !== "usd" ||
        typeof existingPrice.product !== "string" ||
        existingPrice.product !== stripeProductId;
    } catch {
      needsNewPrice = true;
    }
  }

  if (needsNewPrice) {
    const newPrice = await stripe.prices.create({
      unit_amount: unitAmount,
      currency: "usd",
      product: stripeProductId,
      metadata: {
        productId: product.id,
      },
    });

    stripePriceId = newPrice.id;
  }

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: {
      stripeProductId,
      stripePriceId,
    },
  });

  return { synced: true, product: updated };
}

export async function syncAllProductsToStripe() {
  const products = await prisma.product.findMany({ select: { id: true } });
  const results = [] as Array<{ productId: string; synced: boolean; reason?: string; error?: string }>;

  for (const product of products) {
    try {
      const result = await syncProductToStripe(product.id);
      results.push({ productId: product.id, synced: result.synced, reason: result.reason });
    } catch (error) {
      results.push({
        productId: product.id,
        synced: false,
        error: error instanceof Error ? error.message : "Sync failed",
      });
    }
  }

  return results;
}
