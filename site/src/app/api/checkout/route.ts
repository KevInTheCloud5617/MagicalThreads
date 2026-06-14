import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import {
  parseCustomizationOptions,
  serializeCustomization,
  validateCustomizationAgainstOptions,
  type Customization,
} from "@/lib/customization";
import { getPersonalizationPresets, resolveCustomizationOptions } from "@/lib/personalization-presets";

class CheckoutBusinessError extends Error {
  status: number;

  constructor(message: string, status = 409) {
    super(message);
    this.name = "CheckoutBusinessError";
    this.status = status;
  }
}

type CheckoutInputItem = {
  id: string;
  quantity: number;
  size?: string;
  color?: string;
  customization?: Customization;
};

type ValidatedItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string | null;
  color: string | null;
  hasSize: boolean;
  stripePriceId: string | null;
  customization?: Customization;
};

type ReservedItem = ValidatedItem;

type ReservationMetadataItem = {
  productId: string;
  quantity: number;
  size: string;
  color?: string;
};

const FREE_SHIPPING_THRESHOLD_CENTS = 12000;
const STANDARD_SHIPPING_CENTS = 599;
const SHIPPING_RATE_STANDARD = process.env.STRIPE_SHIPPING_RATE_STANDARD;
const SHIPPING_RATE_FREE = process.env.STRIPE_SHIPPING_RATE_FREE;

function getShippingAmountCents(subtotalCents: number) {
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : STANDARD_SHIPPING_CENTS;
}

function getShippingOption(subtotalCents: number) {
  const isFreeShipping = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;

  if (SHIPPING_RATE_STANDARD && SHIPPING_RATE_FREE) {
    return {
      shipping_rate: isFreeShipping ? SHIPPING_RATE_FREE : SHIPPING_RATE_STANDARD,
    };
  }

  return {
    shipping_rate_data: {
      type: "fixed_amount" as const,
      fixed_amount: { amount: isFreeShipping ? 0 : STANDARD_SHIPPING_CENTS, currency: "usd" },
      display_name: isFreeShipping ? "Free Shipping" : "Standard Shipping",
      delivery_estimate: {
        minimum: { unit: "business_day" as const, value: 10 },
        maximum: { unit: "business_day" as const, value: 12 },
      },
    },
  };
}

function resolveStripeMode() {
  const rawMode = (process.env.STRIPE_MODE ?? process.env.NEXT_PUBLIC_STRIPE_MODE ?? "").trim().toLowerCase();
  const key = (process.env.STRIPE_SECRET_KEY ?? "").trim();

  if (rawMode === "mock" || rawMode === "test" || rawMode === "live") {
    return rawMode;
  }

  if (rawMode) return "unsupported" as const;
  if (!key) return "mock" as const;
  return key.startsWith("sk_live_") ? "live" : "test";
}

async function validateItems(items: CheckoutInputItem[]): Promise<ValidatedItem[]> {
  const presets = await getPersonalizationPresets(prisma);
  return prisma.$transaction(async (tx) => {
    const validated: ValidatedItem[] = [];

    for (const item of items) {
      const product = await tx.product.findFirst({
        where: { id: item.id, active: true },
        include: { colors: true },
      });

      if (!product) {
        throw new CheckoutBusinessError("Product unavailable", 409);
      }

      let validatedColor: string | null = null;
      if (product.hasColor) {
        const allowedNames = new Set((product.colors ?? []).map((c) => c.name));
        if (allowedNames.size === 0) {
          throw new CheckoutBusinessError(`Color selection unavailable for ${product.name}`, 400);
        }
        if (!item.color || typeof item.color !== "string") {
          throw new CheckoutBusinessError(`Color is required for ${product.name}`, 400);
        }
        if (!allowedNames.has(item.color)) {
          throw new CheckoutBusinessError(`Invalid color for ${product.name}`, 400);
        }
        validatedColor = item.color;
      }

      let validatedCustomization: Customization | undefined;
      if (item.customization) {
        const opts = resolveCustomizationOptions(parseCustomizationOptions(product.customizationOptions), presets);
        if (!opts || !opts.enabled) {
          throw new CheckoutBusinessError(`Customization not enabled for product ${product.name}`, 400);
        }
        const result = validateCustomizationAgainstOptions(item.customization, opts);
        if (!result.ok) {
          throw new CheckoutBusinessError(result.error, 400);
        }
        validatedCustomization = { ...result.value, upcharge: opts.upcharge };
      }

      if (product.hasSize) {
        if (!item.size || typeof item.size !== "string" || item.size === "ONE_SIZE") {
          throw new CheckoutBusinessError(`Size is required for ${product.name}`, 400);
        }

        const sizeRow = await tx.productSize.findUnique({
          where: { productId_size: { productId: item.id, size: item.size } },
        });

        if (!sizeRow || sizeRow.stock < item.quantity) {
          throw new CheckoutBusinessError(`Insufficient stock for size ${item.size}`, 409);
        }

        validated.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          size: item.size,
          color: validatedColor,
          hasSize: true,
          stripePriceId: product.stripePriceId,
          customization: validatedCustomization,
        });
        continue;
      }

      if (product.stock < item.quantity) {
        throw new CheckoutBusinessError(`Insufficient stock for ${product.name}`, 409);
      }

      validated.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        size: null,
        color: validatedColor,
        hasSize: false,
        stripePriceId: product.stripePriceId,
        customization: validatedCustomization,
      });
    }

    return validated;
  });
}

