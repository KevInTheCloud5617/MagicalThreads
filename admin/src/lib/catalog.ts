// Shared catalog configuration for categories and drops
// Mirrored to admin/src/lib/catalog.ts and site/src/lib/catalog.ts

export const CATEGORIES = [
  { slug: "totes", name: "Tote Bags", emoji: "👜" },
  { slug: "sweatshirts", name: "Sweatshirts", emoji: "🧵" },
  { slug: "tshirts", name: "T-Shirts/Tanks", emoji: "👕" },
  { slug: "stickers", name: "Stickers", emoji: "🏷️" },
  { slug: "hats", name: "Hats", emoji: "🧢" },
  { slug: "drinkware", name: "Drinkware", emoji: "🥤" },
  { slug: "accessories", name: "Accessories", emoji: "✨" },
] as const;

export const DROPS = [
  {
    slug: "caffeine-and-chaos",
    name: "Caffeine and Chaos",
    emoji: "☕",
    tagline: "For the moms running on coffee and pure determination",
    description: "Embrace the beautiful chaos of motherhood with pieces that celebrate your caffeine-fueled adventures.",
    color: "from-amber-900 to-orange-800", // gradient for hero
    active: true,
  },
  {
    slug: "bridal-era",
    name: "Bridal Era",
    emoji: "💍",
    tagline: "Celebrating your journey to 'I do'",
    description: "From engagement to the big day and beyond — custom pieces for brides, bridesmaids, and the whole crew.",
    color: "from-pink-200 to-rose-300",
    active: true,
  },
  {
    slug: "summer-readers-club",
    name: "Summer Readers Club",
    emoji: "📚",
    tagline: "For bookworms who love a good beach read",
    description: "Cozy up with your favorite book and show off your reader status with our literary-inspired collection.",
    color: "from-teal-600 to-cyan-500",
    active: true,
  },
  {
    slug: "theme-park-mode",
    name: "Theme Park Mode",
    emoji: "🏰",
    tagline: "Where magic meets your wardrobe",
    description: "Get ready for your next magical adventure with pieces designed for theme park days and Disney dreams.",
    color: "from-purple-700 to-indigo-600",
    active: false, // coming soon
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export type DropSlug = (typeof DROPS)[number]["slug"];

export function getCategoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getDropBySlug(slug: string) {
  return DROPS.find((d) => d.slug === slug);
}

export function getActiveDrops() {
  return DROPS.filter((d) => d.active);
}
