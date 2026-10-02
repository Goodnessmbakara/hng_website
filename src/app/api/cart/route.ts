import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CartItem } from '@/lib/types';
import {
  getCartDb,
  addToCartDb,
  updateCartItemQuantityDb,
  removeFromCartDb,
  clearCartDb,
  getUserProfile,
} from '@/lib/db';
import { broadcastCartUpdate } from '@/lib/cart-events';

export const dynamic = 'force-dynamic';

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, Cache-Control, Pragma, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

/**
 * Resolves the canonical user ID across NextAuth sessions, mobile headers, and query parameters.
 * Guarantees cross-device consistency by looking up the database user profile if an email is present.
 */
async function resolveUserId(request: NextRequest, bodyUserId?: string): Promise<string | null> {
  const directId = (typeof bodyUserId === 'string' && bodyUserId.trim() ? bodyUserId.trim() : null) ||
    request.headers.get('x-user-id')?.trim() ||
    request.nextUrl.searchParams.get('userId')?.trim();

  if (directId && !directId.includes('@')) {
    return directId;
  }

  let email: string | null = null;
  let idFromAuth: string | null = null;

  try {
    const session = await auth();
    if (session?.user) {
      idFromAuth = session.user.id || null;
      email = session.user.email || null;
    }
  } catch (err) {
    // Non-fatal if session extraction fails in non-browser context
  }

  const rawId = idFromAuth || directId || null;

  // If email was not in session but rawId is formatted as an email
  if (!email && rawId && rawId.includes('@')) {
    email = rawId.toLowerCase();
  }

  // Canonicalize to database profile ID if email is available
  if (email) {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const profile = await getUserProfile(cleanEmail);
      if (profile?.id) {
        return profile.id;
      }
    } catch {
      // Fallback to rawId
    }
  }

  return rawId;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: true, items: [] },
        { headers: getCorsHeaders() }
      );
    }

    const items = await getCartDb(userId);
    return NextResponse.json(
      { success: true, items },
      { headers: getCorsHeaders() }
    );
  } catch (error: any) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch cart' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = await resolveUserId(request, body.userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User must be authenticated to sync cart' },
        { status: 401, headers: getCorsHeaders() }
      );
    }

    const { productId, quantity = 1, action = 'add' } = body;
    let items: CartItem[] = [];

    if (action === 'clear') {
      await clearCartDb(userId);
      items = [];
    } else if (action === 'remove') {
      if (!productId || typeof productId !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Valid productId is required for remove action' },
          { status: 400, headers: getCorsHeaders() }
        );
      }
      items = await removeFromCartDb(userId, productId.trim());
    } else if (action === 'update') {
      if (!productId || typeof productId !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Valid productId is required for update action' },
          { status: 400, headers: getCorsHeaders() }
        );
      }
      const parsedQty = Number.isFinite(Number(quantity)) ? Math.floor(Number(quantity)) : 1;
      if (parsedQty <= 0) {
        items = await removeFromCartDb(userId, productId.trim());
      } else {
        items = await updateCartItemQuantityDb(userId, productId.trim(), parsedQty);
      }
    } else {
      // Default: add
      if (!productId || typeof productId !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Valid productId is required for add action' },
          { status: 400, headers: getCorsHeaders() }
        );
      }
      const parsedQty = Number.isFinite(Number(quantity)) ? Math.max(1, Math.floor(Number(quantity))) : 1;
      items = await addToCartDb(userId, productId.trim(), parsedQty);
    }

    // Broadcast instant update to all connected devices (web tabs + mobile app)
    broadcastCartUpdate(userId, items);

    return NextResponse.json(
      { success: true, items },
      { headers: getCorsHeaders() }
    );
  } catch (error: any) {
    console.error('Error modifying cart:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error modifying cart' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = await resolveUserId(request, body.userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User must be authenticated' },
        { status: 401, headers: getCorsHeaders() }
      );
    }

    const productId = (
      (typeof body.productId === 'string' && body.productId.trim()) ||
      request.nextUrl.searchParams.get('productId')?.trim() ||
      null
    );

    let items: CartItem[] = [];
    if (productId) {
      items = await removeFromCartDb(userId, productId);
    } else {
      await clearCartDb(userId);
      items = [];
    }

    broadcastCartUpdate(userId, items);

    return NextResponse.json(
      { success: true, items },
      { headers: getCorsHeaders() }
    );
  } catch (error: any) {
    console.error('Error deleting from cart:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error deleting from cart' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

