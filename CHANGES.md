# Order Notifications + Shipping Export Integration Notes

This change set intentionally avoids editing Prisma schema and checkout route files because another agent is concurrently modifying them.

## ✅ Implemented in this commit

- Added `site/src/lib/notify.ts` with `notifyNewOrder(order)`:
  - Logs new orders to console
  - Sends webhook payload to `NOTIFY_WEBHOOK_URL` when configured
- Added `admin/src/app/api/orders/shipping-export/route.ts`:
  - Exports `pending`/`confirmed` orders as CSV for UPS/FedEx import workflows
  - Columns:
    - Order ID
    - Customer Name
    - Address Line 1
    - Address Line 2
    - City
    - State
    - Zip Code
    - Country
    - Email
    - Phone
    - Weight
    - Items
- Updated `admin/src/app/orders/page.tsx`:
  - Added **Export for Shipping** button
  - Calls `GET /api/orders/shipping-export` and downloads CSV

## 🔧 Still needs wiring after concurrent changes land

1. **Stripe webhook integration**
   - In `site/src/app/api/webhooks/stripe/route.ts` inside `checkout.session.completed` after order confirmation:
   - Import and call `notifyNewOrder(...)` with order details

2. **Prisma Order shipping fields**
   - Ensure `Order` model includes:
     - `shippingName String?`
     - `shippingLine1 String?`
     - `shippingLine2 String?`
     - `shippingCity String?`
     - `shippingState String?`
     - `shippingZip String?`
     - `shippingCountry String?`
     - `shippingPhone String?`
   - Run migration + regenerate client

3. **Populate shipping fields from Stripe session**
   - In webhook `checkout.session.completed`, map `shipping_details` onto the `Order`

4. **Checkout shipping collection**
   - In `site/src/app/api/checkout/route.ts`, add:

   ```ts
   shipping_address_collection: {
     allowed_countries: ["US"],
   }
   ```

   so Stripe collects address data at checkout.
