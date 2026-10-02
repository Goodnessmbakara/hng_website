import { NextRequest, NextResponse } from 'next/server';
import { generateVerificationToken } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const tokenData = await generateVerificationToken(cleanEmail);

    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Account not found with this email.' },
        { status: 404 }
      );
    }

    if (tokenData.user.emailVerified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: 'This email address is already verified! You can sign in immediately.',
      });
    }

    await sendVerificationEmail({
      email: tokenData.user.email,
      name: tokenData.user.name || undefined,
      token: tokenData.token,
      code: tokenData.code,
    });

    return NextResponse.json({
      success: true,
      message: 'A fresh verification email and code has been sent.',
      devCode: process.env.NODE_ENV !== 'production' ? tokenData.code : undefined,
    });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resend verification email.' },
      { status: 500 }
    );
  }
}
