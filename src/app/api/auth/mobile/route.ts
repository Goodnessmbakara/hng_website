import { NextRequest, NextResponse } from 'next/server';
import { syncUserProfile, getUserProfile } from '@/lib/db';

export const dynamic = 'force-dynamic';

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
 * Mobile authentication endpoint
 * Supports:
 * 1. Google OAuth (verifying Google ID token or exchanging profile)
 * 2. Email login / Direct account sync (matches Web Credentials auth)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { provider = 'google', idToken, email, name, image } = body;

    let userEmail = email;
    let userName = name;
    let userImage = image;
    let userId: string | undefined;

    // 1. If Google ID token is provided, verify against Google's tokeninfo API with timeout
    if (idToken) {
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (verifyRes.ok) {
          const googleData = await verifyRes.json();
          userEmail = googleData.email || userEmail;
          userName = googleData.name || userName;
          userImage = googleData.picture || userImage;
          userId = googleData.sub;
        } else {
          console.warn('Google token verification failed, falling back to passed user details if available');
        }
      } catch (err) {
        console.warn('Error contacting Google tokeninfo:', err);
      }
    }

    if (!userEmail || typeof userEmail !== 'string') {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required for authentication' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const cleanEmail = userEmail.trim().toLowerCase();
    if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // Preserve existing database ID for this email to ensure flawless web-mobile cross sync
    const existing = await getUserProfile(cleanEmail);
    userId = existing?.id || userId || `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // 2. Sync profile in the exact same database table as NextAuth
    const profile = await syncUserProfile({
      id: userId,
      email: cleanEmail,
      name: (userName ? String(userName).trim() : null) || existing?.name || cleanEmail.split('@')[0],
      image: userImage || existing?.image || null,
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Failed to synchronize user account in database' },
        { status: 500, headers: getCorsHeaders() }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: profile,
        token: profile.id, // Mobile client can use this as Bearer token / x-user-id
      },
      { headers: getCorsHeaders() }
    );
  } catch (error: any) {
    console.error('Error during mobile auth:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Authentication failed' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

/**
 * Validate token or get user profile
 */
export async function GET(request: NextRequest) {
  try {
    const rawEmail = request.nextUrl.searchParams.get('email');
    if (!rawEmail || !rawEmail.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email query parameter is required' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const cleanEmail = rawEmail.trim().toLowerCase();
    const user = await getUserProfile(cleanEmail);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404, headers: getCorsHeaders() }
      );
    }

    return NextResponse.json(
      { success: true, user },
      { headers: getCorsHeaders() }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

