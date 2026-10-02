'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(urlError ? 'Sign-in failed. Please verify your credentials.' : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password: password || undefined,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || 'Invalid email or password.');
        setLoading(false);
      } else {
        // Successful login: redirect
        window.location.href = callbackUrl;
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (demoEmail: string, demoName: string) => {
    setEmail(demoEmail);
    setPassword('Demo1234!');
    setLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        email: demoEmail,
        name: demoName,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        window.location.href = callbackUrl;
      }
    } catch (err: any) {
      setError(err?.message || 'Demo sign-in failed.');
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/60">
      
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-500 border border-blue-500/20 mb-3 shadow-inner">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Sign in to your TechHaven account to access saved cart & orders
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Google 1-Click Sign-In */}
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
        <span>Continue with Google</span>
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

      {/* Main Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Demo Switcher */}
      <div className="mt-6 pt-5 border-t border-slate-800/80">
        <p className="text-[11px] font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Quick 1-Click Demo Accounts:</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleDemoSignIn('demo.shopper@techhaven.com', 'Demo Shopper')}
            className="flex flex-col items-start p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-slate-700 transition-all text-left group"
          >
            <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
              Demo Shopper
            </span>
            <span className="text-[10px] text-slate-500 truncate w-full">
              demo.shopper@techhaven.com
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoSignIn('alice.tech@gmail.com', 'Alice Tech')}
            className="flex flex-col items-start p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-slate-700 transition-all text-left group"
          >
            <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
              Alice Tech
            </span>
            <span className="text-[10px] text-slate-500 truncate w-full">
              alice.tech@gmail.com
            </span>
          </button>
        </div>
      </div>

      {/* Footer link to sign up */}
      <div className="mt-6 text-center text-xs text-slate-400">
        Don&apos;t have an account yet?{' '}
        <Link
          href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-bold text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-4"
        >
          Create account
        </Link>
      </div>

    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
