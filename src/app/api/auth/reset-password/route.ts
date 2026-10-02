import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordWithToken } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token, password } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'A valid password reset token is required.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const resetResult = await resetPasswordWithToken(token.trim(), password);

    if (!resetResult.success || !resetResult.user) {
      return NextResponse.json(
        { success: false, error: resetResult.error || 'Failed to reset password.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully reset! You can now log in with your new password.',
      user: resetResult.user,
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred during password reset.' },
      { status: 500 }
    );
  }
}
