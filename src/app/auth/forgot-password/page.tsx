'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      setSubmitted(true);
      if (data.devToken) {
        setDevToken(data.devToken);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/60">
      
      {/* Icon & Title */}
      <div className="text-center mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3 shadow-inner">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Forgot your password?
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Enter your account email to receive secure single-use reset instructions
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {submitted ? (
        <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <h2 className="text-lg font-bold text-white">
            Instructions Sent
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            If an account exists with <strong className="text-slate-200">{email}</strong>, we have dispatched a password reset link. Please check your inbox and spam folder.
          </p>

          {devToken && (
            <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/60 text-left my-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Developer Direct Test Link:</span>
              </div>
              <Link
                href={`/auth/reset-password?token=${encodeURIComponent(devToken)}`}
                className="text-xs text-blue-400 hover:text-blue-300 underline break-all font-mono"
              >
                Click here to reset password with dev token →
              </Link>
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700 px-6 py-2.5 text-xs font-semibold text-white transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Sign In</span>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Account Email
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

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Dispatching instructions...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}

    </div>
  );
}
