import { NextResponse } from 'next/server';
import { saveOrder, updateOrderResendStatus } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/resend';
import { Order, OrderItem, ShippingAddress } from '@/lib/types';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, shippingAddress, userId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cannot checkout with an empty cart.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!shippingAddress || !shippingAddress.email || !shippingAddress.fullName || !shippingAddress.address) {
      return NextResponse.json(
        { error: 'Please provide complete shipping details including name, address and email.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Calculate totals - support both { product: Product, quantity } and { productId, productName, unitPrice, quantity }
    const orderItems: OrderItem[] = items.map((item: any) => {
      const prodId = item.product?.id || item.productId || 'prod-unknown';
      const prodName = item.product?.name || item.productName || 'Tech Gadget';
      const price = Number(item.product?.price ?? item.unitPrice ?? 0);
      const qty = Number(item.quantity || 1);
      const img = item.product?.imageUrl || item.imageUrl || '';
      return {
        productId: prodId,
        productName: prodName,
        unitPrice: price,
        quantity: qty,
        totalPrice: price * qty,
        imageUrl: img,
      };
    });

    const subtotal = orderItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const shippingFee = subtotal >= 150 ? 0 : 9.99;
    const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% estimated tax
    const total = Math.round((subtotal + shippingFee + tax) * 100) / 100;

    // Generate unique order ID and number
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ord_${Date.now()}_${randomSuffix}`;
    const orderNumber = `TH-${timestamp}-${randomSuffix}`;

    const order: Order = {
      id: orderId,
      orderNumber,
      userId: userId || null,
      customerName: shippingAddress.fullName,
      customerEmail: shippingAddress.email,
      shippingAddress: shippingAddress as ShippingAddress,
      items: orderItems,
      subtotal,
      shippingFee,
      tax,
      total,
      status: 'completed',
      paymentStatus: 'paid',
      resendStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    // 1. Persist order in Neon PostgreSQL
    console.log(`💾 Persisting order #${order.orderNumber} to database...`);
    const dbResult = await saveOrder(order);

    // 2. Dispatch Confirmation Email via Resend API
    console.log(`✉️ Dispatching order confirmation email to ${order.customerEmail} via Resend...`);
    const mailResult = await sendOrderConfirmationEmail(order);

    // 3. Update Resend status in database
    await updateOrderResendStatus(order.id, mailResult.status);
    order.resendStatus = mailResult.status;

    return NextResponse.json(
      {
        success: true,
        order,
        emailDelivery: {
          status: mailResult.status,
          messageId: mailResult.messageId,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Checkout processing error:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred during checkout.' },
      { status: 500, headers: corsHeaders }
    );
  }

}
