import { Resend } from 'resend';
import { Order } from './types';

// ============================================================================
// Master Designer Sleek Email Templates for TechHaven
// ============================================================================

export const getSiteUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
};

export const getSupportEmail = (): string => {
  if (process.env.SUPPORT_EMAIL) return process.env.SUPPORT_EMAIL;
  if (process.env.NEXT_PUBLIC_SUPPORT_EMAIL) return process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL || '';
  const match = fromEmail.match(/@([a-zA-Z0-9.-]+)/);
  if (match) {
    return `support@${match[1]}`;
  }
  return 'support@techhaven.store';
};

const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || 'TechHaven';
const BRAND_TAGLINE = 'Premium Technology & Engineering Store';

/**
 * Common base wrapper for all sleek email templates
 */
function emailLayout({
  title,
  preheader,
  contentHtml,
}: {
  title: string;
  preheader: string;
  contentHtml: string;
}): string {
  const supportEmail = getSupportEmail();

  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        margin: auto !important;
      }
      .stack-column {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        direction: ltr !important;
      }
      .mobile-p-4 {
        padding: 24px 20px !important;
      }
      .mobile-code {
        letter-spacing: 6px !important;
        font-size: 26px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'; color: #0f172a;">
  
  <!-- Hidden Preheader Preview Text -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
    ${preheader} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0b0f19; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Main Card Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45); border: 1px solid rgba(255, 255, 255, 0.08);">
          
          <!-- Sleek Ambient Top Accent Bar -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #2563eb 0%, #7c3aed 50%, #06b6d4 100%);"></td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td style="background-color: #0f172a; padding: 36px 32px 30px; text-align: center; border-bottom: 1px solid #1e293b;">
              <!-- Brand Glow Badge -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 12px;">
                <tr>
                  <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); border: 1px solid #3b82f6; border-radius: 12px; padding: 8px 16px; text-align: center;">
                    <span style="color: #ffffff; font-size: 18px; font-weight: 800; letter-spacing: -0.3px; text-decoration: none;">
                      ⚡ ${BRAND_NAME}
                    </span>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; color: #94a3b8; font-size: 13px; font-weight: 500; letter-spacing: 0.2px;">
                ${BRAND_TAGLINE}
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td class="mobile-p-4" style="padding: 36px 32px; background-color: #ffffff;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="background-color: #f8fafc; padding: 28px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 10px; color: #64748b; font-size: 12px; line-height: 1.6;">
                This email was sent from an automated system. If you have questions or need assistance, contact our 24/7 support desk at 
                <a href="mailto:${supportEmail}" style="color: #2563eb; text-decoration: underline; font-weight: 600;">${supportEmail}</a>.
              </p>
              <p style="margin: 0 0 12px; color: #94a3b8; font-size: 11px;">
                © ${new Date().getFullYear()} ${BRAND_NAME} Inc. 100 Innovation Way, Silicon Valley, CA. All rights reserved.
              </p>
              <div style="font-size: 11px; color: #cbd5e1;">
                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: #10b981; margin-right: 4px; vertical-align: middle;"></span>
                Enterprise Encrypted & Verified Delivery
              </div>
            </td>
          </tr>

        </table>
        <!-- End Main Card -->

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

/**
 * 1. Sleek Email Confirmation / Verification Template
 */
export function generateVerificationEmailHtml({
  name,
  email,
  verifyUrl,
  code,
}: {
  name?: string;
  email: string;
  verifyUrl: string;
  code: string;
}): string {
  const firstName = name ? name.split(' ')[0] : 'there';

  const content = `
    <!-- Status Pill -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 9999px; padding: 4px 14px;">
          <span style="color: #1d4ed8; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
            ✦ Email Verification
          </span>
        </td>
      </tr>
    </table>

    <!-- Heading -->
    <h1 style="margin: 0 0 12px; color: #0f172a; font-size: 26px; font-weight: 800; line-height: 1.3; letter-spacing: -0.5px;">
      Verify your email address
    </h1>

    <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
      Hi <strong>${firstName}</strong>, thanks for joining <strong>${BRAND_NAME}</strong>! To complete your account registration and secure your cart sync across devices, please verify your email address.
    </p>

    <!-- One-Click Primary Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 30px;">
      <tr>
        <td align="center">
          <a href="${verifyUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 12px; box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4); text-align: center; border: 1px solid #1e40af;">
            Confirm & Verify Email →
          </a>
        </td>
      </tr>
    </table>

    <!-- Or Enter 6-Digit Code Box -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 28px; padding: 20px; text-align: center;">
      <tr>
        <td align="center">
          <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
            Or enter this 6-digit confirmation code:
          </p>
          <div class="mobile-code" style="font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a; padding: 8px 12px; background-color: #ffffff; border: 1px dashed #cbd5e1; border-radius: 10px; display: inline-block;">
            ${code}
          </div>
          <p style="margin: 8px 0 0; color: #94a3b8; font-size: 11px;">
            This security code and verification link will expire in <strong>24 hours</strong>.
          </p>
        </td>
      </tr>
    </table>

    <!-- Direct link fallback -->
    <div style="background-color: #ffffff; border-top: 1px solid #f1f5f9; padding-top: 18px; margin-bottom: 12px;">
      <p style="margin: 0 0 6px; color: #64748b; font-size: 12px;">
        Button not working? Copy and paste this URL directly into your browser:
      </p>
      <p style="margin: 0; font-family: monospace; font-size: 11px; word-break: break-all; color: #2563eb; background-color: #f1f5f9; padding: 8px 12px; border-radius: 6px;">
        ${verifyUrl}
      </p>
    </div>

    <!-- Security Footnote -->
    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; padding: 12px 16px; margin-top: 20px;">
      <p style="margin: 0; color: #92400e; font-size: 12px; line-height: 1.5;">
        🔒 <strong>Security Note:</strong> If you did not create a ${BRAND_NAME} account using <em>${email}</em>, please disregard this email. Your email remains safe and unverified.
      </p>
    </div>
  `;

  return emailLayout({
    title: `Verify your ${BRAND_NAME} account`,
    preheader: `Your verification code is ${code}. Click to verify your email address.`,
    contentHtml: content,
  });
}

