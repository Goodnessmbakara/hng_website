import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getCartDb, getUserProfile } from '@/lib/db';
import { onCartUpdate } from '@/lib/cart-events';

export const dynamic = 'force-dynamic';

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, Cache-Control, Pragma, X-Requested-With',
  };
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const directId = searchParams.get('userId')?.trim() || request.headers.get('x-user-id')?.trim() || null;

  let userId: string | null = directId;
  let email: string | null = null;

  if (!userId || userId.includes('@')) {
    try {
      const session = await auth();
      if (session?.user) {
        userId = session.user.id || userId;
        email = session.user.email || null;
      }
    } catch {
      // Non-fatal if session extraction fails in non-browser context
    }
  }

  // If email is available or userId looks like an email, canonicalize with database profile
  if (!email && userId && userId.includes('@')) {
    email = userId.toLowerCase();
  }

  if (email) {
    try {
      const profile = await getUserProfile(email.trim().toLowerCase());
      if (profile?.id) {
        userId = profile.id;
      }
    } catch {
      // Fallback to userId
    }
  }

  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: 'Missing userId for cart stream' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(),
      },
    });
  }

  const encoder = new TextEncoder();
  const currentUserId = userId;

  let unsubscribe: (() => void) | null = null;
  let pingInterval: ReturnType<typeof setInterval> | null = null;
  let isCleanedUp = false;


  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    if (unsubscribe) {
      try {
        unsubscribe();
      } catch {
        // ignore
      }
      unsubscribe = null;
    }
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      // 1. Send initial cart state immediately
      try {
        const initialCart = await getCartDb(currentUserId);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'cart_sync', items: initialCart })}\n\n`)
        );
      } catch (err) {
        console.error('Failed to send initial cart in stream:', err);
      }

      // 2. Register real-time update listener
      unsubscribe = onCartUpdate(currentUserId, (items) => {
        if (isCleanedUp) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'cart_updated', items })}\n\n`)
          );
        } catch {
          cleanup();
        }
      });

      // 3. Heartbeat ping every 15 seconds to keep connection alive
      pingInterval = setInterval(() => {
        if (isCleanedUp) return;
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          cleanup();
        }
      }, 15000);

      // 4. Clean up on client disconnect / signal abort
      request.signal.addEventListener('abort', () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // ignore
        }
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      ...getCorsHeaders(),
    },
  });
}

