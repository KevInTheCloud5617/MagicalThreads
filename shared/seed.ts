import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  { name: "Book Lover Crewneck", sku: "CREW-BOOK-001", slug: "book-lover-crewneck", price: 45, category: "crewnecks", description: "A cozy embroidered crewneck for the bookworm in your life. Features delicate book and floral stitching.", tag: "Bestseller", image: "/uploads/seed/book-lover-crewneck.svg" },
  { name: '"Once Upon a Time" Crewneck', sku: "CREW-OUAT-001", slug: "once-upon-a-time-crew", price: 48, category: "crewnecks", description: "Fairytale-inspired embroidered sweatshirt with castle and star detailing.", tag: "New", image: "/uploads/seed/once-upon-a-time-crew.svg" },
  { name: "Wildflower Crewneck", sku: "CREW-WILD-001", slug: "wildflower-crewneck", price: 45, category: "crewnecks", description: "Delicate wildflower embroidery wrapping around the neckline. Available in multiple colors.", image: "/uploads/seed/wildflower-crewneck.svg" },
  { name: "Custom Iced Coffee Cup", sku: "CUP-ICED-001", slug: "custom-iced-coffee-cup", price: 22, category: "cups", description: "Personalized vinyl glass cup perfect for your daily iced coffee. Add any name or design.", tag: "Popular", image: "/uploads/seed/custom-iced-coffee-cup.svg" },
  { name: "Disney Inspired Glass Cup", sku: "CUP-DISN-001", slug: "disney-glass-cup", price: 24, category: "cups", description: "Glass tumbler with your favorite Disney character silhouette in vinyl.", image: "/uploads/seed/disney-glass-cup.svg" },
  { name: '"Mama" Glass Cup', sku: "CUP-MAMA-001", slug: "mama-glass-cup", price: 22, category: "cups", description: "The perfect gift for mom — personalized glass cup with floral accents.", image: "/uploads/seed/mama-glass-cup.svg" },
  { name: "Fairytale Tote Bag", sku: "TOTE-FAIR-001", slug: "fairytale-tote", price: 30, category: "totes", description: "Sturdy canvas tote with fairytale-themed embroidery. Perfect for books, groceries, or adventures.", tag: "Popular", image: "/uploads/seed/fairytale-tote.svg" },
  { name: "Book Club Tote", sku: "TOTE-BOOK-001", slug: "book-club-tote", price: 28, category: "totes", description: 'Embroidered tote with "Just One More Chapter" and stack of books design.', image: "/uploads/seed/book-club-tote.svg" },
  { name: "Custom Name Tote", sku: "TOTE-NAME-001", slug: "custom-name-tote", price: 32, category: "totes", description: "Personalized tote bag with embroidered name and your choice of design elements.", image: "/uploads/seed/custom-name-tote.svg" },
  { name: "Bookish Decal Set", sku: "VIN-DECAL-001", slug: "laptop-decal-set", price: 12, category: "vinyl", description: "Set of 5 vinyl decals with book-themed designs. Waterproof and durable.", image: "/uploads/seed/laptop-decal-set.svg" },
  { name: "Custom Car Decal", sku: "VIN-CAR-001", slug: "car-decal-custom", price: 15, category: "vinyl", description: "Weather-resistant vinyl decal customized with your text or design.", tag: "New", image: "/uploads/seed/car-decal-custom.svg" },
  { name: "Floral Sticker Pack", sku: "VIN-FLOR-001", slug: "sticker-pack-floral", price: 8, category: "vinyl", description: "Pack of 10 waterproof floral stickers. Perfect for water bottles, laptops, and journals.", image: "/uploads/seed/sticker-pack-floral.svg" },
];

const inquiries = [
  { name: "Sarah Johnson", email: "sarah@example.com", subject: "Custom Order Request", message: "Hi Meg! I'd love a custom crewneck with my dog's name embroidered on it. His name is Biscuit and I'd love it in a sage green color with wildflowers around the name. Size medium please!", status: "new" },
  { name: "Emily Chen", email: "emily.chen@example.com", subject: "Custom Order Request", message: "I'm looking for 6 matching tote bags for my bridesmaids! Each with their name and a floral design. Wedding is May 15th. Is that enough time?", status: "replied", notes: "Quoted $180 for set of 6. Waiting for confirmation." },
  { name: "Mike Torres", email: "mike.t@example.com", subject: "General Inquiry", message: "Do you ship internationally? I'm in Canada and want to order a couple glass cups for my wife.", status: "new" },
];

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.product.deleteMany();

  for (const p of products) {
    const clothingKeywords = ["crewneck", "hoodie", "shirt", "tee", "sweatshirt", "apparel"];
    const isClothing = p.category === "crewnecks" || clothingKeywords.some((k) => p.name.toLowerCase().includes(k));
    await prisma.product.create({ data: { ...p, stock: 10, hasSize: isClothing } });
  }
  console.log(`Seeded ${products.length} products`);

  for (const i of inquiries) {
    await prisma.inquiry.create({ data: i });
  }
  console.log(`Seeded ${inquiries.length} inquiries`);

  const bookLover = await prisma.product.findUnique({ where: { slug: "book-lover-crewneck" } });
  const fairytaleTote = await prisma.product.findUnique({ where: { slug: "fairytale-tote" } });

  if (bookLover && fairytaleTote) {
    await prisma.order.create({
      data: {
        customerName: "Jessica Park",
        customerEmail: "jessica@example.com",
        total: 75,
        status: "shipped",
        items: {
          create: [
            { productId: bookLover.id, quantity: 1, price: 45 },
            { productId: fairytaleTote.id, quantity: 1, price: 30 },
          ],
        },
      },
    });
    console.log("Seeded 1 demo order");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