/**
 * 2. Sleek Password Reset Template
 */
export function generatePasswordResetEmailHtml({
  name,
  email,
  resetUrl,
  expiresInMinutes = 60,
}: {
  name?: string;
  email: string;
  resetUrl: string;
  expiresInMinutes?: number;
}): string {
  const firstName = name ? name.split(' ')[0] : 'there';

  const content = `
    <!-- Status Pill -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 9999px; padding: 4px 14px;">
          <span style="color: #b91c1c; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
            🔒 Security Action Required
          </span>
        </td>
      </tr>
    </table>

    <!-- Heading -->
    <h1 style="margin: 0 0 12px; color: #0f172a; font-size: 26px; font-weight: 800; line-height: 1.3; letter-spacing: -0.5px;">
      Reset your password
    </h1>

    <p style="margin: 0 0 20px; color: #475569; font-size: 15px; line-height: 1.6;">
      Hi <strong>${firstName}</strong>, we received a request to reset the password associated with your account (<em>${email}</em>).
    </p>

    <!-- Call to action button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 28px 0;">
      <tr>
        <td align="center">
          <a href="${resetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 12px; box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.4); text-align: center; border: 1px solid #334155;">
            Reset TechHaven Password →
          </a>
        </td>
      </tr>
    </table>

    <!-- Notice Box -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 24px; padding: 18px;">
      <tr>
        <td>
          <p style="margin: 0 0 8px; color: #334155; font-size: 13px; font-weight: 700;">
            ⏳ Expiration & Security Safeguards
          </p>
          <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 12px; line-height: 1.6;">
            <li>This single-use reset link expires in <strong>${expiresInMinutes} minutes</strong>.</li>
            <li>Your existing password remains completely unchanged until you establish a new one.</li>
            <li>If you remember your password or didn't request this change, you can safely ignore this email.</li>
          </ul>
        </td>
      </tr>
    </table>

    <!-- Direct URL fallback -->
    <div style="background-color: #ffffff; border-top: 1px solid #f1f5f9; padding-top: 18px;">
      <p style="margin: 0 0 6px; color: #64748b; font-size: 12px;">
        Button having trouble? Copy and paste this secure link directly:
      </p>
      <p style="margin: 0; font-family: monospace; font-size: 11px; word-break: break-all; color: #2563eb; background-color: #f1f5f9; padding: 8px 12px; border-radius: 6px;">
        ${resetUrl}
      </p>
    </div>
  `;

  return emailLayout({
    title: `Password Reset Request - ${BRAND_NAME}`,
    preheader: `Click to reset your ${BRAND_NAME} password. Link expires in ${expiresInMinutes} minutes.`,
    contentHtml: content,
  });
}

/**
 * 3. Sleek Welcome & Onboarding Template
 */
