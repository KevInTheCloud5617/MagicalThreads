import Link from "next/link";
import prisma from "@/lib/db";
import ClearCartOnSuccess from "./ClearCartOnSuccess";

export default async function CheckoutSuccess({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;

  const order = sessionId
    ? await prisma.order.findUnique({
        where: { stripeSessionId: sessionId },
        include: {
          items: {
            include: { product: true },
          },
        },
      })
    : null;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <ClearCartOnSuccess />
      <div className="text-center max-w-2xl w-full bg-white border border-blue-pale rounded-2xl p-8">
        <div className="text-6xl mb-6">✨</div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-navy mb-4">
          Order Confirmed!
        </h1>

        {order ? (
          <div className="text-left space-y-4 mb-8">
            <p className="text-text-muted text-center">
              Thanks for your purchase — your order is {order.status}.
            </p>

            <div className="bg-cream rounded-xl p-4 border border-blue-pale">
              <p className="text-sm text-text-muted">Order ID</p>
              <p className="font-mono text-sm text-navy break-all">{order.id}</p>
              <p className="text-sm text-text-muted mt-2">Total</p>
              <p className="font-semibold text-navy">${order.total.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm border-b border-blue-pale pb-2">
                  <span>
                    {item.product?.name || "Deleted product"}
                    {item.size ? ` (${item.size})` : ""} × {item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-text-muted mb-8">
            Thank you for your order! Your magical creation is being prepared with love.
          </p>
        )}

        <div className="bg-blue-pale/30 border border-blue-pale rounded-xl p-4 mb-8">
          <p className="text-sm text-navy">
            Your order ships within 10–12 business days. Keep an eye on your email for tracking info!
          </p>
        </div>

        <Link
          href="/shop"
          className="bg-navy hover:bg-navy-light text-white font-semibold px-8 py-3 rounded-full transition-colors text-sm uppercase tracking-wider inline-block"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
