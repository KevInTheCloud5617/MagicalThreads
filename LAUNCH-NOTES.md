# Launch Hardening Notes

## Preview Mode (Password Protection)

Storefront routes are gated behind HTTP Basic Auth when enabled. Admin routes are never affected.

**Environment variables** (set in `site/.env`):

| Variable | Default | Description |
|---|---|---|
| `PREVIEW_MODE` | `false` | Set to `true` to enable password protection |
| `PREVIEW_USERNAME` | `preview` | Basic auth username |
| `PREVIEW_PASSWORD` | `preview` | Basic auth password |

Static assets (`_next`, favicons, images) are always accessible.

To enable: set `PREVIEW_MODE=true` and restart the site. To disable for public launch: set `PREVIEW_MODE=false` or remove the variable.

## Stock Management

The `stock` field (integer, default 0) has been added to the Product model.

**Migration required:**
```bash
# Already applied to shared/data/store.db via:
# ALTER TABLE Product ADD COLUMN stock INTEGER NOT NULL DEFAULT 0;

# Regenerate Prisma clients after schema change:
cd site && npx prisma generate
cd admin && npx prisma generate
```

- Admin product form now requires stock quantity on create/edit
- Storefront shows "Out of Stock" for products with stock ≤ 0
- Product detail page shows "Only X left in stock" when stock ≤ 5
- Checkout API rejects orders exceeding available stock

## Cart Quantity Guardrail

Maximum **5 total items** per cart. Enforced in:
- `CartContext` (`addItem` and `updateQuantity`)
- Checkout API (`/api/checkout`)

When limit is reached, a message suggests emailing for bulk orders.

**To configure the bulk order email:** Edit the `BULK_ORDER_MESSAGE` constant in `site/src/context/CartContext.tsx` and the corresponding message in `site/src/app/api/checkout/route.ts`.

## Files Changed

- `site/prisma/schema.prisma` — added `stock` field to Product
- `admin/prisma/schema.prisma` — added `stock` field to Product
- `site/src/middleware.ts` — preview mode basic auth
- `site/src/context/CartContext.tsx` — cart quantity guardrail (max 5)
- `site/src/components/AddToCartButton.tsx` — stock awareness, out-of-stock state
- `site/src/app/(store)/shop/[id]/page.tsx` — uses AddToCartButton with stock
- `site/src/app/(store)/shop/page.tsx` — shows out-of-stock on listings
- `site/src/app/api/checkout/route.ts` — server-side cart limit + stock validation
- `admin/src/app/products/page.tsx` — stock field in form + table
- `admin/src/app/api/products/route.ts` — stock validation on create
- `site/.env.example` — preview mode env vars
- `LAUNCH-NOTES.md` — this file