async function reserveItemsForMock(items: CheckoutInputItem[], validatedItems: ValidatedItem[]): Promise<ReservedItem[]> {
  // Index validated items by id + size + color so we can carry forward the
  // resolved color/customization without re-validating inside the reservation tx.
  const validatedKey = (id: string, size: string | null | undefined, color: string | null | undefined) =>
    `${id}|${size ?? ""}|${color ?? ""}`;
  const validatedById = new Map<string, ValidatedItem>();
  for (const v of validatedItems) {
    validatedById.set(validatedKey(v.id, v.size, v.color), v);
  }
  return prisma.$transaction(async (tx) => {
    const reserved: ReservedItem[] = [];

    for (const item of items) {
      const product = await tx.product.findFirst({
        where: { id: item.id, active: true },
      });

      if (!product) {
        throw new CheckoutBusinessError("Product unavailable", 409);
      }

      const validated = validatedById.get(validatedKey(item.id, item.size ?? null, item.color ?? null));
      const customization = validated?.customization;
      const color = validated?.color ?? (item.color ?? null);

      if (product.hasSize) {
        if (!item.size || typeof item.size !== "string" || item.size === "ONE_SIZE") {
          throw new CheckoutBusinessError(`Size is required for ${product.name}`, 400);
        }

        const updated = await tx.productSize.updateMany({
          where: {
            productId: item.id,
            size: item.size,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (updated.count !== 1) {
          throw new CheckoutBusinessError(`Insufficient stock for size ${item.size}`, 409);
        }

        reserved.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          size: item.size,
          color,
          hasSize: true,
          stripePriceId: product.stripePriceId,
          customization,
        });
        continue;
      }

      const updated = await tx.product.updateMany({
        where: { id: item.id, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });

      if (updated.count !== 1) {
        throw new CheckoutBusinessError(`Insufficient stock for ${product.name}`, 409);
      }

      reserved.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        size: null,
        color,
        hasSize: false,
        stripePriceId: product.stripePriceId,
        customization,
      });
    }

    return reserved;
  });
}

