import { NextResponse } from 'next/server';
import { saveOrder, updateOrderMailgunStatus } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/mailgun';
import { Order, OrderItem, ShippingAddress } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, shippingAddress, userId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cannot checkout with an empty cart.' },
        { status: 400 }
      );
    }

    if (!shippingAddress || !shippingAddress.email || !shippingAddress.fullName || !shippingAddress.address) {
      return NextResponse.json(
        { error: 'Please provide complete shipping details including name, address and email.' },
        { status: 400 }
      );
    }

    // Calculate totals
    const orderItems: OrderItem[] = items.map((item: any) => ({
      productId: item.product.id,
      productName: item.product.name,
      unitPrice: Number(item.product.price),
      quantity: Number(item.quantity),
      totalPrice: Number(item.product.price) * Number(item.quantity),
      imageUrl: item.product.imageUrl,
    }));

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
      mailgunStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    // 1. Persist order in Neon PostgreSQL
    console.log(`💾 Persisting order #${order.orderNumber} to database...`);
    const dbResult = await saveOrder(order);

    // 2. Dispatch Confirmation Email via Mailgun API
    console.log(`✉️ Dispatching order confirmation email to ${order.customerEmail} via Mailgun...`);
    const mailResult = await sendOrderConfirmationEmail(order);

    // 3. Update Mailgun status in database
    await updateOrderMailgunStatus(order.id, mailResult.status);
    order.mailgunStatus = mailResult.status;

    return NextResponse.json({
      success: true,
      order,
      emailDelivery: {
        status: mailResult.status,
        messageId: mailResult.messageId,
      },
    });
  } catch (error: any) {
    console.error('Checkout processing error:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred during checkout.' },
      { status: 500 }
    );
  }
}
