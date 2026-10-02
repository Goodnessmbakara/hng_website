'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  RotateCw,
} from 'lucide-react';

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success state: show email confirmation screen
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = calculateStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please provide your name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Registration failed. Please try again.');
        setLoading(false);
      } else {
        // Show email confirmation step
        setRegisteredEmail(email.trim().toLowerCase());
        if (data.devCode) {
          setDevCode(data.devCode);
        }
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'A network error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setResending(true);
    setResendStatus(null);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setResendStatus('Verification email resent successfully! Check your inbox.');
        if (data.devCode) setDevCode(data.devCode);
      } else {
        setResendStatus(data.error || 'Failed to resend. Please wait a moment.');
      }
    } catch {
      setResendStatus('Failed to resend. Please check connection.');
    } finally {
      setResending(false);
    }
  };

  // If successfully registered, show confirmation step
  if (registeredEmail) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/60 text-center animate-in zoom-in-95 duration-200">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600/15 text-blue-400 border border-blue-500/30 mb-4 shadow-lg shadow-blue-500/20">
          <Send className="h-8 w-8 animate-pulse" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          Verify your email
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
          We&apos;ve dispatched a confirmation email with your single-use verification code to:
          <br />
          <strong className="text-blue-400 text-sm mt-1 inline-block font-mono bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
            {registeredEmail}
          </strong>
        </p>

        {devCode && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-950/40 border border-blue-800/60 text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Developer Preview Code:</span>
            </div>
            <div className="font-mono text-2xl font-black tracking-widest text-white text-center py-2 bg-slate-950 rounded-xl border border-slate-800">
              {devCode}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              (Shown automatically in local dev for instant frictionless testing)
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href={`/auth/verify-email?email=${encodeURIComponent(registeredEmail)}${devCode ? `&code=${encodeURIComponent(devCode)}` : ''}`}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all active:scale-[0.99]"
          >
            <span>Enter Verification Code</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 hover:bg-slate-800/80 py-2.5 text-xs font-semibold text-slate-300 transition-all active:scale-[0.99]"
          >
            <RotateCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
            <span>{resending ? 'Sending...' : 'Resend Verification Email'}</span>
          </button>
        </div>

        {resendStatus && (
          <p className="text-xs text-emerald-400 mt-4 animate-in fade-in">
            {resendStatus}
          </p>
        )}

        <div className="mt-6 pt-5 border-t border-slate-800 text-xs text-slate-400">
          Already verified?{' '}
          <Link href="/auth/signin" className="font-bold text-blue-400 hover:text-blue-300">
            Sign In now →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/60">
      
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-500 border border-blue-500/20 mb-3 shadow-inner">
          <UserPlus className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Create an account
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Join TechHaven for real-time cart sync, express checkout & tracking
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Google 1-Click Sign-Up */}
      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl })}
        className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-750 hover:border-slate-600 px-4 py-3 text-sm font-semibold text-slate-200 transition-all active:scale-[0.99] shadow-sm"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Sign up with Google</span>
      </button>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
          <span className="bg-slate-900/90 px-3 text-slate-500">
            Or with email & password
          </span>
        </div>
      </div>

      {/* Sign-Up Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="email"
              required
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Create Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Strength Bars */}
          {password.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <div className={`h-1 flex-1 rounded-full transition-colors ${strength >= 1 ? 'bg-red-500' : 'bg-slate-800'}`} />
              <div className={`h-1 flex-1 rounded-full transition-colors ${strength >= 2 ? 'bg-amber-500' : 'bg-slate-800'}`} />
              <div className={`h-1 flex-1 rounded-full transition-colors ${strength >= 3 ? 'bg-blue-500' : 'bg-slate-800'}`} />
              <div className={`h-1 flex-1 rounded-full transition-colors ${strength >= 4 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
              <span className="text-[10px] text-slate-400 ml-1">
                {strength <= 1 && 'Weak'}
                {strength === 2 && 'Fair'}
                {strength === 3 && 'Good'}
                {strength >= 4 && 'Strong'}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating your account...</span>
            </>
          ) : (
            <>
              <span>Create Free Account</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer link to sign in */}
      <div className="mt-6 text-center text-xs text-slate-400">
        Already have an account?{' '}
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-bold text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-4"
        >
          Sign in
        </Link>
      </div>

    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}
