'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  RotateCw,
  MailCheck,
} from 'lucide-react';

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status');
  const initialMessage = searchParams.get('message');
  const initialEmail = searchParams.get('email') || '';
  const initialCode = searchParams.get('code') || '';
  const initialToken = searchParams.get('token') || '';

  const [code, setCode] = useState(initialCode);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(initialStatus === 'success');
  const [error, setError] = useState<string | null>(initialMessage || null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Auto-verify if full token or code was provided in URL query
  useEffect(() => {
    if (initialToken && !verified) {
      handleVerify(initialToken);
    } else if (initialCode && !verified) {
      handleVerify(initialCode);
    }
  }, [initialToken, initialCode]);

  const handleVerify = async (codeOrTokenToVerify?: string) => {
    const valueToUse = (codeOrTokenToVerify || code).trim();
    if (!valueToUse) {
      setError('Please enter your 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: valueToUse, code: valueToUse }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Verification failed. Code may be invalid or expired.');
      } else {
        setVerified(true);
      }
    } catch {
      setError('An error occurred during verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide your email address above to resend verification.');
      return;
    }

    setResending(true);
    setResendStatus(null);
    setError(null);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (data.success) {
        setResendStatus('A fresh verification code has been dispatched to your email.');
        if (data.devCode) {
          setCode(data.devCode);
        }
      } else {
        setError(data.error || 'Failed to resend code.');
      }
    } catch {
      setError('Failed to contact server. Please check your connection.');
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/60 text-center animate-in zoom-in-95 duration-200">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-4 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          Email Verified!
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
          Your email address has been confirmed successfully. Your TechHaven account is fully activated with real-time cart sync across all your devices.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all"
          >
            <span>Start Shopping Store</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/auth/signin"
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 hover:bg-slate-800/80 py-2.5 text-xs font-semibold text-slate-300 transition-all"
          >
            <span>Sign In to Account</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/60">
      
      <div className="text-center mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-500 border border-blue-500/20 mb-3 shadow-inner">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Confirm your email
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Enter the 6-digit confirmation code sent to your email inbox
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {resendStatus && (
        <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs text-emerald-300">
          {resendStatus}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-4">
        {/* Email input (for resend context or manual check) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Your Email Address
          </label>
          <input
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {/* 6-Digit Code Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            6-Digit Verification Code
          </label>
          <input
            type="text"
            required
            maxLength={10}
            placeholder="e.g. 482910"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
            className="w-full text-center font-mono text-2xl tracking-[0.3em] font-black rounded-2xl border border-slate-800 bg-slate-950/90 py-3 text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all uppercase"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying code...</span>
            </>
          ) : (
            <>
              <span>Confirm & Verify Email</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <RotateCw className={`h-3 w-3 ${resending ? 'animate-spin' : ''}`} />
            <span>Resend Code</span>
          </button>

          <Link href="/auth/signin" className="hover:text-white transition-colors">
            Return to Sign In
          </Link>
        </div>
      </form>

    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
