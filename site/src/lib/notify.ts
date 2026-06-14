export async function notifyNewOrder(order: {
  id: string;
  customerEmail: string;
  total: number;
  items: Array<{ name: string; quantity: number; size?: string; color?: string; price: number }>;
  shippingName?: string;
  shippingAddress?: string;
}) {
  // Log to console for now
  console.log(`🛒 NEW ORDER: ${order.id} — $${order.total.toFixed(2)} from ${order.customerEmail}`);

  // If NOTIFY_WEBHOOK_URL is set, POST the order data there
  const webhookUrl = process.env.NOTIFY_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "new_order",
          order,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.error("Failed to send order notification:", e);
    }
  }
}
