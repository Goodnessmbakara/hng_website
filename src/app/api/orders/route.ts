import { NextResponse } from 'next/server';
import { getOrders } from '@/lib/db';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email');

    // Prefer authenticated user's email, or query param, or return all recent orders
    const emailToFilter = session?.user?.email || emailParam || undefined;

    const orders = await getOrders(emailToFilter);
    return NextResponse.json({ success: true, orders }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
