"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [stripeKey, setStripeKey] = useState("");
  const [stripeSecret, setStripeSecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // TODO: Save to .env.local or shared config
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Settings</h1>
        <p className="text-text-muted text-sm mt-1">Configure your store integrations</p>
      </div>

      {/* Stripe Settings */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💳</span>
            <div>
              <h2 className="font-bold text-navy">Stripe Integration</h2>
              <p className="text-xs text-text-muted mt-0.5">Connect your Stripe account to accept payments</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Setup Guide */}
          <div className="bg-blue-pale/30 rounded-lg p-4 border border-blue-pale">
            <h3 className="text-sm font-semibold text-navy mb-2">📋 Setup Steps</h3>
            <ol className="space-y-1.5 text-sm text-text-muted">
              <li>1. <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Create a Stripe account</a> (if you don&apos;t have one)</li>
              <li>2. Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Developers → API Keys</a></li>
              <li>3. Copy your <strong>Publishable key</strong> and <strong>Secret key</strong></li>
              <li>4. Set up a <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Webhook endpoint</a> pointing to your site</li>
              <li>5. Paste the keys below and save</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Publishable Key
            </label>
            <input
              type="text"
              value={stripeKey}
              onChange={(e) => setStripeKey(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 font-mono"
              placeholder="pk_live_..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Secret Key
            </label>
            <input
              type="password"
              value={stripeSecret}
              onChange={(e) => setStripeSecret(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 font-mono"
              placeholder="sk_live_..."
            />
            <p className="text-xs text-text-muted mt-1">⚠️ Never share your secret key publicly</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Webhook Signing Secret
            </label>
            <input
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 font-mono"
              placeholder="whsec_..."
            />
            <p className="text-xs text-text-muted mt-1">
              Webhook URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/webhooks/stripe`}</code>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="bg-navy hover:bg-navy-light text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              Save Settings
            </button>
            {saved && (
              <span className="text-sm text-green font-medium">✓ Settings saved!</span>
            )}
          </div>
        </div>
      </div>

      {/* Store Settings */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏪</span>
            <div>
              <h2 className="font-bold text-navy">Store Information</h2>
              <p className="text-xs text-text-muted mt-0.5">Your business details</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Store Name</label>
              <input
                type="text"
                defaultValue="Magical Threads with Meg"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Contact Email</label>
              <input
                type="email"
                placeholder={process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@example.com"}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Social Links</label>
            <div className="space-y-2">
              <input
                type="url"
                placeholder="Instagram URL"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
              />
              <input
                type="url"
                placeholder="Facebook URL"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
              />
              <input
                type="url"
                placeholder="TikTok URL"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shipping */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <h2 className="font-bold text-navy">Shipping Settings</h2>
              <p className="text-xs text-text-muted mt-0.5">Default shipping options</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Standard Shipping ($)</label>
              <input
                type="number"
                step="0.01"
                defaultValue="5.99"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Free Shipping Over ($)</label>
              <input
                type="number"
                step="0.01"
                defaultValue="50.00"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Processing Time</label>
            <input
              type="text"
              defaultValue="5-7 business days"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