async function reserveItemsForStripe(items: ValidatedItem[]): Promise<ReservedItem[]> {
  return prisma.$transaction(async (tx) => {
    const reserved: ReservedItem[] = [];

    for (const item of items) {
      if (item.hasSize && item.size) {
        const updated = await tx.productSize.updateMany({
          where: {
            productId: item.id,
            size: item.size,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (updated.count !== 1) {
          throw new CheckoutBusinessError(`Insufficient stock for size ${item.size}`, 409);
        }

        reserved.push(item);
        continue;
      }

      const updated = await tx.product.updateMany({
        where: { id: item.id, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });

      if (updated.count !== 1) {
        throw new CheckoutBusinessError(`Insufficient stock for ${item.name}`, 409);
      }

      reserved.push(item);
    }

    return reserved;
  });
}

async function releaseReservedItems(items: ReservedItem[]) {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      if (item.hasSize && item.size) {
        await tx.productSize.updateMany({
          where: {
            productId: item.id,
            size: item.size,
          },
          data: { stock: { increment: item.quantity } },
        });
      } else {
        await tx.product.updateMany({
          where: { id: item.id },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();
    const stripeMode = resolveStripeMode();

    if (!items?.length || !Array.isArray(items)) {
      return NextResponse.json({ error: "No items", code: "NO_ITEMS" }, { status: 400 });
    }

    const parsedItems = items as CheckoutInputItem[];

    const totalQty = parsedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    if (totalQty > 5) {
      return NextResponse.json(
        {
          error: "Maximum 5 items per order. For bulk orders, please email meg@magicalthreadswithmeg.com",
          code: "MAX_ITEMS_EXCEEDED",
        },
        { status: 400 }
      );
    }

    for (const item of parsedItems) {
      if (!item.id || typeof item.id !== "string") {
        return NextResponse.json({ error: "Invalid item id", code: "INVALID_ITEM_ID" }, { status: 400 });
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        return NextResponse.json({ error: "Invalid quantity (must be 1-100)", code: "INVALID_QUANTITY" }, { status: 400 });
      }
    }

    // Always validate stock first so users get deterministic inventory errors.
    const validatedItems = await validateItems(parsedItems);

    if (stripeMode === "unsupported") {
      return NextResponse.json({ error: "Unsupported STRIPE_MODE. Use mock, test, or live.", code: "INVALID_STRIPE_MODE" }, { status: 400 });
    }

    if (stripeMode === "mock") {
      const reservation = await reserveItemsForMock(parsedItems, validatedItems);
      const subtotal = reservation.reduce((sum, item) => sum + (item.price + (item.customization?.upcharge ?? 0)) * item.quantity, 0);
      const subtotalCents = Math.round(subtotal * 100);
      const shippingCents = getShippingAmountCents(subtotalCents);
      const total = subtotal + shippingCents / 100;

      const order = await prisma.order.create({
        data: {
          id: randomUUID(),
          stripeSessionId: `mock_${randomUUID()}`,
          customerName: "Mock Customer",
          customerEmail: "mock@magicalthreads.local",
          total,
          status: "confirmed",
          notes: "Mock checkout",
          items: {
            create: reservation.map((item) => ({
              id: randomUUID(),
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
              size: item.size,
              color: item.color,
              customization: serializeCustomization(item.customization ?? null),
            })),
          },
        },
      });

      return NextResponse.json({
        success: true,
        mock: true,
        orderId: order.id,
        shipping: shippingCents === 0 ? "Free Shipping" : "$5.99 Standard Shipping",
        message: "Mock checkout completed",
      });
    }

    const secretKey = (process.env.STRIPE_SECRET_KEY ?? "").trim();
    if (!secretKey) {
      return NextResponse.json({ error: "Stripe is not configured on the server", code: "STRIPE_NOT_CONFIGURED" }, { status: 500 });
    }
    if (stripeMode === "live" && !secretKey.startsWith("sk_live_")) {
      return NextResponse.json({ error: "STRIPE_MODE is live but STRIPE_SECRET_KEY is not a live key", code: "STRIPE_KEY_MODE_MISMATCH" }, { status: 500 });
    }

    const reservedItems = await reserveItemsForStripe(validatedItems);

    const subtotal = reservedItems.reduce((sum, item) => sum + (item.price + (item.customization?.upcharge ?? 0)) * item.quantity, 0);
    const subtotalCents = Math.round(subtotal * 100);
    const shippingCents = getShippingAmountCents(subtotalCents);
    const total = subtotal + shippingCents / 100;
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const metadataItems: ReservationMetadataItem[] = reservedItems.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
      size: item.size || "ONE_SIZE",
      ...(item.color ? { color: item.color } : {}),
    }));

    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: reservedItems.map((item) => {
          const upcharge = item.customization?.upcharge ?? 0;
          const colorDescription = item.color ? `Color: ${item.color}` : undefined;
          const personalizationDescription = item.customization
            ? `Personalization: ${[
                item.customization.text ? `"${item.customization.text}"` : null,
                item.customization.color?.name,
                item.customization.font,
                item.customization.placement,
              ].filter(Boolean).join(" · ")}`
            : undefined;
          const description = [colorDescription, personalizationDescription].filter(Boolean).join(" · ") || undefined;
          if (item.stripePriceId && upcharge === 0 && !description) {
            return {
              price: item.stripePriceId,
              quantity: item.quantity,
            };
          }

          return {
            price_data: {
              currency: "usd",
              product_data: {
                name: item.name,
                ...(description ? { description } : {}),
                metadata: {
                  productId: item.id,
                  size: item.size || "ONE_SIZE",
                  ...(item.color ? { color: item.color } : {}),
                  ...(item.customization ? {
                    personalizationText: item.customization.text ?? "",
                    personalizationColor: item.customization.color?.name ?? "",
                    personalizationColorHex: item.customization.color?.hex ?? "",
                    personalizationFont: item.customization.font ?? "",
                    personalizationPlacement: item.customization.placement ?? "",
                  } : {}),
                },
              },
              unit_amount: Math.round((item.price + upcharge) * 100),
            },
            quantity: item.quantity,
          };
        }),
        shipping_address_collection: {
          allowed_countries: ["US"],
        },
        shipping_options: [getShippingOption(subtotalCents)],
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/shop`,
        expires_at: Math.floor(Date.now() / 1000) + 1800,
        metadata: {
          items: JSON.stringify(metadataItems),
        },
      });

      await prisma.order.create({
        data: {
          id: randomUUID(),
          stripeSessionId: session.id,
          customerName: "Stripe Checkout Customer",
          customerEmail: "pending@magicalthreads.local",
          total,
          status: "pending",
          notes: "Awaiting Stripe payment",
          items: {
            create: reservedItems.map((item) => ({
              id: randomUUID(),
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
              size: item.size,
              color: item.color,
              customization: serializeCustomization(item.customization ?? null),
            })),
          },
        },
      });

      return NextResponse.json({ url: session.url, sessionId: session.id });
    } catch (error) {
      await releaseReservedItems(reservedItems);
      throw error;
    }
  } catch (err: unknown) {
    if (err instanceof CheckoutBusinessError) {
      return NextResponse.json({ error: err.message, code: "CHECKOUT_VALIDATION_FAILED" }, { status: err.status });
    }

    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message, code: "CHECKOUT_FAILED" }, { status: 500 });
  }
}