export function generateWelcomeEmailHtml({
  name,
  email,
  shopUrl,
}: {
  name?: string;
  email: string;
  shopUrl: string;
}): string {
  const firstName = name ? name.split(' ')[0] : 'there';

  const content = `
    <!-- Status Pill -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 9999px; padding: 4px 14px;">
          <span style="color: #15803d; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
            ✓ Welcome to the Community
          </span>
        </td>
      </tr>
    </table>

    <!-- Heading -->
    <h1 style="margin: 0 0 12px; color: #0f172a; font-size: 26px; font-weight: 800; line-height: 1.3; letter-spacing: -0.5px;">
      Welcome to ${BRAND_NAME}, ${firstName}!
    </h1>

    <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
      Your account is now fully active with <em>${email}</em>. You now have full access to our curated catalog of elite electronics, real-time cross-device cart synchronization, and expedited checkout.
    </p>

    <!-- Value Props 3-Column / Grid -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 28px;">
      <tr>
        <td style="padding: 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 10px;">
          <div style="font-weight: 700; color: #0f172a; font-size: 14px; margin-bottom: 4px;">
            ⚡ Real-Time Cart Sync
          </div>
          <div style="color: #64748b; font-size: 12px; line-height: 1.5;">
            Add products on your desktop or mobile app, and watch your cart synchronize instantly.
          </div>
        </td>
      </tr>
      <tr><td style="height: 10px;"></td></tr>
      <tr>
        <td style="padding: 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="font-weight: 700; color: #0f172a; font-size: 14px; margin-bottom: 4px;">
            🚚 Premium Express Delivery
          </div>
          <div style="color: #64748b; font-size: 12px; line-height: 1.5;">
            Fast, insured dispatch on high-end hardware with live parcel tracking.
          </div>
        </td>
      </tr>
    </table>

    <!-- Call to action -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
      <tr>
        <td align="center">
          <a href="${shopUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 12px; box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4); text-align: center; border: 1px solid #1e40af;">
            Explore Premium Catalog →
          </a>
        </td>
      </tr>
    </table>
  `;

  return emailLayout({
    title: `Welcome to ${BRAND_NAME}`,
    preheader: `Welcome to ${BRAND_NAME}! Your account is now active with seamless real-time cart sync.`,
    contentHtml: content,
  });
}

/**
 * 4. Master-Designer Order Confirmation Template
 */
export function generateOrderEmailHtml(order: Order): string {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 14px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle;">
          <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${item.productName}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Qty: ${item.quantity} × $${item.unitPrice.toFixed(2)}</div>
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; color: #0f172a; vertical-align: middle; font-size: 14px;">
          $${item.totalPrice.toFixed(2)}
        </td>
      </tr>
    `
    )
    .join('');

  const content = `
    <!-- Status Pill -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 9999px; padding: 4px 14px;">
          <span style="color: #065f46; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
            ✓ Order Confirmed & Paid
          </span>
        </td>
      </tr>
    </table>

    <h1 style="margin: 0 0 10px; color: #0f172a; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
      Thank you for your order, ${order.customerName}!
    </h1>
    <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
      We have received your payment for order <strong>#${order.orderNumber}</strong>. Our fulfillment hub is preparing your hardware for priority dispatch.
    </p>

    <!-- Order Metadata Pill Card -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 24px; padding: 16px;">
      <tr>
        <td style="padding: 6px 12px; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Order Number</td>
        <td style="padding: 6px 12px; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Placed On</td>
      </tr>
      <tr>
        <td style="padding: 0 12px 6px; font-size: 15px; font-weight: 800; color: #0f172a; font-family: monospace;">#${order.orderNumber}</td>
        <td style="padding: 0 12px 6px; font-size: 14px; font-weight: 600; color: #0f172a;">${new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
      </tr>
    </table>

    <!-- Line Items -->
    <h3 style="margin: 0 0 12px; font-size: 16px; color: #0f172a; font-weight: 800; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">
      Itemized Receipt
    </h3>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse: collapse; margin-bottom: 20px;">
      ${itemsHtml}
    </table>

    <!-- Financial Breakdown -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size: 14px;">
        <tr>
          <td style="padding: 5px 0; color: #64748b;">Subtotal</td>
          <td style="padding: 5px 0; text-align: right; color: #0f172a; font-weight: 600;">$${order.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #64748b;">Shipping (Insured Express)</td>
          <td style="padding: 5px 0; text-align: right; color: #16a34a; font-weight: 700;">${order.shippingFee === 0 ? 'FREE' : `$${order.shippingFee.toFixed(2)}`}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #64748b;">Estimated Tax</td>
          <td style="padding: 5px 0; text-align: right; color: #0f172a; font-weight: 600;">$${order.tax.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0 0; color: #0f172a; font-weight: 800; font-size: 16px; border-top: 1px solid #e2e8f0;">Total Amount Paid</td>
          <td style="padding: 12px 0 0; text-align: right; color: #2563eb; font-weight: 800; font-size: 18px; border-top: 1px solid #e2e8f0;">$${order.total.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <!-- Shipping Destination -->
    <h3 style="margin: 0 0 10px; font-size: 15px; color: #0f172a; font-weight: 700;">
      Destination Address
    </h3>
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px; color: #475569; font-size: 14px; line-height: 1.6;">
      <strong style="color: #0f172a;">${order.shippingAddress.fullName}</strong><br>
      ${order.shippingAddress.address}<br>
      ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br>
      ${order.shippingAddress.country}
    </div>
  `;

  return emailLayout({
    title: `Order Confirmation #${order.orderNumber} - ${BRAND_NAME}`,
    preheader: `We've received your order #${order.orderNumber}. Total: $${order.total.toFixed(2)}.`,
    contentHtml: content,
  });
}

// ============================================================================
// Unified High-Reliability Email Dispatch Engine (Resend + Simulation)
// ============================================================================

export interface SendEmailResult {
  success: boolean;
  status: 'sent' | 'simulated' | 'failed';
  messageId?: string;
  error?: string;
  previewUrl?: string;
}

/**
 * Universal email dispatcher powered by Resend with development simulation fallback
 */
export async function sendUniversalEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendEmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM_EMAIL || 'TechHaven <orders@estatesync.com.ng>';

  // 1. Dispatch via Resend if configured
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: resendFrom,
        to: [to],
        subject,
        html,
        text,
      });

      if (!error && data?.id) {
        console.log(`✅ [Email Service: Resend] Dispatched to ${to} (ID: ${data.id})`);
        return { success: true, status: 'sent', messageId: data.id };
      }

      console.error('❌ [Email Service: Resend] Error dispatching email:', error?.message || error);
      return {
        success: false,
        status: 'failed',
        error: error?.message || 'Resend email delivery failed',
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('❌ [Email Service: Resend] Exception calling Resend:', errorMessage);
      return {
        success: false,
        status: 'failed',
        error: errorMessage || 'Resend exception occurred',
      };
    }
  }

  // 2. Graceful Simulation Fallback for development/preview
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('✉️  [Email Service] Simulated Email Delivery (Local / Sandbox Fallback)');
  console.log(`✉️  To: ${to}`);
  console.log(`✉️  Subject: ${subject}`);
  console.log(`✉️  Text: ${text.substring(0, 180)}...`);
  console.log('─────────────────────────────────────────────────────────────────');

  return {
    success: true,
    status: 'simulated',
    messageId: `sim_${Date.now()}`,
  };
}

