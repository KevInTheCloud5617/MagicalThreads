import prisma from "@/lib/db";

export const categories = [
  { slug: "crewnecks", name: "Embroidered Crewnecks", emoji: "🧵" },
  { slug: "totes", name: "Tote Bags", emoji: "👜" },
  { slug: "cups", name: "Glass Cups", emoji: "🥤" },
  { slug: "vinyl", name: "Vinyl & Decals", emoji: "✂️" },
] as const;

const withRelations = {
  sizes: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  colors: { orderBy: { sortOrder: "asc" as const } },
} as const;

export async function getProducts() {
  return prisma.product.findMany({
    where: { active: true },
    include: withRelations,
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({ where: { slug }, include: withRelations });
}

export async function getProductsByCategory(category: string) {
  return prisma.product.findMany({
    where: { active: true, category },
    include: withRelations,
    orderBy: { createdAt: "desc" },
  });
}
