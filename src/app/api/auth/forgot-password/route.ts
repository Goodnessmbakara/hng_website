import { NextRequest, NextResponse } from 'next/server';
import { generatePasswordResetToken } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

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
    const resetData = await generatePasswordResetToken(cleanEmail);

    if (resetData) {
      await sendPasswordResetEmail({
        email: resetData.user.email,
        name: resetData.user.name || undefined,
        token: resetData.token,
      });
    }

    // Always return neutral positive response to prevent user enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, instructions to reset your password have been sent.',
      devToken: process.env.NODE_ENV !== 'production' && resetData ? resetData.token : undefined,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process password reset request.' },
      { status: 500 }
    );
  }
}
