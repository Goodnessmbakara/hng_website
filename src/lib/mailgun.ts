import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { Order } from './types';

// Check if Mailgun is configured
export const isMailgunConfigured = (): boolean => {
  return Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);
};

/**
 * Generates responsive HTML email content for order confirmation
 */
export function generateOrderEmailHtml(order: Order): string {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: middle;">
          <div style="font-weight: 600; color: #111827; font-size: 14px;">${item.productName}</div>
          <div style="font-size: 12px; color: #6b7280;">Qty: ${item.quantity} × $${item.unitPrice.toFixed(2)}</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #111827; vertical-align: middle;">
          $${item.totalPrice.toFixed(2)}
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation #${order.orderNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">⚡ TechHaven</h1>
      <p style="margin: 8px 0 0; font-size: 14px; color: #94a3b8;">Premium Tech & Modern Gadgets</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px 24px;">
      <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 6px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 16px;">
        ✓ Order Confirmed
      </div>

      <h2 style="margin: 0 0 8px; color: #111827; font-size: 20px; font-weight: 700;">Thank you for your order, ${order.customerName}!</h2>
      <p style="margin: 0 0 24px; color: #4b5563; font-size: 14px; line-height: 1.5;">
        We've received your order <strong>#${order.orderNumber}</strong> and our fulfillment center is preparing it for shipment.
      </p>

      <!-- Order Details Grid -->
      <table style="width: 100%; margin-bottom: 24px; background: #f9fafb; border-radius: 8px; padding: 16px; border-collapse: separate; border-spacing: 0;">
        <tr>
          <td style="padding: 8px 12px; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Order Number</td>
          <td style="padding: 8px 12px; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Order Date</td>
        </tr>
        <tr>
          <td style="padding: 0 12px 8px; font-size: 15px; font-weight: 700; color: #111827;">#${order.orderNumber}</td>
          <td style="padding: 0 12px 8px; font-size: 15px; font-weight: 600; color: #111827;">${new Date(order.createdAt).toLocaleDateString()}</td>
        </tr>
      </table>

      <!-- Items List -->
      <h3 style="margin: 0 0 12px; font-size: 16px; color: #111827; font-weight: 700; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px;">Order Summary</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        ${itemsHtml}
      </table>

      <!-- Price Breakdown -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #6b7280;">Subtotal</td>
            <td style="padding: 4px 0; text-align: right; color: #111827; font-weight: 500;">$${order.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6b7280;">Shipping</td>
            <td style="padding: 4px 0; text-align: right; color: #10b981; font-weight: 600;">${order.shippingFee === 0 ? 'FREE' : `$${order.shippingFee.toFixed(2)}`}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6b7280;">Tax</td>
            <td style="padding: 4px 0; text-align: right; color: #111827; font-weight: 500;">$${order.tax.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0 0; color: #111827; font-weight: 700; font-size: 16px; border-top: 1px solid #e5e7eb;">Total Paid</td>
            <td style="padding: 12px 0 0; text-align: right; color: #2563eb; font-weight: 800; font-size: 18px; border-top: 1px solid #e5e7eb;">$${order.total.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Shipping Address -->
      <h3 style="margin: 0 0 8px; font-size: 15px; color: #111827; font-weight: 700;">Shipping Address</h3>
      <p style="margin: 0 0 24px; color: #4b5563; font-size: 14px; line-height: 1.6; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px;">
        <strong>${order.shippingAddress.fullName}</strong><br>
        ${order.shippingAddress.address}<br>
        ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br>
        ${order.shippingAddress.country}
      </p>

      <!-- Customer Support Footer -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
        <p style="margin: 0 0 8px;">Questions about your order? Reply directly to this email or reach us at <a href="mailto:support@techhaven.store" style="color: #2563eb; text-decoration: none;">support@techhaven.store</a>.</p>
        <p style="margin: 0;">© ${new Date().getFullYear()} TechHaven Inc. All rights reserved.</p>
      </div>

    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Sends order confirmation email via Mailgun API
 */
export async function sendOrderConfirmationEmail(order: Order): Promise<{
  success: boolean;
  status: 'sent' | 'simulated' | 'failed';
  messageId?: string;
  error?: string;
}> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const host = process.env.MAILGUN_HOST || 'api.mailgun.net';
  const fromEmail = process.env.MAILGUN_FROM_EMAIL || `TechHaven Orders <orders@${domain || 'techhaven.store'}>`;

  // If Mailgun credentials are not yet configured in .env, simulate and log gracefully
  if (!apiKey || !domain) {
    console.log('───────────────────────────────────────────────────');
    console.log('✉️ [Mailgun Service] Mailgun credentials not detected in .env.local.');
    console.log(`✉️ [Mailgun Service] Simulated confirmation email dispatched to: ${order.customerEmail}`);
    console.log(`✉️ Order Number: #${order.orderNumber} | Total: $${order.total.toFixed(2)}`);
    console.log('───────────────────────────────────────────────────');
    return {
      success: true,
      status: 'simulated',
      messageId: `simulated-${Date.now()}`,
    };
  }

  try {
    const mailgun = new Mailgun(FormData);
    const client = mailgun.client({
      username: 'api',
      key: apiKey,
      url: host.startsWith('http') ? host : `https://${host}`,
    });

    const emailHtml = generateOrderEmailHtml(order);

    const messageData = {
      from: fromEmail,
      to: [order.customerEmail],
      subject: `Order Confirmation #${order.orderNumber} - TechHaven`,
      text: `Thank you for your order #${order.orderNumber}! Your total is $${order.total.toFixed(2)}. Shipping to ${order.shippingAddress.fullName}, ${order.shippingAddress.city}.`,
      html: emailHtml,
    };

    const response = await client.messages.create(domain, messageData);
    console.log('✅ [Mailgun Service] Email sent successfully:', response.id);

    return {
      success: true,
      status: 'sent',
      messageId: response.id,
    };
  } catch (error: any) {
    const isForbidden = error?.status === 403 || error?.message?.includes('Forbidden') || String(error).includes('Forbidden');
    console.error('❌ [Mailgun Service] Error sending email via Mailgun:', error?.message || error);
    if (isForbidden && domain.startsWith('sandbox')) {
      console.warn('⚠️ [Mailgun Sandbox Notice]: Mailgun sandbox domains can only deliver to "Authorized Recipients".');
      console.warn(`⚠️ Please add "${order.customerEmail}" to Mailgun Dashboard -> Sending -> Domains -> ${domain} -> Authorized Recipients.`);
    }

    return {
      success: false,
      status: 'failed',
      error: isForbidden && domain.startsWith('sandbox')
        ? 'Mailgun Sandbox domain requires adding this recipient email to Authorized Recipients in the Mailgun console.'
        : error?.message || 'Mailgun sending failed',
    };
  }
}
