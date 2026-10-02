import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const tokenOrCode = body.token || body.code;

    if (!tokenOrCode || typeof tokenOrCode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'A verification code or token is required.' },
        { status: 400 }
      );
    }

    const result = await verifyEmailToken(tokenOrCode.trim());

    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || 'Verification failed. The code may be invalid or expired.' },
        { status: 400 }
      );
    }

    // Send sleek welcome onboarding email
    sendWelcomeEmail({
      email: result.user.email,
      name: result.user.name || undefined,
    }).catch((err) => console.warn('Welcome email error:', err));

    return NextResponse.json({
      success: true,
      message: 'Your email address has been successfully verified!',
      user: result.user,
    });
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred during email verification.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || request.nextUrl.searchParams.get('code');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/auth/verify-email?status=error&message=No+token+provided`);
  }

  const result = await verifyEmailToken(token.trim());

  if (!result.success || !result.user) {
    const errorMsg = encodeURIComponent(result.error || 'Invalid or expired verification token');
    return NextResponse.redirect(`${siteUrl}/auth/verify-email?status=error&message=${errorMsg}`);
  }

  // Send onboarding welcome email on verification
  sendWelcomeEmail({
    email: result.user.email,
    name: result.user.name || undefined,
  }).catch((err) => console.warn('Welcome email error:', err));

  return NextResponse.redirect(`${siteUrl}/auth/verify-email?status=success&email=${encodeURIComponent(result.user.email)}`);
}
