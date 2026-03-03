import Link from "next/link";

export default function CheckoutCancel() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🛍️</div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-navy mb-4">
          Order Cancelled
        </h1>
        <p className="text-text-muted mb-8">
          No worries! Your cart items are still waiting for you. Come back whenever you&apos;re ready.
        </p>
        <Link href="/shop" className="bg-navy hover:bg-navy-light text-white font-semibold px-8 py-3 rounded-full transition-colors text-sm uppercase tracking-wider inline-block">
          Back to Shop
        </Link>
      </div>
    </div>
  );
}