/**
 * Dispatch verification email
 */
export async function sendVerificationEmail({
  email,
  name,
  token,
  code,
}: {
  email: string;
  name?: string;
  token: string;
  code: string;
}): Promise<SendEmailResult> {
  const siteUrl = getSiteUrl();
  const verifyUrl = `${siteUrl}/auth/verify-email?token=${encodeURIComponent(token)}&code=${encodeURIComponent(code)}`;

  const html = generateVerificationEmailHtml({ name, email, verifyUrl, code });
  const text = `Hi ${name || 'there'}, your ${BRAND_NAME} verification code is: ${code}. Or verify instantly at: ${verifyUrl}`;

  return sendUniversalEmail({
    to: email,
    subject: `Verify your ${BRAND_NAME} account - Code: ${code}`,
    html,
    text,
  });
}

/**
 * Dispatch password reset email
 */
export async function sendPasswordResetEmail({
  email,
  name,
  token,
}: {
  email: string;
  name?: string;
  token: string;
}): Promise<SendEmailResult> {
  const siteUrl = getSiteUrl();
  const resetUrl = `${siteUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;

  const html = generatePasswordResetEmailHtml({ name, email, resetUrl, expiresInMinutes: 60 });
  const text = `Reset your ${BRAND_NAME} password by visiting: ${resetUrl}. This link expires in 60 minutes.`;

  return sendUniversalEmail({
    to: email,
    subject: `Reset your ${BRAND_NAME} password`,
    html,
    text,
  });
}

/**
 * Dispatch welcome email
 */
export async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string;
  name?: string;
}): Promise<SendEmailResult> {
  const siteUrl = getSiteUrl();
  const shopUrl = `${siteUrl}/`;

  const html = generateWelcomeEmailHtml({ name, email, shopUrl });
  const text = `Welcome to ${BRAND_NAME}! Your account is now active. Explore our store at: ${shopUrl}`;

  return sendUniversalEmail({
    to: email,
    subject: `Welcome to ${BRAND_NAME} - Account Active`,
    html,
    text,
  });
}

/**
 * Dispatch order confirmation email
 */
export async function sendOrderConfirmationEmail(order: Order): Promise<SendEmailResult> {
  const html = generateOrderEmailHtml(order);
  const text = `Thank you for your order #${order.orderNumber}! Your total is $${order.total.toFixed(2)}. Shipping to ${order.shippingAddress.fullName}, ${order.shippingAddress.city}.`;

  return sendUniversalEmail({
    to: order.customerEmail,
    subject: `Order Confirmation #${order.orderNumber} - ${BRAND_NAME}`,
    html,
    text,
  });
}
