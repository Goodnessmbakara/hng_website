import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, name } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const regResult = await registerUser({
      email: email.trim().toLowerCase(),
      password,
      name: name ? String(name).trim() : undefined,
    });

    if (!regResult.success || !regResult.user) {
      return NextResponse.json(
        { success: false, error: regResult.error || 'Failed to create account.' },
        { status: 400 }
      );
    }

    // Dispatch sleek confirmation email
    let emailStatus = 'pending';
    if (regResult.token && regResult.code) {
      const emailResult = await sendVerificationEmail({
        email: regResult.user.email,
        name: regResult.user.name || undefined,
        token: regResult.token,
        code: regResult.code,
      });
      emailStatus = emailResult.status;
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully! A verification code has been dispatched to your email.',
        user: regResult.user,
        emailDelivery: emailStatus,
        // In local/preview development mode, include code for instant validation
        devCode: process.env.NODE_ENV !== 'production' ? regResult.code : undefined,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration endpoint error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred during registration.' },
      { status: 500 }
    );
  }
}
