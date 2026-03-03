import Link from "next/link";

export default function CheckoutSuccess() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">✨</div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-navy mb-4">
          Order Confirmed!
        </h1>
        <p className="text-text-muted mb-8">
          Thank you for your order! Your magical creation is being prepared with love. You&apos;ll receive an email confirmation shortly.
        </p>
        <Link href="/shop" className="bg-navy hover:bg-navy-light text-white font-semibold px-8 py-3 rounded-full transition-colors text-sm uppercase tracking-wider inline-block">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
